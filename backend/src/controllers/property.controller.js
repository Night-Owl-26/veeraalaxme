const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { encryptField, decryptField, maskSurveyNumber } = require("../utils/crypto");
const { saveImage, saveDocument } = require("../services/storageService");
const { findDuplicateImageMatch, computeSpamScore } = require("../services/fraudService");
const { notify } = require("../services/notificationService");

function computeVastuScore({ facing, kitchenDir, poojaRoom, water }) {
  const base = { N: 85, E: 90, S: 60, W: 65 }[facing] ?? 70;
  let score = base;
  if (poojaRoom) score += 5;
  if (kitchenDir === "S") score += 4; else score -= 2;
  if (water) score += 2;
  return Math.max(40, Math.min(98, Math.round(score)));
}

function serializeProperty(p, { includeSurveyNumber = false } = {}) {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    price: p.price,
    priceUnit: p.priceUnit,
    negotiable: p.negotiable,
    city: p.city,
    locality: p.locality,
    areaLabel: p.areaLabel,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    vastu: { score: p.vastuScore, facing: p.facing, kitchenDir: p.kitchenDir, entranceDir: p.entranceDir, poojaRoom: p.poojaRoom },
    amenities: { water: p.water, electricity: p.electricity, compoundWall: p.compoundWall, road: p.road },
    location: p.latitude && p.longitude ? { lat: p.latitude, lng: p.longitude } : null,
    description: p.description,
    surveyNumber: includeSurveyNumber && p.surveyNumberEnc ? maskSurveyNumber(decryptField(p.surveyNumberEnc)) : undefined,
    ownership: p.ownership,
    loanAvailable: p.loanAvailable,
    documentsVerified: p.documentsVerified,
    status: p.status,
    rejectionReason: p.rejectionReason,
    likes: p.likesCount,
    viewCount: p.viewCount,
    createdAt: p.createdAt,
    images: (p.images || []).map((i) => ({ id: i.id, url: i.url, isPrimary: i.isPrimary })),
    documents: (p.documents || []).map((d) => ({ id: d.id, url: d.url, label: d.label, verified: d.verified })),
    comments: (p.comments || []).map((c) => ({ id: c.id, text: c.text, createdAt: c.createdAt, user: { id: c.user.id, name: c.user.name } })),
    seller: p.seller
      ? { id: p.seller.id, name: p.seller.name, verified: p.seller.isVerifiedSeller, phone: p.seller.phone }
      : undefined,
    _liked: p._liked,
    _saved: p._saved,
  };
}

const PROPERTY_INCLUDE = {
  images: true,
  documents: true,
  comments: { include: { user: true }, orderBy: { createdAt: "asc" }, take: 50 },
  seller: true,
};

// GET /api/properties — public search/filter/paginate
const listProperties = asyncHandler(async (req, res) => {
  const { q, city, types, minPrice, maxPrice, minVastu, verifiedOnly, bedrooms, page, pageSize, sort } = req.query;

  const where = { status: "APPROVED" };
  if (city) where.city = city;
  if (types) where.type = { in: types.split(",").filter(Boolean) };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (minVastu !== undefined) where.vastuScore = { gte: minVastu };
  if (bedrooms !== undefined) where.bedrooms = bedrooms;
  if (verifiedOnly) where.seller = { isVerifiedSeller: true };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { locality: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "price_asc" ? { price: "asc" } :
    sort === "price_desc" ? { price: "desc" } :
    sort === "vastu_desc" ? { vastuScore: "desc" } :
    { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where, orderBy, include: PROPERTY_INCLUDE,
      skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  let likedIds = new Set(), savedIds = new Set();
  if (req.user) {
    const [likes, saves] = await Promise.all([
      prisma.like.findMany({ where: { userId: req.user.id, propertyId: { in: items.map((i) => i.id) } } }),
      prisma.savedProperty.findMany({ where: { userId: req.user.id, propertyId: { in: items.map((i) => i.id) } } }),
    ]);
    likedIds = new Set(likes.map((l) => l.propertyId));
    savedIds = new Set(saves.map((s) => s.propertyId));
  }

  const data = items.map((p) => serializeProperty({ ...p, _liked: likedIds.has(p.id), _saved: savedIds.has(p.id) }));
  return ok(res, { items: data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

// GET /api/properties/mine — seller's own listings, any status
const listMyProperties = asyncHandler(async (req, res) => {
  const items = await prisma.property.findMany({
    where: { sellerId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: PROPERTY_INCLUDE,
  });
  return ok(res, { items: items.map((p) => serializeProperty(p, { includeSurveyNumber: true })) });
});

// GET /api/properties/:id
const getProperty = asyncHandler(async (req, res) => {
  const p = await prisma.property.findUnique({ where: { id: req.params.id }, include: PROPERTY_INCLUDE });
  if (!p) return fail(res, 404, "Listing not found");

  const isOwnerOrAdmin = req.user && (req.user.id === p.sellerId || req.user.role === "ADMIN");
  if (p.status !== "APPROVED" && !isOwnerOrAdmin) return fail(res, 404, "Listing not found");

  if (p.status === "APPROVED") {
    await prisma.property.update({ where: { id: p.id }, data: { viewCount: { increment: 1 } } });
  }

  let liked = false, saved = false;
  if (req.user) {
    const [l, s] = await Promise.all([
      prisma.like.findUnique({ where: { propertyId_userId: { propertyId: p.id, userId: req.user.id } } }),
      prisma.savedProperty.findUnique({ where: { propertyId_userId: { propertyId: p.id, userId: req.user.id } } }),
    ]);
    liked = !!l; saved = !!s;
  }

  return ok(res, { property: serializeProperty({ ...p, _liked: liked, _saved: saved }, { includeSurveyNumber: isOwnerOrAdmin }) });
});

// POST /api/properties — sellers only
const createProperty = asyncHandler(async (req, res) => {
  const body = req.body;

  // Honeypot: a real browser never fills this hidden field.
  if (body.website) return fail(res, 400, "Submission rejected");

  const vastuScore = computeVastuScore(body);
  const spamScore = await computeSpamScore({ sellerId: req.user.id, title: body.title, city: body.city });

  const property = await prisma.property.create({
    data: {
      sellerId: req.user.id,
      title: body.title, type: body.type, price: body.price, priceUnit: body.priceUnit,
      negotiable: body.negotiable, city: body.city, locality: body.locality, areaLabel: body.areaLabel,
      bedrooms: body.bedrooms ?? null, bathrooms: body.bathrooms ?? null,
      facing: body.facing, kitchenDir: body.kitchenDir, entranceDir: body.entranceDir, poojaRoom: body.poojaRoom,
      vastuScore,
      water: body.water, electricity: body.electricity, compoundWall: body.compoundWall, road: body.road,
      latitude: body.latitude, longitude: body.longitude,
      description: body.description,
      surveyNumberEnc: body.surveyNumber ? encryptField(body.surveyNumber) : null,
      ownership: body.ownership, loanAvailable: body.loanAvailable,
      status: spamScore >= 40 ? "PENDING" : "PENDING", // always PENDING; spamScore just informs admin triage
      spamScore,
    },
    include: PROPERTY_INCLUDE,
  });

  return ok(res, { property: serializeProperty(property, { includeSurveyNumber: true }) }, 201);
});

// PATCH /api/properties/:id — owner or admin
const updateProperty = asyncHandler(async (req, res) => {
  const existing = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 404, "Listing not found");

  const body = req.body;
  const data = { ...body };
  delete data.website;
  if (body.surveyNumber !== undefined) {
    data.surveyNumberEnc = body.surveyNumber ? encryptField(body.surveyNumber) : null;
    delete data.surveyNumber;
  }

  // Any material edit sends it back for re-review rather than silently
  // keeping an old approval on new content.
  if (existing.status === "APPROVED") data.status = "PENDING";

  const updated = await prisma.property.update({ where: { id: req.params.id }, data, include: PROPERTY_INCLUDE });
  return ok(res, { property: serializeProperty(updated, { includeSurveyNumber: true }) });
});

// DELETE /api/properties/:id — owner or admin
const deleteProperty = asyncHandler(async (req, res) => {
  await prisma.property.delete({ where: { id: req.params.id } });
  return ok(res, { deleted: true });
});

// POST /api/properties/:id/images — owner only, multipart
const uploadImages = asyncHandler(async (req, res) => {
  const property = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!property) return fail(res, 404, "Listing not found");
  if (property.sellerId !== req.user.id && req.user.role !== "ADMIN") return fail(res, 403, "Not your listing");

  const files = req.files || [];
  if (files.length === 0) return fail(res, 400, "No images provided");

  const results = [];
  let flaggedDuplicateOf = null;

  for (const file of files) {
    const { url, pHash } = await saveImage(file.buffer, file.originalname);
    const dup = await findDuplicateImageMatch(pHash, property.id);
    if (dup) flaggedDuplicateOf = dup;
    const img = await prisma.propertyImage.create({
      data: { propertyId: property.id, url, pHash, isPrimary: results.length === 0 },
    });
    results.push(img);
  }

  if (flaggedDuplicateOf) {
    await prisma.property.update({ where: { id: property.id }, data: { possibleDuplicateOf: flaggedDuplicateOf, status: "PENDING" } });
  }

  return ok(res, { images: results.map((i) => ({ id: i.id, url: i.url, isPrimary: i.isPrimary })), flaggedPossibleDuplicate: !!flaggedDuplicateOf }, 201);
});

// POST /api/properties/:id/documents — owner only, multipart
const uploadDocuments = asyncHandler(async (req, res) => {
  const property = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!property) return fail(res, 404, "Listing not found");
  if (property.sellerId !== req.user.id && req.user.role !== "ADMIN") return fail(res, 403, "Not your listing");

  const files = req.files || [];
  if (files.length === 0) return fail(res, 400, "No documents provided");

  const results = [];
  for (const file of files) {
    const { url } = await saveDocument(file.buffer, file.originalname, file.mimetype);
    const doc = await prisma.propertyDocument.create({
      data: { propertyId: property.id, url, label: req.body.label || file.originalname },
    });
    results.push(doc);
  }
  return ok(res, { documents: results }, 201);
});

// POST /api/properties/:id/like — toggle
const toggleLike = asyncHandler(async (req, res) => {
  const propertyId = req.params.id;
  const existing = await prisma.like.findUnique({ where: { propertyId_userId: { propertyId, userId: req.user.id } } });

  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.property.update({ where: { id: propertyId }, data: { likesCount: { decrement: 1 } } }),
    ]);
    return ok(res, { liked: false });
  }

  const [, property] = await prisma.$transaction([
    prisma.like.create({ data: { propertyId, userId: req.user.id } }),
    prisma.property.update({ where: { id: propertyId }, data: { likesCount: { increment: 1 } } }),
  ]);

  if (property.sellerId !== req.user.id) {
    await notify(req.app.get("io"), {
      userId: property.sellerId, type: "LIKE", message: `${req.user.name} liked your listing "${property.title}"`, link: `/property/${propertyId}`,
    });
  }
  return ok(res, { liked: true });
});

// POST /api/properties/:id/save — toggle
const toggleSave = asyncHandler(async (req, res) => {
  const propertyId = req.params.id;
  const existing = await prisma.savedProperty.findUnique({ where: { propertyId_userId: { propertyId, userId: req.user.id } } });
  if (existing) {
    await prisma.savedProperty.delete({ where: { id: existing.id } });
    return ok(res, { saved: false });
  }
  await prisma.savedProperty.create({ data: { propertyId, userId: req.user.id } });
  return ok(res, { saved: true });
});

// GET /api/properties/saved
const listSaved = asyncHandler(async (req, res) => {
  const saves = await prisma.savedProperty.findMany({
    where: { userId: req.user.id },
    include: { property: { include: PROPERTY_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, { items: saves.map((s) => serializeProperty({ ...s.property, _saved: true })) });
});

module.exports = {
  listProperties, listMyProperties, getProperty, createProperty, updateProperty, deleteProperty,
  uploadImages, uploadDocuments, toggleLike, toggleSave, listSaved, computeVastuScore, serializeProperty, PROPERTY_INCLUDE,
};
