const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail, ApiError } = require("../utils/apiResponse");
const { generateOtp, hashOtp, verifyOtp, canSendOtp } = require("../utils/otp");
const { sendEmail } = require("../services/emailService");
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require("../utils/jwt");
const { issueCsrfCookie } = require("../middleware/csrf");

// Compared against when a login attempt targets a phone number with no
// account (or no password set) at all, so that branch still pays the same
// bcrypt cost as a real wrong-password check. Skipping bcrypt entirely for
// unknown numbers would make "no such account" respond measurably faster
// than "wrong password" — an attacker could use that timing gap to
// enumerate registered phone numbers even though the error text is identical.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-safety-dummy-password", 10);

const REFRESH_COOKIE = "refresh_token";
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  // The deployed frontend and backend live on unrelated domains (Vercel +
  // Render), not same-site subdomains, so this cookie is inherently
  // cross-site. SameSite=Strict (or the default) makes browsers refuse to
  // even store a cookie set by a cross-site response in the first place —
  // not just withhold it on future requests — which silently broke every
  // session: login appeared to work, then vanished on the next page load
  // with no cookie ever saved. SameSite=None is required for a genuinely
  // cross-site cookie to persist at all, and browsers mandate Secure
  // alongside it (fine here — production is HTTPS end to end).
  sameSite: env.nodeEnv === "production" ? "none" : "strict",
  secure: env.nodeEnv === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/api/auth", // scoped narrowly — this cookie is only ever needed by auth routes
};

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
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
  // Also returned directly (not just set as a cookie) because the
  // double-submit pattern needs the frontend to read this value back —
  // and across the same cross-site domain split described above, JS on
  // the frontend's origin can never read a cookie that belongs to the
  // backend's domain via document.cookie, regardless of SameSite. Handing
  // it back in the response body sidesteps that entirely; the frontend
  // holds it in memory the same way it already holds the access token.
  const csrfToken = issueCsrfCookie(res);
  return { accessToken, csrfToken };
}

// POST /api/auth/register/request-otp
// Step 1 of registration: validate the phone/email aren't already taken,
// then email a 6-digit code. Nothing is persisted about the user yet — the
// account is only created once the code is verified.
const requestRegisterOtp = asyncHandler(async (req, res) => {
  const { phone, email } = req.body;

  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) return fail(res, 409, "An account already exists for this phone number — try logging in instead");

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) return fail(res, 409, "An account already exists for this email address — try logging in instead");

  if (!canSendOtp(email)) return fail(res, 429, "A code was already sent recently — please wait before requesting another");

  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000);

  await prisma.otpCode.create({ data: { email, codeHash, purpose: "register", expiresAt } });
  await sendEmail(
    email,
    "Your VeeraaLaxme Vastu verification code",
    `${code} is your VeeraaLaxme Vastu verification code. It expires in ${env.otp.ttlMinutes} minutes.`
  );

  return ok(res, { otpSent: true, expiresInMinutes: env.otp.ttlMinutes });
});

// POST /api/auth/register/verify-otp
// Step 2: verify the emailed code, then create the account with a hashed
// password and log the user straight in.
const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role, code } = req.body;

  const record = await prisma.otpCode.findFirst({
    where: { email, purpose: "register", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return fail(res, 400, "No pending verification for this email — request a new code");
  if (record.expiresAt < new Date()) return fail(res, 400, "This code has expired — request a new one");
  if (record.attempts >= env.otp.maxAttempts) return fail(res, 429, "Too many incorrect attempts — request a new code");

  const valid = await verifyOtp(code, record.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return fail(res, 400, "Incorrect code");
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

  // Re-check uniqueness — the OTP window gives a small race window for the
  // phone/email to have been claimed by someone else in the meantime.
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) return fail(res, 409, "An account already exists for this phone number");
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) return fail(res, 409, "An account already exists for this email address");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { phone, name, email, passwordHash, role, emailVerified: true },
  });

  const { accessToken, csrfToken } = await issueSession(res, user);
  return ok(res, { accessToken, csrfToken, user: publicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  // Same generic message whether the phone is unknown or the password is
  // wrong — this avoids leaking which phone numbers have accounts.
  const invalid = () => fail(res, 401, "Incorrect phone number or password");

  if (user?.isBlacklisted) return fail(res, 403, "This account has been suspended");

  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
  if (!user || !user.passwordHash || !valid) return invalid();

  const { accessToken, csrfToken } = await issueSession(res, user);
  return ok(res, { accessToken, csrfToken, user: publicUser(user) });
});

// POST /api/auth/password/forgot
// Always responds the same way regardless of whether the phone number has an
// account — otherwise this endpoint becomes a phone-number-existence oracle.
// The OTP goes to the email already on file, never a client-supplied one, so
// this can't be used to hijack an account by pointing resets at another inbox.
const forgotPassword = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const GENERIC_MESSAGE = "If that phone number has an account, we've sent a password reset code to the email on file.";

  const user = await prisma.user.findUnique({ where: { phone } });
  // Throttle check must never change the response shape (same generic
  // message either way) — otherwise a timing/response difference between
  // "throttled" and "no such account" would itself leak account existence.
  if (user && user.email && !user.isBlacklisted && canSendOtp(user.email)) {
    const code = generateOtp();
    const codeHash = await hashOtp(code);
    const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000);
    await prisma.otpCode.create({ data: { email: user.email, codeHash, purpose: "reset", expiresAt } });
    await sendEmail(
      user.email,
      "Your VeeraaLaxme Vastu password reset code",
      `${code} is your VeeraaLaxme Vastu password reset code. It expires in ${env.otp.ttlMinutes} minutes. If you didn't request this, you can ignore this email.`
    );
  }

  return ok(res, { message: GENERIC_MESSAGE });
});

// POST /api/auth/password/reset
const resetPassword = asyncHandler(async (req, res) => {
  const { phone, code, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.email) return fail(res, 400, "Invalid or expired code");

  const record = await prisma.otpCode.findFirst({
    where: { email: user.email, purpose: "reset", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return fail(res, 400, "No pending reset for this account — request a new code");
  if (record.expiresAt < new Date()) return fail(res, 400, "This code has expired — request a new one");
  if (record.attempts >= env.otp.maxAttempts) return fail(res, 429, "Too many incorrect attempts — request a new code");

  const valid = await verifyOtp(code, record.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return fail(res, 400, "Incorrect code");
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // A password reset invalidates every existing session — if the account was
  // compromised, this locks the attacker out along with everyone else.
  await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });

  return ok(res, { reset: true });
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
  const { accessToken, csrfToken } = await issueSession(res, user);

  return ok(res, { accessToken, csrfToken, user: publicUser(user) });
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

// GET /api/auth/csrf — bootstraps a CSRF token on a fresh page load, before
// any login has happened. The frontend holds the token value in memory (see
// client.js), which a full page reload always wipes clean — so without this,
// the very first silent-refresh attempt after any reload would have no
// token to send and get rejected, no matter how a returning user's session
// was otherwise valid. A plain GET needs no CSRF check of its own.
const csrf = asyncHandler(async (req, res) => {
  const csrfToken = issueCsrfCookie(res);
  return ok(res, { csrfToken });
});

module.exports = { requestRegisterOtp, verifyRegisterOtp, login, forgotPassword, resetPassword, refresh, logout, me, csrf };
