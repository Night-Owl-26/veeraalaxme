require("dotenv").config();

function required(name, fallback = undefined) {
  const raw = process.env[name];
  // Checked against the RAW env var, before the fallback is applied — a dev
  // fallback used to make `val` non-undefined even when the real variable
  // was never set, which meant this guard could never fire in production
  // for any call that passed a fallback (e.g. the JWT secrets below silently
  // ran on hardcoded, source-visible defaults if unset on a real deploy).
  if ((raw === undefined || raw === "") && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return raw || fallback;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  otp: {
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  },

  fieldEncryptionKey: required("FIELD_ENCRYPTION_KEY", "0".repeat(64)),

  sms: {
    provider: process.env.SMS_PROVIDER || "console",
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || "console",
    from: process.env.EMAIL_FROM || "VeeraaLaxme Vastu <noreply@veeralaxmevastu.com>",
    // Where the Contact page form gets delivered — defaults to the same
    // mailbox OTPs send from, since that's the one confirmed-working inbox;
    // point this at a dedicated support address once you set one up.
    contactTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // HTTP-based alternative to SMTP — sends over regular HTTPS, so it isn't
    // affected by cloud hosts (Render, Railway, etc.) blocking or dropping
    // outbound SMTP ports, which raw SMTP delivery can silently hang on for
    // minutes before failing. Set EMAIL_PROVIDER=resend to use this instead.
    resendApiKey: process.env.RESEND_API_KEY,
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || "local",
    localUploadDir: process.env.LOCAL_UPLOAD_DIR || "uploads",
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },

  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
  },

  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },

  rateLimit: {
    windowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15),
    maxAuth: Number(process.env.RATE_LIMIT_MAX_AUTH || 10),
    maxAi: Number(process.env.RATE_LIMIT_MAX_AI || 20),
    maxGeneral: Number(process.env.RATE_LIMIT_MAX_GENERAL || 300),
  },
};
