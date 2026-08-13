const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const windowMs = env.rateLimit.windowMinutes * 60 * 1000;

const baseOptions = {
  windowMs,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many requests — please slow down." } },
};

// Tighter limit on auth endpoints specifically to blunt credential-stuffing
// and OTP brute-force attempts.
const authLimiter = rateLimit({ ...baseOptions, max: env.rateLimit.maxAuth });

// AI proxy calls cost real money per token, so this gets its own ceiling
// independent of general API traffic.
const aiLimiter = rateLimit({ ...baseOptions, max: env.rateLimit.maxAi });

// General API traffic.
const generalLimiter = rateLimit({ ...baseOptions, max: env.rateLimit.maxGeneral });

// Geocoding/nearby-places hit free public OSM services (Nominatim/Overpass)
// with strict shared-fair-use policies — kept tight so one client can't back
// up the shared request queue for everyone else.
const geoLimiter = rateLimit({ ...baseOptions, max: env.rateLimit.maxAi });

// Property submissions: a basic spam-protection backstop beyond the honeypot
// field and duplicate-detection heuristics in fraudService.
const postPropertyLimiter = rateLimit({ ...baseOptions, windowMs: 60 * 60 * 1000, max: 5 });

module.exports = { authLimiter, aiLimiter, generalLimiter, postPropertyLimiter, geoLimiter };
