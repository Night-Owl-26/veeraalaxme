// Seeds the VastuRule table — the rule engine's source of truth (see
// src/services/vastuEngine.js). Idempotent: every rule has a stable `code`
// and this script upserts by that code, so it's safe to re-run after edits.
//
// Run with: npm run prisma:seed-vastu
//
// Content note: these rules encode commonly published, widely-taught
// Vastu Shastra heuristics (facing, entrance, plot shape, room placement by
// direction). Vastu traditions vary by region and lineage; where guidance is
// especially disputed we've marked confidence LOW rather than presenting it
// as settled. Nothing here is claimed to be scientifically validated — see
// the disclaimer shown alongside every analysis in the product.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TRADITION = "General Vastu Shastra";

function r(overrides) {
  return {
    propertyType: null,
    tradition: TRADITION,
    source: null,
    confidence: "MEDIUM",
    active: true,
    ...overrides,
  };
}

const RULES = [
  // ── Facing (LAND + HOME) ──────────────────────────────────────────
  r({ code: "facing-ne-positive", category: "facing", field: "facing", matchValues: ["NE"], severity: "POSITIVE", scoreWeight: 15, confidence: "HIGH",
    recommendation: "A northeast-facing plot or home is considered an excellent starting point — keep this corner open and uncluttered.",
    explanation: "Northeast facing is traditionally regarded as the most auspicious orientation, governed by Ishanya, the corner associated with clarity and the water element." }),
  r({ code: "facing-n-positive", category: "facing", field: "facing", matchValues: ["N"], severity: "POSITIVE", scoreWeight: 12,
    recommendation: "North-facing orientation is favorable — pair it with a well-placed entrance to reinforce it.",
    explanation: "North-facing plots are traditionally favored, associated with Kubera, the direction of wealth." }),
  r({ code: "facing-e-positive", category: "facing", field: "facing", matchValues: ["E"], severity: "POSITIVE", scoreWeight: 12,
    recommendation: "East-facing orientation is favorable — morning sunlight aligns well with this direction's traditional meaning.",
    explanation: "East-facing entrances receive the morning sun and are traditionally considered highly auspicious, associated with health and new beginnings." }),
  r({ code: "facing-nw-caution", category: "facing", field: "facing", matchValues: ["NW"], severity: "CAUTION", scoreWeight: -3,
    recommendation: "Northwest facing works well for rentals or transient use; for a primary residence, pay extra attention to entrance and room placement.",
    explanation: "Northwest facing is traditionally considered neutral-to-workable, associated with air and movement." }),
  r({ code: "facing-w-caution", category: "facing", field: "facing", matchValues: ["W"], severity: "CAUTION", scoreWeight: -5,
    recommendation: "West facing is workable — a well-defined, elevated entrance threshold helps balance it.",
    explanation: "West-facing plots are traditionally considered less auspicious than east or north, though widely lived in successfully with careful entrance placement." }),
  r({ code: "facing-se-caution", category: "facing", field: "facing", matchValues: ["SE"], severity: "CAUTION", scoreWeight: -5,
    recommendation: "Southeast facing benefits from a buffer zone (porch, landscaping) between the road and the entrance.",
    explanation: "Southeast (the Agni or fire corner) is traditionally considered acceptable but requires care, since this corner is associated with fire energy rather than entrances." }),
  r({ code: "facing-s-caution", category: "facing", field: "facing", matchValues: ["S"], severity: "CAUTION", scoreWeight: -8,
    recommendation: "South facing is traditionally considered more challenging — a well-lit, unobstructed entrance is recommended to offset it.",
    explanation: "South-facing plots are traditionally associated with Yama and considered to need more deliberate correction than other orientations." }),
  r({ code: "facing-sw-concern", category: "facing", field: "facing", matchValues: ["SW"], severity: "CONCERN", scoreWeight: -12,
    recommendation: "Southwest facing is traditionally considered difficult; if you already own this plot, focus corrective effort on entrance and interior room placement rather than the facing itself.",
    explanation: "Southwest, ruled by Nairutya, is traditionally considered among the most difficult orientations in Vastu Shastra." }),

  // ── Entrance (LAND + HOME) ────────────────────────────────────────
  r({ code: "entrance-ne-positive", category: "entrance", field: "entranceDir", matchValues: ["NE"], severity: "POSITIVE", scoreWeight: 18, confidence: "HIGH",
    recommendation: "Keep the northeast entrance well-lit and unobstructed to make the most of this placement.",
    explanation: "A northeast main entrance is one of the most widely recommended placements in Vastu Shastra, believed to invite positive energy and prosperity." }),
  r({ code: "entrance-n-positive", category: "entrance", field: "entranceDir", matchValues: ["N"], severity: "POSITIVE", scoreWeight: 14,
    recommendation: "A north-facing entrance is a strong choice — no changes needed.",
    explanation: "A north-facing entrance is traditionally associated with wealth and career growth." }),
  r({ code: "entrance-e-positive", category: "entrance", field: "entranceDir", matchValues: ["E"], severity: "POSITIVE", scoreWeight: 14,
    recommendation: "An east-facing entrance is a strong choice — no changes needed.",
    explanation: "An east-facing entrance is traditionally associated with health and new beginnings, aligned with the rising sun." }),
  r({ code: "entrance-w-caution", category: "entrance", field: "entranceDir", matchValues: ["W"], severity: "CAUTION", scoreWeight: -3,
    recommendation: "A west entrance benefits from a raised, well-defined threshold.",
    explanation: "A west-facing entrance is traditionally considered workable with the right threshold treatment." }),
  r({ code: "entrance-nw-caution", category: "entrance", field: "entranceDir", matchValues: ["NW"], severity: "CAUTION", scoreWeight: -4,
    recommendation: "A northwest entrance suits guest or secondary access well; consider it less ideal as the sole family entrance.",
    explanation: "Northwest entrances are traditionally considered acceptable for transient use but less ideal as the primary entrance." }),
  r({ code: "entrance-se-caution", category: "entrance", field: "entranceDir", matchValues: ["SE"], severity: "CAUTION", scoreWeight: -6,
    recommendation: "A southeast entrance benefits from a buffer such as a porch or landscaped transition.",
    explanation: "Southeast sits in the fire corner and is traditionally considered to need a transitional space at the entrance." }),
  r({ code: "entrance-s-caution", category: "entrance", field: "entranceDir", matchValues: ["S"], severity: "CAUTION", scoreWeight: -8,
    recommendation: "A south entrance benefits from being well-lit and free of overhangs or clutter.",
    explanation: "A south-facing entrance is traditionally considered to need remedial measures such as a well-lit, unobstructed threshold." }),
  r({ code: "entrance-sw-concern", category: "entrance", field: "entranceDir", matchValues: ["SW"], severity: "CONCERN", scoreWeight: -18, confidence: "HIGH",
    recommendation: "A southwest entrance is generally advised against; if unavoidable, many consultants recommend keeping it narrow and less trafficked than a secondary entrance elsewhere.",
    explanation: "A southwest main entrance is traditionally considered the least favorable placement in Vastu Shastra." }),

  // ── Plot (LAND) ───────────────────────────────────────────────────
  r({ code: "plot-shape-square-positive", category: "plot", propertyType: "LAND", field: "plotShape", matchValues: ["SQUARE"], severity: "POSITIVE", scoreWeight: 15, confidence: "HIGH",
    recommendation: "A square plot needs no shape-related correction.",
    explanation: "A square plot is traditionally considered the most balanced and auspicious shape, distributing directional energy evenly." }),
  r({ code: "plot-shape-rectangle-positive", category: "plot", propertyType: "LAND", field: "plotShape", matchValues: ["RECTANGLE"], severity: "POSITIVE", scoreWeight: 10,
    recommendation: "A rectangular plot is a solid, workable shape — aim for a length-to-width ratio no more than roughly 2:1.",
    explanation: "A rectangular plot with a reasonable proportion is traditionally considered favorable, second only to a square plot." }),
  r({ code: "plot-shape-l-shaped-concern", category: "plot", propertyType: "LAND", field: "plotShape", matchValues: ["L_SHAPED"], severity: "CONCERN", scoreWeight: -12,
    recommendation: "For an L-shaped plot, many consultants suggest treating the missing corner as unbuildable open space rather than trying to fully enclose it.",
    explanation: "An L-shaped plot creates a 'cut corner,' traditionally regarded as inauspicious in the missing direction." }),
  r({ code: "plot-shape-triangular-concern", category: "plot", propertyType: "LAND", field: "plotShape", matchValues: ["TRIANGULAR"], severity: "CONCERN", scoreWeight: -18,
    recommendation: "Triangular plots are traditionally considered to need significant corrective planning — consult a Vastu-aware architect before finalizing a layout.",
    explanation: "A triangular plot is traditionally considered one of the more challenging shapes due to its uneven directional angles." }),
  r({ code: "plot-shape-irregular-concern", category: "plot", propertyType: "LAND", field: "plotShape", matchValues: ["IRREGULAR"], severity: "CONCERN", scoreWeight: -15,
    recommendation: "For an irregular plot, focus corrective effort on keeping the northeast corner as open and regular as possible.",
    explanation: "An irregularly shaped plot is traditionally considered to disturb the balance of directional energy." }),
  r({ code: "plot-corner-caution", category: "plot", propertyType: "LAND", field: "cornerPlot", matchValues: ["YES"], severity: "CAUTION", scoreWeight: -4, confidence: "LOW",
    recommendation: "Opinions on corner plots vary by tradition — worth a conversation with a consultant rather than treating this as settled.",
    explanation: "Corner plots are viewed differently across Vastu lineages — some consider them favorable for commercial use and less so for residential use." }),
  r({ code: "plot-compound-wall-positive", category: "plot", propertyType: "LAND", field: "compoundWall", matchValues: ["YES"], severity: "POSITIVE", scoreWeight: 6,
    recommendation: "Keep the compound wall complete and roughly even in height on all sides.",
    explanation: "A complete compound wall is traditionally considered to help contain and stabilize a property's energy." }),
  r({ code: "parking-nw-positive", category: "plot", propertyType: "HOME", field: "parkingDir", matchValues: ["NW"], severity: "POSITIVE", scoreWeight: 10,
    recommendation: "Northwest parking placement needs no change.",
    explanation: "Northwest is traditionally considered the most favorable direction for parking or garage placement." }),
  r({ code: "parking-ne-concern", category: "plot", propertyType: "HOME", field: "parkingDir", matchValues: ["NE"], severity: "CONCERN", scoreWeight: -12,
    recommendation: "Consider relocating parking away from the northeast corner if the layout allows it.",
    explanation: "Parking in the northeast is traditionally discouraged, as this corner is meant to stay open and light." }),

  // ── Slope (LAND) ──────────────────────────────────────────────────
  r({ code: "slope-ne-positive", category: "slope", propertyType: "LAND", field: "slopeDir", matchValues: ["NE"], severity: "POSITIVE", scoreWeight: 15, confidence: "HIGH",
    recommendation: "This slope direction needs no correction.",
    explanation: "Land sloping downward toward the northeast is traditionally considered highly favorable, letting water naturally collect in the auspicious northeast corner." }),
  r({ code: "slope-n-positive", category: "slope", propertyType: "LAND", field: "slopeDir", matchValues: ["N"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "This slope direction is favorable.",
    explanation: "A gentle north-facing slope is traditionally considered favorable." }),
  r({ code: "slope-e-positive", category: "slope", propertyType: "LAND", field: "slopeDir", matchValues: ["E"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "This slope direction is favorable.",
    explanation: "A gentle east-facing slope is traditionally considered favorable." }),
  r({ code: "slope-s-caution", category: "slope", propertyType: "LAND", field: "slopeDir", matchValues: ["S"], severity: "CAUTION", scoreWeight: -6,
    recommendation: "Consider grading or landscaping to reduce the southward slope where practical.",
    explanation: "A southward slope is traditionally considered less favorable than one toward the northeast." }),
  r({ code: "slope-w-caution", category: "slope", propertyType: "LAND", field: "slopeDir", matchValues: ["W"], severity: "CAUTION", scoreWeight: -6,
    recommendation: "Consider grading or landscaping to reduce the westward slope where practical.",
    explanation: "A westward slope is traditionally considered less favorable than one toward the northeast." }),
  r({ code: "slope-sw-concern", category: "slope", propertyType: "LAND", field: "slopeDir", matchValues: ["SW"], severity: "CONCERN", scoreWeight: -15, confidence: "HIGH",
    recommendation: "A southwest-down slope is traditionally considered the hardest to correct — raising the southwest corner during construction is the usual remedy.",
    explanation: "Land sloping downward toward the southwest is traditionally considered unfavorable, directing energy away from the auspicious northeast." }),

  // ── Water source / septic (LAND + HOME) ──────────────────────────
  r({ code: "water-ne-positive", category: "water", field: "waterDir", matchValues: ["NE"], severity: "POSITIVE", scoreWeight: 15, confidence: "HIGH",
    recommendation: "Northeast is an excellent placement for a borewell, sump, or overhead tank — no change needed.",
    explanation: "Placing the water source in the northeast is traditionally considered the most auspicious placement, aligned with Varuna, the water deity." }),
  r({ code: "water-n-positive", category: "water", field: "waterDir", matchValues: ["N"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "This water source placement is favorable.",
    explanation: "North is traditionally considered a favorable placement for water sources." }),
  r({ code: "water-e-positive", category: "water", field: "waterDir", matchValues: ["E"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "This water source placement is favorable.",
    explanation: "East is traditionally considered a favorable placement for water sources." }),
  r({ code: "water-sw-concern", category: "water", field: "waterDir", matchValues: ["SW"], severity: "CONCERN", scoreWeight: -15,
    recommendation: "If relocating the water source is possible, northeast is the traditional target; if not, keep the southwest corner otherwise solid and heavy.",
    explanation: "A water source in the southwest is traditionally considered inauspicious, since this direction is meant to remain the heaviest, most stable part of the property." }),
  r({ code: "water-center-concern", category: "water", field: "waterDir", matchValues: ["CENTER"], severity: "CONCERN", scoreWeight: -18, confidence: "HIGH",
    recommendation: "A water source at the center of the plot is best relocated — the center (Brahmasthan) is traditionally meant to stay open.",
    explanation: "A water source at the center of the plot or home is traditionally considered one of the most significant Vastu defects." }),
  r({ code: "septic-nw-positive", category: "water", field: "septicDir", matchValues: ["NW"], severity: "POSITIVE", scoreWeight: 10,
    recommendation: "Northwest is a favorable septic tank placement — no change needed.",
    explanation: "Placing the septic tank in the northwest is traditionally considered favorable, aligned with the direction of waste and outward movement." }),
  r({ code: "septic-w-positive", category: "water", field: "septicDir", matchValues: ["W"], severity: "POSITIVE", scoreWeight: 6,
    recommendation: "West is a workable septic tank placement.",
    explanation: "West is traditionally considered an acceptable placement for waste-related fixtures." }),
  r({ code: "septic-center-concern", category: "water", field: "septicDir", matchValues: ["CENTER"], severity: "CONCERN", scoreWeight: -15,
    recommendation: "Relocate the septic tank away from the plot's center if at all possible.",
    explanation: "A septic tank at the center of the plot is traditionally advised against, since the Brahmasthan is meant to remain open and unobstructed." }),
  r({ code: "septic-ne-concern", category: "water", field: "septicDir", matchValues: ["NE"], severity: "CONCERN", scoreWeight: -20, confidence: "HIGH",
    recommendation: "A septic tank in the northeast is one of the higher-priority corrections to make if the layout allows relocating it.",
    explanation: "A septic tank in the northeast is traditionally considered a serious defect, since this corner is meant to be reserved for clean water and open space, not waste." }),

  // ── Kitchen (HOME) ────────────────────────────────────────────────
  r({ code: "kitchen-se-positive", category: "kitchen", propertyType: "HOME", field: "kitchenDir", matchValues: ["SE"], severity: "POSITIVE", scoreWeight: 18, confidence: "HIGH",
    recommendation: "Southeast is the classic kitchen placement — no change needed.",
    explanation: "The southeast (Agni corner) is traditionally considered the most auspicious kitchen location, aligned with the fire element." }),
  r({ code: "kitchen-e-positive", category: "kitchen", propertyType: "HOME", field: "kitchenDir", matchValues: ["E"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "East is a solid secondary choice for the kitchen.",
    explanation: "An east-facing kitchen is traditionally considered a favorable secondary option to the southeast." }),
  r({ code: "kitchen-nw-caution", category: "kitchen", propertyType: "HOME", field: "kitchenDir", matchValues: ["NW"], severity: "CAUTION", scoreWeight: -6,
    recommendation: "A northwest kitchen is workable — some traditions suggest it can correlate with higher household spending, so it's worth budgeting mindfully.",
    explanation: "A kitchen in the northwest is traditionally considered workable but less ideal than the fire corner." }),
  r({ code: "kitchen-sw-concern", category: "kitchen", propertyType: "HOME", field: "kitchenDir", matchValues: ["SW"], severity: "CONCERN", scoreWeight: -15,
    recommendation: "If remodeling is on the table, moving the kitchen toward the southeast is the traditional recommendation.",
    explanation: "A kitchen in the southwest is traditionally considered unfavorable — this heavy, stable direction doesn't suit the active fire element." }),
  r({ code: "kitchen-ne-concern", category: "kitchen", propertyType: "HOME", field: "kitchenDir", matchValues: ["NE"], severity: "CONCERN", scoreWeight: -18, confidence: "HIGH",
    recommendation: "A northeast kitchen is one of the higher-priority corrections to consider — fire and water elements are traditionally believed to conflict there.",
    explanation: "A kitchen placed in the northeast is traditionally considered a significant Vastu defect." }),

  // ── Bedroom (HOME) ────────────────────────────────────────────────
  r({ code: "bedroom-sw-positive", category: "bedroom", propertyType: "HOME", field: "masterBedroomDir", matchValues: ["SW"], severity: "POSITIVE", scoreWeight: 18, confidence: "HIGH",
    recommendation: "Southwest is the ideal master bedroom placement — no change needed.",
    explanation: "The southwest is traditionally considered the ideal location for the master bedroom, offering stability and undisturbed rest." }),
  r({ code: "bedroom-s-positive", category: "bedroom", propertyType: "HOME", field: "masterBedroomDir", matchValues: ["S"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "South is a favorable secondary choice for the master bedroom.",
    explanation: "A south-facing master bedroom is traditionally considered a favorable secondary option." }),
  r({ code: "bedroom-w-positive", category: "bedroom", propertyType: "HOME", field: "masterBedroomDir", matchValues: ["W"], severity: "POSITIVE", scoreWeight: 6,
    recommendation: "West is a workable choice for the master bedroom.",
    explanation: "A west-facing master bedroom is traditionally considered acceptable." }),
  r({ code: "bedroom-se-caution", category: "bedroom", propertyType: "HOME", field: "masterBedroomDir", matchValues: ["SE"], severity: "CAUTION", scoreWeight: -8,
    recommendation: "If the master bedroom must be in the southeast, some consultants suggest using it for a secondary bedroom instead once the layout allows.",
    explanation: "A bedroom in the southeast (fire corner) is traditionally considered to disturb sleep and is generally not recommended as the master bedroom." }),
  r({ code: "bedroom-ne-concern", category: "bedroom", propertyType: "HOME", field: "masterBedroomDir", matchValues: ["NE"], severity: "CONCERN", scoreWeight: -15,
    recommendation: "Consider using the northeast room for meditation, study, or the pooja room instead of the master bedroom.",
    explanation: "A master bedroom in the northeast is traditionally advised against, since this corner is meant for meditation and clarity rather than heavy sleep." }),

  // ── Pooja / prayer room (HOME) ───────────────────────────────────
  r({ code: "pooja-ne-positive", category: "pooja", propertyType: "HOME", field: "poojaDir", matchValues: ["NE"], severity: "POSITIVE", scoreWeight: 20, confidence: "HIGH",
    recommendation: "Northeast is the classic pooja room placement — no change needed.",
    explanation: "The northeast is traditionally regarded as the most sacred direction for a pooja room, aligned with Ishanya." }),
  r({ code: "pooja-e-positive", category: "pooja", propertyType: "HOME", field: "poojaDir", matchValues: ["E"], severity: "POSITIVE", scoreWeight: 12,
    recommendation: "East is a strong secondary choice for the pooja room.",
    explanation: "An east-facing pooja room is traditionally considered a strong secondary option to the northeast." }),
  r({ code: "pooja-n-positive", category: "pooja", propertyType: "HOME", field: "poojaDir", matchValues: ["N"], severity: "POSITIVE", scoreWeight: 10,
    recommendation: "North is a favorable choice for the pooja room.",
    explanation: "North is traditionally considered a favorable direction for a pooja room." }),
  r({ code: "pooja-sw-concern", category: "pooja", propertyType: "HOME", field: "poojaDir", matchValues: ["SW"], severity: "CONCERN", scoreWeight: -18, confidence: "HIGH",
    recommendation: "Relocating the pooja room toward the northeast is the traditional recommendation, even if it's a smaller space.",
    explanation: "A pooja room in the southwest is traditionally considered highly inauspicious, directly opposing the sacred northeast corner." }),

  // ── Staircase (HOME) ──────────────────────────────────────────────
  r({ code: "staircase-sw-positive", category: "staircase", propertyType: "HOME", field: "staircaseDir", matchValues: ["SW"], severity: "POSITIVE", scoreWeight: 12,
    recommendation: "Southwest is a favorable staircase placement — no change needed.",
    explanation: "A staircase in the southwest is traditionally considered favorable, adding weight and stability to this heavy direction." }),
  r({ code: "staircase-s-positive", category: "staircase", propertyType: "HOME", field: "staircaseDir", matchValues: ["S"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "South is a workable staircase placement.",
    explanation: "A south-facing staircase is traditionally considered acceptable." }),
  r({ code: "staircase-w-positive", category: "staircase", propertyType: "HOME", field: "staircaseDir", matchValues: ["W"], severity: "POSITIVE", scoreWeight: 8,
    recommendation: "West is a workable staircase placement.",
    explanation: "A west-facing staircase is traditionally considered acceptable." }),
  r({ code: "staircase-ne-concern", category: "staircase", propertyType: "HOME", field: "staircaseDir", matchValues: ["NE"], severity: "CONCERN", scoreWeight: -18, confidence: "HIGH",
    recommendation: "A staircase in the northeast is one of the higher-priority corrections — it's traditionally believed to block energy flow into the home.",
    explanation: "A staircase in the northeast is traditionally considered a serious defect, blocking the flow of positive energy into the home." }),
  r({ code: "staircase-center-concern", category: "staircase", propertyType: "HOME", field: "staircaseDir", matchValues: ["CENTER"], severity: "CONCERN", scoreWeight: -20, confidence: "HIGH",
    recommendation: "A central staircase is difficult to remedy without structural change — worth discussing with an architect early.",
    explanation: "A staircase at the center of the home is traditionally considered one of the most significant Vastu defects, obstructing the home's core energy." }),

  // ── Bathroom / toilet (HOME) ──────────────────────────────────────
  r({ code: "bathroom-nw-positive", category: "bathroom", propertyType: "HOME", field: "bathroomDir", matchValues: ["NW"], severity: "POSITIVE", scoreWeight: 10,
    recommendation: "Northwest is a favorable bathroom placement — no change needed.",
    explanation: "A bathroom in the northwest is traditionally considered a favorable placement." }),
  r({ code: "bathroom-w-positive", category: "bathroom", propertyType: "HOME", field: "bathroomDir", matchValues: ["W"], severity: "POSITIVE", scoreWeight: 6,
    recommendation: "West is a workable bathroom placement.",
    explanation: "A west-facing bathroom is traditionally considered acceptable." }),
  r({ code: "bathroom-sw-caution", category: "bathroom", propertyType: "HOME", field: "bathroomDir", matchValues: ["SW"], severity: "CAUTION", scoreWeight: -6,
    recommendation: "Southwest is traditionally reserved for the master bedroom — a bathroom here is workable but not ideal if the layout can be changed.",
    explanation: "A bathroom in the southwest is traditionally considered less ideal, since this direction is better reserved for the master bedroom." }),
  r({ code: "bathroom-ne-concern", category: "bathroom", propertyType: "HOME", field: "bathroomDir", matchValues: ["NE"], severity: "CONCERN", scoreWeight: -18, confidence: "HIGH",
    recommendation: "A bathroom in the northeast is one of the higher-priority corrections — this corner is traditionally meant to stay clean and open.",
    explanation: "A bathroom or toilet in the northeast is traditionally considered a major Vastu defect." }),
  r({ code: "bathroom-center-concern", category: "bathroom", propertyType: "HOME", field: "bathroomDir", matchValues: ["CENTER"], severity: "CONCERN", scoreWeight: -20, confidence: "HIGH",
    recommendation: "A central bathroom is difficult to remedy without structural change — worth discussing with an architect early.",
    explanation: "A bathroom at the center of the home is traditionally considered highly inauspicious." }),
];

async function main() {
  let created = 0;
  let updated = 0;
  for (const rule of RULES) {
    const existing = await prisma.vastuRule.findUnique({ where: { code: rule.code } });
    await prisma.vastuRule.upsert({
      where: { code: rule.code },
      update: rule,
      create: rule,
    });
    if (existing) updated++;
    else created++;
  }
  console.log(`Vastu rules seeded: ${created} created, ${updated} updated (${RULES.length} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
