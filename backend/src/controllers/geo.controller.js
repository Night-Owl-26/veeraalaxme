const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const { geocodeSearch } = require("../services/geoService");

// GET /api/geo/search?q=... — address/locality search for the Post Property
// location picker. Proxied server-side because Nominatim requires a
// descriptive User-Agent header browsers won't let client-side fetch set,
// and because the 1 req/sec throttle needs to be enforced app-wide, not per-tab.
const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 3) return ok(res, { results: [] });
  const results = await geocodeSearch(q);
  return ok(res, { results });
});

module.exports = { search };
