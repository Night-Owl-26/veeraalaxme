const crypto = require("crypto");
const bcrypt = require("bcryptjs");

function generateOtp() {
  // 6-digit numeric OTP, generated via crypto for unpredictability
  // (Math.random() is not appropriate for anything security-sensitive).
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

// Per-recipient throttle, independent of the IP-based rate limiter on the
// route. The route limiter is keyed by source IP, so an attacker rotating
// IPs (or just making a handful of requests from one) could otherwise spam
// OTP emails/SMS at one victim's address/number with no cap of its own —
// this closes that gap by tracking last-sent-time per recipient in memory.
const lastSentAt = new Map();
const OTP_RESEND_INTERVAL_MS = 45 * 1000;

function canSendOtp(recipientKey) {
  const last = lastSentAt.get(recipientKey);
  if (last && Date.now() - last < OTP_RESEND_INTERVAL_MS) return false;
  lastSentAt.set(recipientKey, Date.now());
  return true;
}

module.exports = { generateOtp, hashOtp, verifyOtp, canSendOtp };
