const crypto = require("crypto");
const env = require("../config/env");

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(env.fieldEncryptionKey, "hex");

// Used for at-rest encryption of sensitive fields like survey numbers,
// per the product's own privacy requirement: never store or display the
// raw government registration number in the clear.
function encryptField(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptField(payload) {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function maskSurveyNumber(decrypted) {
  if (!decrypted || decrypted.length < 4) return "SY-••••-••••";
  return `SY-••••-${decrypted.slice(-4)}`;
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = { encryptField, decryptField, maskSurveyNumber, randomToken };
