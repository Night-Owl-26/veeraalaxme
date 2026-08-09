const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const env = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiters");

const app = express();

// Behind a reverse proxy (nginx, Render, Railway, etc.) in production, so
// rate limiting and secure cookies read the real client IP/protocol.
app.set("trust proxy", 1);

// Security headers: CSP, HSTS, X-Frame-Options, etc.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", env.clientOrigin],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Locked to the configured frontend origin, with credentials enabled since
// auth relies on an httpOnly cookie for refresh + CSRF cookie.
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (env.nodeEnv !== "test") app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(generalLimiter);

// Uploaded images/docs, served statically (local-storage dev mode only —
// production should point STORAGE_PROVIDER at S3/Cloudinary instead).
app.use("/uploads", express.static(path.join(process.cwd(), env.storage.localUploadDir)));

app.get("/health", (req, res) => res.json({ ok: true, env: env.nodeEnv }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
