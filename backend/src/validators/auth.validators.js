const { z } = require("zod");

// Trim/lowercase BEFORE validating so "Test@Example.com " and "test@example.com"
// are recognized as the same identity — otherwise two accounts could be
// created for what a user considers "the same" phone/email, since Postgres
// unique constraints are exact-match (case- and whitespace-sensitive).
const phoneSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number")
);
const emailSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.string().email("Enter a valid email address")
);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

// Registration is a two-step flow: request an email OTP, then verify it.
// The client resubmits the full draft (name/phone/email/password/role) at
// both steps — nothing is persisted server-side between them — so the same
// shape is validated twice, once without the code and once with it.
const registerRequestOtpSchema = z.object({
  name: z.string().min(2).max(80),
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["BUYER", "SELLER"]),
});

const registerVerifyOtpSchema = registerRequestOtpSchema.extend({
  code: z.string().length(6),
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Enter your password"),
});

// Password reset, same two-step pattern as registration: request an email
// OTP (sent to the email already on file — never a client-supplied address,
// to prevent hijacking someone else's account), then verify + set a new password.
const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

const resetPasswordSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
  newPassword: passwordSchema,
});

module.exports = {
  phoneSchema,
  emailSchema,
  passwordSchema,
  registerRequestOtpSchema,
  registerVerifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
