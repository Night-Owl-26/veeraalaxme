const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateVastu } = require("../vastuEngine");

function rule(overrides) {
  return {
    id: overrides.code,
    code: overrides.code,
    category: "facing",
    propertyType: null,
    field: "facing",
    matchValues: ["NE"],
    severity: "POSITIVE",
    scoreWeight: 10,
    recommendation: "Do X",
    explanation: "Because Y",
    tradition: "General Vastu Shastra",
    source: null,
    confidence: "MEDIUM",
    active: true,
    ...overrides,
  };
}

test("same input + same rules always produces the same score (deterministic)", () => {
  const rules = [rule({ code: "facing-ne-positive" })];
  const input = { facing: "NE" };
  const a = evaluateVastu({ type: "LAND", input, rules });
  const b = evaluateVastu({ type: "LAND", input, rules });
  assert.deepEqual(a, b);
});

test("a category only appears when the input actually supplies a value for it", () => {
  const rules = [
    rule({ code: "facing-ne-positive", category: "facing", field: "facing", matchValues: ["NE"] }),
    rule({ code: "kitchen-se-positive", category: "kitchen", field: "kitchenDir", matchValues: ["SE"], propertyType: "HOME" }),
  ];
  const result = evaluateVastu({ type: "HOME", input: { facing: "NE" }, rules });
  assert.deepEqual(Object.keys(result.categoryScores), ["facing"]);
  assert.equal(result.hasSufficientData, true);
});

test("no input data at all returns a null score, not an invented one", () => {
  const rules = [rule({ code: "facing-ne-positive" })];
  const result = evaluateVastu({ type: "LAND", input: {}, rules });
  assert.equal(result.overallScore, null);
  assert.equal(result.hasSufficientData, false);
  assert.deepEqual(result.firedRules, []);
});

test("LAND-only and HOME-only rules don't leak into the other property type", () => {
  const rules = [
    rule({ code: "plot-shape-regular", category: "plot", field: "plotShape", matchValues: ["SQUARE"], propertyType: "LAND" }),
  ];
  const homeResult = evaluateVastu({ type: "HOME", input: { plotShape: "SQUARE" }, rules });
  const landResult = evaluateVastu({ type: "LAND", input: { plotShape: "SQUARE" }, rules });
  assert.deepEqual(homeResult.categoryScores, {});
  assert.equal(landResult.categoryScores.plot, 80); // base 70 + weight 10
});

test("positive and concern rules move the category score in the right direction", () => {
  const rules = [
    rule({ code: "entrance-ne-positive", category: "entrance", field: "entranceDir", matchValues: ["NE"], severity: "POSITIVE", scoreWeight: 15 }),
    rule({ code: "entrance-sw-concern", category: "entrance", field: "entranceDir", matchValues: ["SW"], severity: "CONCERN", scoreWeight: -20 }),
  ];
  const good = evaluateVastu({ type: "LAND", input: { entranceDir: "NE" }, rules });
  const bad = evaluateVastu({ type: "LAND", input: { entranceDir: "SW" }, rules });
  assert.equal(good.categoryScores.entrance, 85);
  assert.equal(bad.categoryScores.entrance, 50);
  assert.equal(good.positiveFactors.length, 1);
  assert.equal(bad.areasToReview.length, 1);
});

test("scores are clamped to [30, 100]", () => {
  const rules = [
    rule({ code: "harsh-concern-1", field: "waterDir", matchValues: ["SE"], severity: "CONCERN", scoreWeight: -60, category: "water" }),
    rule({ code: "harsh-concern-2", field: "waterDir", matchValues: ["SE"], severity: "CONCERN", scoreWeight: -60, category: "water" }),
  ];
  const result = evaluateVastu({ type: "LAND", input: { waterDir: "SE" }, rules });
  assert.equal(result.categoryScores.water, 30);
});

test("inactive rules never fire", () => {
  const rules = [rule({ code: "inactive-rule", active: false })];
  const result = evaluateVastu({ type: "LAND", input: { facing: "NE" }, rules });
  assert.deepEqual(result.firedRules, []);
});

test("boolean-style fields normalize to YES/NO", () => {
  const rules = [rule({ code: "compound-wall-positive", category: "plot", field: "compoundWall", matchValues: ["YES"], propertyType: "LAND" })];
  const result = evaluateVastu({ type: "LAND", input: { compoundWall: true }, rules });
  assert.equal(result.firedRules.length, 1);
  assert.equal(result.firedRules[0].matchedValue, "YES");
});
