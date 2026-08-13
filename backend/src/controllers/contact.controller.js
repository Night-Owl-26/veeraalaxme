const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { sendEmail } = require("../services/emailService");

// POST /api/contact — a real, delivered email, not a stub. Sent to the
// address configured as CONTACT_EMAIL (falls back to the SMTP mailbox), with
// the submitter set as reply-to so replying from your inbox goes straight
// back to them.
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!env.email.contactTo) return fail(res, 503, "Contact form isn't configured yet — please use the phone number below instead.");

  await sendEmail(
    env.email.contactTo,
    `New contact form message from ${name}`,
    `From: ${name} <${email}>\n\n${message}`,
    { replyTo: `${name} <${email}>` }
  );

  return ok(res, { sent: true });
});

module.exports = { submitContact };
