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

module.exports = { generateOtp, hashOtp, verifyOtp };
