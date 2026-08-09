// Deterministic Vastu scoring engine.
//
// This is the single source of truth for Vastu scores — it never calls an
// LLM and never guesses. Given the same `rules` (loaded from the VastuRule
// table) and the same `input`, evaluateVastu() always returns the same
// output, which is what makes it independently unit-testable and what lets
// the AI layer explain a result instead of inventing one (see
// aiService.generateVastuExplanation).
//
// Model: every VastuRule is a single field/value check ("field X equals one
// of these values") scoped to a category (plot, facing, entrance, kitchen,
// bedroom, pooja, water, bathroom, staircase, slope) and optionally to a
// property type (LAND or HOME; null = both). A category only appears in the
// result if the caller actually supplied a value for at least one field a
// rule in that category inspects — we never invent a score for data that
// wasn't given.

const BASE_CATEGORY_SCORE = 70;
const MIN_SCORE = 30;
const MAX_SCORE = 100;

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? "YES" : "NO";
  const s = String(v).trim();
  return s === "" ? null : s.toUpperCase();
}

// rules: VastuRule[] (already filtered to active:true by the caller, or not —
// this function filters defensively too, since correctness shouldn't depend
// on the caller remembering).
function evaluateVastu({ type, input, rules }) {
  if (type !== "LAND" && type !== "HOME") {
    throw new Error(`evaluateVastu: type must be "LAND" or "HOME", got ${JSON.stringify(type)}`);
  }

  const applicableRules = rules.filter(
    (r) => r.active !== false && (r.propertyType === null || r.propertyType === undefined || r.propertyType === type)
  );

  // A category only enters the result if input actually supplies a value for
  // at least one field a rule in that category inspects.
  const scoredCategories = new Map(); // category -> score
  const firedRules = [];

  for (const rule of applicableRules) {
    const rawValue = input[rule.field];
    const value = normalizeValue(rawValue);
    if (value === null) continue; // no data for this field — rule doesn't apply, category not touched by it

    if (!scoredCategories.has(rule.category)) scoredCategories.set(rule.category, BASE_CATEGORY_SCORE);

    const matchValues = (rule.matchValues || []).map((v) => String(v).toUpperCase());
    if (matchValues.includes(value)) {
      scoredCategories.set(rule.category, scoredCategories.get(rule.category) + rule.scoreWeight);
      firedRules.push({
        ruleId: rule.id,
        code: rule.code,
        category: rule.category,
        severity: rule.severity,
        field: rule.field,
        matchedValue: value,
        weight: rule.scoreWeight,
        recommendation: rule.recommendation,
        explanation: rule.explanation,
        tradition: rule.tradition,
        source: rule.source ?? null,
        confidence: rule.confidence,
      });
    }
  }

  const categoryScores = {};
  for (const [category, score] of scoredCategories.entries()) {
    categoryScores[category] = clamp(Math.round(score), MIN_SCORE, MAX_SCORE);
  }

  const categoryValues = Object.values(categoryScores);
  const overallScore =
    categoryValues.length === 0
      ? null
      : clamp(Math.round(categoryValues.reduce((a, b) => a + b, 0) / categoryValues.length), MIN_SCORE, MAX_SCORE);

  const positiveFactors = firedRules.filter((r) => r.severity === "POSITIVE");
  const areasToReview = firedRules.filter((r) => r.severity === "CAUTION" || r.severity === "CONCERN");

  return {
    overallScore,
    categoryScores,
    firedRules,
    positiveFactors,
    areasToReview,
    hasSufficientData: categoryValues.length > 0,
  };
}

module.exports = { evaluateVastu, BASE_CATEGORY_SCORE, MIN_SCORE, MAX_SCORE };
