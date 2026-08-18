export function formatPrice(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2).replace(/\.00$/, "").replace(/0$/, "")} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.00$/, "").replace(/0$/, "")} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function initials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// Property/document URLs come back in two shapes depending on STORAGE_PROVIDER
// on the backend: a relative path like "/uploads/xyz.webp" for local disk
// storage, or an already-complete URL like "https://res.cloudinary.com/..."
// for Cloudinary/S3. Only the relative form needs the API origin prepended —
// doing that unconditionally turns a Cloudinary URL into a broken one like
// "https://api.example.com/https://res.cloudinary.com/...".
export function resolveMediaUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
  return `${apiOrigin}${url}`;
}
