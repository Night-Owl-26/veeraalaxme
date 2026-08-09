const prisma = require("../config/db");
const { hammingDistance } = require("./storageService");

const DUPLICATE_IMAGE_THRESHOLD = 8; // out of 256 bits — lower means stricter
const RAPID_POST_WINDOW_MINUTES = 60;
const RAPID_POST_THRESHOLD = 5;

// Compares a newly uploaded image's perceptual hash against every existing
// listing photo. A close match strongly suggests a scraped/reused photo,
// which is one of the most common real-estate scam patterns.
async function findDuplicateImageMatch(pHash, excludePropertyId = null) {
  const existing = await prisma.propertyImage.findMany({
    where: excludePropertyId ? { propertyId: { not: excludePropertyId } } : {},
    select: { propertyId: true, pHash: true },
    take: 5000, // guard against unbounded scans on a very large catalog
  });

  for (const img of existing) {
    if (hammingDistance(pHash, img.pHash) <= DUPLICATE_IMAGE_THRESHOLD) {
      return img.propertyId;
    }
  }
  return null;
}

// A lightweight spam score, not a full ML pipeline: flags accounts posting
// unusually fast, and near-identical titles in the same city within a short
// window (a classic listing-farming pattern).
async function computeSpamScore({ sellerId, title, city }) {
  let score = 0;

  const recentCount = await prisma.property.count({
    where: { sellerId, createdAt: { gte: new Date(Date.now() - RAPID_POST_WINDOW_MINUTES * 60 * 1000) } },
  });
  if (recentCount >= RAPID_POST_THRESHOLD) score += 40;

  const similarTitle = await prisma.property.findFirst({
    where: {
      city,
      title: { equals: title, mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (similarTitle) score += 30;

  return score; // 0–100+; controller decides the threshold for auto-flagging
}

module.exports = { findDuplicateImageMatch, computeSpamScore, DUPLICATE_IMAGE_THRESHOLD };
