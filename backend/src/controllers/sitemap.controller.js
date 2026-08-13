const prisma = require("../config/db");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");

const STATIC_PATHS = ["/", "/vastu"];

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

// Generated from real, currently-APPROVED listings — never a static/stale
// file — so it never links Google to a listing that's since been taken down.
const getSitemap = asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000, // sitemap protocol's per-file cap
  });

  const base = env.clientOrigin;
  const urls = [
    ...STATIC_PATHS.map((p) => `<url><loc>${xmlEscape(base + p)}</loc><changefreq>daily</changefreq></url>`),
    ...properties.map(
      (p) => `<url><loc>${xmlEscape(`${base}/property/${p.slug}`)}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.set("Content-Type", "application/xml");
  res.send(xml);
});

module.exports = { getSitemap };
