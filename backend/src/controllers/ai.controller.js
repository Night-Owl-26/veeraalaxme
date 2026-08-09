const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { generatePropertyDescription, generateVastuInsight } = require("../services/aiService");
const { stripHtml } = require("../middleware/sanitize");

// POST /api/ai/property-description — sellers only, rate-limited.
// The Anthropic API key never leaves this server; the client only ever
// talks to this endpoint.
const propertyDescription = asyncHandler(async (req, res) => {
  const { title, type, city, locality, areaLabel, facing } = req.body;
  try {
    const text = await generatePropertyDescription({
      title: stripHtml(title || ""), type, city: stripHtml(city || ""), locality: stripHtml(locality || ""), areaLabel, facing,
    });
    return ok(res, { text });
  } catch (e) {
    return fail(res, 502, "AI service is unavailable right now — please try again shortly");
  }
});

// POST /api/ai/vastu-insight
const vastuInsight = asyncHandler(async (req, res) => {
  const { facing, kitchenDir, poojaRoom } = req.body;
  try {
    const text = await generateVastuInsight({ facing, kitchenDir, poojaRoom });
    return ok(res, { text });
  } catch (e) {
    return fail(res, 502, "AI service is unavailable right now — please try again shortly");
  }
});

module.exports = { propertyDescription, vastuInsight };
