const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { evaluateVastu } = require("../services/vastuEngine");
const { generateVastuExplanation } = require("../services/aiService");

async function loadActiveRules() {
  return prisma.vastuRule.findMany({ where: { active: true } });
}

function serializeAnalysis(a) {
  return {
    id: a.id,
    type: a.type,
    input: a.input,
    overallScore: a.overallScore,
    categoryScores: a.categoryScores,
    firedRules: a.firedRules,
    aiExplanation: a.aiExplanation,
    createdAt: a.createdAt,
  };
}

// Shared by both land and home analysis — runs the deterministic engine,
// persists the result (anonymously if the caller isn't logged in), and
// returns it. Deliberately does NOT call the AI layer here: the score and
// findings are complete and correct without it, and keeping this endpoint
// free of an AI dependency means it works even with no ANTHROPIC_API_KEY
// configured. Callers fetch a narrated explanation separately via
// POST /api/vastu/analyses/:id/explain.
async function runAnalysis(req, res, type) {
  const rules = await loadActiveRules();
  const { propertyId, ...input } = req.body;
  const result = evaluateVastu({ type, input, rules });

  const analysis = await prisma.vastuAnalysis.create({
    data: {
      userId: req.user?.id ?? null,
      propertyId: propertyId ?? null,
      type,
      input,
      overallScore: result.overallScore,
      categoryScores: result.categoryScores,
      firedRules: result.firedRules,
    },
  });

  return ok(res, {
    analysis: serializeAnalysis(analysis),
    positiveFactors: result.positiveFactors,
    areasToReview: result.areasToReview,
    hasSufficientData: result.hasSufficientData,
  }, 201);
}

// POST /api/vastu/land/analyze
const analyzeLand = asyncHandler(async (req, res) => runAnalysis(req, res, "LAND"));

// POST /api/vastu/home/analyze
const analyzeHome = asyncHandler(async (req, res) => runAnalysis(req, res, "HOME"));

async function loadOwnedAnalysis(req) {
  const analysis = await prisma.vastuAnalysis.findUnique({ where: { id: req.params.id } });
  if (!analysis) return { analysis: null, allowed: false };
  // Anonymous analyses (userId null) are viewable by anyone holding the
  // unguessable id — the same model as an anonymous share link. Analyses
  // tied to an account are restricted to that account or an admin.
  const allowed = !analysis.userId || analysis.userId === req.user?.id || req.user?.role === "ADMIN";
  return { analysis, allowed };
}

// GET /api/vastu/analyses/:id
const getAnalysis = asyncHandler(async (req, res) => {
  const { analysis, allowed } = await loadOwnedAnalysis(req);
  if (!analysis) return fail(res, 404, "Analysis not found");
  if (!allowed) return fail(res, 403, "You don't have permission to view this analysis");
  return ok(res, { analysis: serializeAnalysis(analysis) });
});

// GET /api/vastu/analyses — the current user's saved analyses ("Vastu Reports")
const listMyAnalyses = asyncHandler(async (req, res) => {
  const items = await prisma.vastuAnalysis.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return ok(res, { items: items.map(serializeAnalysis) });
});

// POST /api/vastu/analyses/:id/explain — generates (and caches) the AI
// narration of an already-computed analysis. Rate-limited by aiLimiter at
// the route level, same as the other AI endpoints.
const explainAnalysis = asyncHandler(async (req, res) => {
  const { analysis, allowed } = await loadOwnedAnalysis(req);
  if (!analysis) return fail(res, 404, "Analysis not found");
  if (!allowed) return fail(res, 403, "You don't have permission to view this analysis");

  if (analysis.aiExplanation) {
    return ok(res, { aiExplanation: analysis.aiExplanation, cached: true });
  }

  try {
    const aiExplanation = await generateVastuExplanation({
      type: analysis.type,
      overallScore: analysis.overallScore,
      categoryScores: analysis.categoryScores,
      firedRules: analysis.firedRules,
    });
    await prisma.vastuAnalysis.update({ where: { id: analysis.id }, data: { aiExplanation } });
    return ok(res, { aiExplanation, cached: false });
  } catch (e) {
    return fail(res, 502, "AI explanation is unavailable right now — the score and findings above are unaffected.");
  }
});

module.exports = { analyzeLand, analyzeHome, getAnalysis, listMyAnalyses, explainAnalysis };
