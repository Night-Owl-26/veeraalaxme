const { z } = require("zod");

const direction = z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
const yesNo = z.boolean();

// Land Vastu — matches the fields vastuEngine.js knows how to score for
// propertyType "LAND". Everything is optional: a category only appears in
// the result if its field was actually supplied (see vastuEngine.js), so a
// partially-filled form still returns a real, honest partial analysis.
const landVastuSchema = z.object({
  plotLength: z.number().positive().max(100000).optional(),
  plotWidth: z.number().positive().max(100000).optional(),
  plotShape: z.enum(["SQUARE", "RECTANGLE", "L_SHAPED", "TRIANGULAR", "IRREGULAR"]).optional(),
  facing: direction.optional(),
  roadDirection: direction.optional(),
  roadWidth: z.number().positive().max(1000).optional(),
  cornerPlot: yesNo.optional(),
  entranceDir: direction.optional(),
  slopeDir: direction.optional(),
  waterDir: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW", "CENTER"]).optional(),
  septicDir: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW", "CENTER"]).optional(),
  compoundWall: yesNo.optional(),
  propertyId: z.string().uuid().optional(),
});

// Home Vastu — matches the fields vastuEngine.js knows how to score for
// propertyType "HOME".
const homeVastuSchema = z.object({
  facing: direction.optional(),
  entranceDir: direction.optional(),
  kitchenDir: direction.optional(),
  masterBedroomDir: direction.optional(),
  poojaDir: direction.optional(),
  staircaseDir: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW", "CENTER"]).optional(),
  bathroomDir: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW", "CENTER"]).optional(),
  waterDir: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW", "CENTER"]).optional(),
  septicDir: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW", "CENTER"]).optional(),
  parkingDir: direction.optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  propertyId: z.string().uuid().optional(),
});

module.exports = { landVastuSchema, homeVastuSchema };
