const env = require("../config/env");

// Pluggable SMS delivery. Dev default just logs the OTP to the server console
// so the whole auth flow works locally with zero external accounts. Flip
// SMS_PROVIDER to "twilio" and fill in credentials in .env to go live.
async function sendSms(toPhone, message) {
  if (env.sms.provider === "twilio") {
    if (!env.sms.twilio.accountSid || !env.sms.twilio.authToken) {
      throw new Error("Twilio credentials are not configured (see backend/.env.example)");
    }
    // Lazy-require so the twilio package is only needed if you actually use it.
    const twilio = require("twilio")(env.sms.twilio.accountSid, env.sms.twilio.authToken);
    await twilio.messages.create({ to: toPhone, from: env.sms.twilio.fromNumber, body: message });
    return { delivered: true, provider: "twilio" };
  }

  // console provider — dev/test fallback
  console.log(`\n[SMS → ${toPhone}] ${message}\n`);
  return { delivered: true, provider: "console" };
}

module.exports = { sendSms };
