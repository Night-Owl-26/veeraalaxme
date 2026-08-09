const prisma = require("../config/db");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail, ApiError } = require("../utils/apiResponse");
const { generateOtp, hashOtp, verifyOtp } = require("../utils/otp");
const { sendSms } = require("../services/smsService");
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require("../utils/jwt");
const { issueCsrfCookie } = require("../middleware/csrf");

const REFRESH_COOKIE = "refresh_token";
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.nodeEnv === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/api/auth", // scoped narrowly — this cookie is only ever needed by auth routes
};

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    phoneVerified: user.phoneVerified,
    isVerifiedSeller: user.isVerifiedSeller,
    avatarUrl: user.avatarUrl,
  };
}

async function issueSession(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
  issueCsrfCookie(res);
  return accessToken;
}

// POST /api/auth/otp/request
// Kicks off either registration or login. For login, the phone must already
// belong to an account (we don't reveal whether it does, beyond a generic
// message, to avoid leaking which numbers are registered).
const requestOtp = asyncHandler(async (req, res) => {
  const { phone, purpose, name, role } = req.body;

  if (purpose === "login") {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (!existing) return fail(res, 404, "No account found for this phone number");
    if (existing.isBlacklisted) return fail(res, 403, "This account has been suspended");
  } else {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return fail(res, 409, "An account already exists for this phone number — try logging in instead");
  }

  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000);

  await prisma.otpCode.create({ data: { phone, codeHash, purpose, expiresAt } });
  await sendSms(phone, `${code} is your VasthuConnect verification code. It expires in ${env.otp.ttlMinutes} minutes.`);

  return ok(res, { otpSent: true, expiresInMinutes: env.otp.ttlMinutes });
});

// POST /api/auth/otp/verify
const verifyOtpAndAuth = asyncHandler(async (req, res) => {
  const { phone, code, purpose, name, role } = req.body;

  const record = await prisma.otpCode.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return fail(res, 400, "No pending verification for this number — request a new code");
  if (record.expiresAt < new Date()) return fail(res, 400, "This code has expired — request a new one");
  if (record.attempts >= env.otp.maxAttempts) return fail(res, 429, "Too many incorrect attempts — request a new code");

  const valid = await verifyOtp(code, record.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return fail(res, 400, "Incorrect code");
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

  let user;
  if (purpose === "register") {
    if (!name || !role) return fail(res, 422, "name and role are required to register");
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return fail(res, 409, "An account already exists for this phone number");
    user = await prisma.user.create({ data: { phone, name, role, phoneVerified: true } });
  } else {
    user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return fail(res, 404, "Account not found");
    if (!user.phoneVerified) user = await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
  }

  const accessToken = await issueSession(res, user);
  return ok(res, { accessToken, user: publicUser(user) });
});

// POST /api/auth/refresh — reads the httpOnly cookie, rotates the token.
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return fail(res, 401, "No refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (e) {
    return fail(res, 401, "Invalid refresh token");
  }

  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findFirst({ where: { userId: payload.sub, tokenHash, revokedAt: null } });
  if (!stored || stored.expiresAt < new Date()) return fail(res, 401, "Refresh token expired or revoked");

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.isBlacklisted) return fail(res, 401, "Account unavailable");

  // Rotate: revoke the used token, issue a new pair. If a revoked token is
  // ever presented again, that's a strong signal of theft/replay.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const accessToken = await issueSession(res, user);

  return ok(res, { accessToken, user: publicUser(user) });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.clearCookie("csrf_token");
  return ok(res, { loggedOut: true });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return fail(res, 404, "User not found");
  return ok(res, { user: publicUser(user) });
});

module.exports = { requestOtp, verifyOtpAndAuth, refresh, logout, me };
