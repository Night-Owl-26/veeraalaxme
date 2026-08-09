const { z } = require("zod");

const facingEnum = z.enum(["N", "E", "S", "W"]);

const createPropertySchema = z.object({
  title: z.string().min(5).max(140),
  type: z.string().min(2).max(60),
  price: z.number().int().positive().max(10_000_000_000),
  priceUnit: z.string().max(20).optional(),
  negotiable: z.boolean().default(true),
  city: z.string().min(2).max(80),
  locality: z.string().min(2).max(120),
  areaLabel: z.string().min(1).max(60),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().int().min(0).max(50).optional().nullable(),

  facing: facingEnum,
  kitchenDir: facingEnum,
  entranceDir: facingEnum,
  poojaRoom: z.boolean().default(false),

  water: z.boolean().default(false),
  electricity: z.boolean().default(false),
  compoundWall: z.boolean().default(false),
  road: z.string().max(120).optional(),

  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  description: z.string().min(10).max(4000),
  surveyNumber: z.string().max(60).optional(),
  ownership: z.string().max(40).optional(),
  loanAvailable: z.boolean().default(false),

  // Honeypot field: real users never fill this (it's hidden via CSS on the
  // frontend). Bots that blindly fill every field trip this and get silently
  // rejected in the controller.
  website: z.string().max(0).optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const searchQuerySchema = z.object({
  q: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  types: z.string().optional(), // comma-separated
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  minVastu: z.coerce.number().int().min(0).max(100).optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["newest", "price_asc", "price_desc", "vastu_desc"]).default("newest"),
});

const commentSchema = z.object({ text: z.string().min(1).max(1000) });

const reportSchema = z.object({
  reason: z.enum(["fake_listing", "duplicate", "sold_already", "misleading_price", "spam", "other"]),
  details: z.string().max(1000).optional(),
});

const resolveReportSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED"]),
});

module.exports = { createPropertySchema, updatePropertySchema, searchQuerySchema, commentSchema, reportSchema, resolveReportSchema };
