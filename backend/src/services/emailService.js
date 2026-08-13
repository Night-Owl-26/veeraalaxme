const env = require("../config/env");

// Pluggable email delivery. Dev default just logs the OTP to the server
// console so the whole auth flow works locally with zero external accounts.
// Flip EMAIL_PROVIDER to "smtp" and fill in credentials in .env to go live —
// works with any SMTP relay (Gmail App Password, SendGrid, Mailgun, etc).
async function sendEmail(toEmail, subject, message, { replyTo } = {}) {
  if (env.email.provider === "resend") {
    if (!env.email.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured (see backend/.env.example)");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.email.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.email.from, to: toEmail, subject, text: message, reply_to: replyTo }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Resend request failed (${res.status}): ${body.slice(0, 300)}`);
    }
    return { delivered: true, provider: "resend" };
  }

  if (env.email.provider === "smtp") {
    if (!env.email.smtp.host || !env.email.smtp.user || !env.email.smtp.pass) {
      throw new Error("SMTP credentials are not configured (see backend/.env.example)");
    }
    // Lazy-require so the nodemailer package path is only exercised if you actually use it.
    const nodemailer = require("nodemailer");
    const transport = nodemailer.createTransport({
      host: env.email.smtp.host,
      port: env.email.smtp.port,
      secure: env.email.smtp.port === 465,
      auth: { user: env.email.smtp.user, pass: env.email.smtp.pass },
      // Some cloud hosts block or silently drop outbound SMTP connections —
      // without an explicit cap, a blocked connection hangs on nodemailer's
      // ~2-minute default before failing. 15s turns that into a fast, clear
      // error instead of a request that looks frozen.
      connectionTimeout: 15000,
    });
    await transport.sendMail({ from: env.email.from, to: toEmail, subject, text: message, replyTo });
    return { delivered: true, provider: "smtp" };
  }

  // console provider — dev/test fallback
  console.log(`\n[EMAIL → ${toEmail}]${replyTo ? ` (reply-to: ${replyTo})` : ""} ${subject}\n${message}\n`);
  return { delivered: true, provider: "console" };
}

module.exports = { sendEmail };
