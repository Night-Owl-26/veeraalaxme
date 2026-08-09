require("dotenv").config();

function required(name, fallback = undefined) {
  const val = process.env[name] ?? fallback;
  if (val === undefined && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
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

  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || "0".repeat(64),

  sms: {
    provider: process.env.SMS_PROVIDER || "console",
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
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
