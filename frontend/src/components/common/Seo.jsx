import { Helmet } from "react-helmet-async";

export const SITE_NAME = "VeeraaLaxme Vastu";
export const DEFAULT_DESCRIPTION =
  "Buy and sell verified land, plots, apartments and villas in Chennai. Every listing shows a Vastu compatibility score, verified seller details, and direct chat with no brokers.";

const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";

// Centralizes title/description/canonical/OG/Twitter/JSON-LD so every page
// gets consistent, correct SEO tags without repeating the boilerplate —
// react-helmet-async merges these into <head> on render.
export default function Seo({ title, description = DEFAULT_DESCRIPTION, path = "", image, noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Buy & Sell Land and Property in Chennai, Vastu-Checked`;
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
