const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const env = require("../config/env");

const uploadRoot = path.resolve(process.cwd(), env.storage.localUploadDir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

let cloudinary = null;
function getCloudinary() {
  if (cloudinary) return cloudinary;
  const { cloudName, apiKey, apiSecret } = env.storage.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary storage selected but CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET are not set");
  }
  cloudinary = require("cloudinary").v2;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

function uploadToCloudinary(buffer, options) {
  const cld = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

// Perceptual hash (simple average-hash over a 16x16 grayscale thumbnail).
// Used by fraudService to flag near-duplicate listing photos — a common
// pattern in scraped/scam listings that reuse another seller's photos.
async function perceptualHash(buffer) {
  const { data } = await sharp(buffer)
    .resize(16, 16, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
  let hash = "";
  for (const v of data) hash += v >= avg ? "1" : "0";
  return hash;
}

function hammingDistance(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

async function saveImage(buffer, originalName) {
  const ext = ".webp";
  const filename = `${crypto.randomUUID()}${ext}`;
  const optimized = await sharp(buffer).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const pHash = await perceptualHash(optimized);

  if (env.storage.provider === "cloudinary") {
    const result = await uploadToCloudinary(optimized, {
      folder: "vasthuconnect/properties",
      public_id: crypto.randomUUID(),
      resource_type: "image",
      format: "webp",
    });
    return { url: result.secure_url, pHash };
  }

  if (env.storage.provider === "s3") {
    // Swap in the AWS SDK here — kept out of the base dependency tree so the
    // project runs with zero cloud credentials in local dev.
    throw new Error("S3 storage selected but not wired up — see storageService.js");
  }

  const filepath = path.join(uploadRoot, filename);
  fs.writeFileSync(filepath, optimized);
  return { url: `/uploads/${filename}`, pHash };
}

// Extension is looked up from a fixed allowlist keyed on the (server-validated)
// mimetype — never derived from the client-supplied original filename. A
// filename is just a string an attacker fully controls; deriving the stored
// extension from it previously let a file declared "image/jpeg" but named
// "x.html" get written as "<uuid>.html" and served as text/html by
// express.static, i.e. attacker-controlled same-origin script execution.
const DOC_EXTENSION_BY_MIME = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png" };

async function saveDocument(buffer, mimetype) {
  const ext = DOC_EXTENSION_BY_MIME[mimetype];
  if (!ext) throw new Error("Unsupported document type");
  const filename = `${crypto.randomUUID()}${ext}`;

  if (env.storage.provider === "cloudinary") {
    const result = await uploadToCloudinary(buffer, {
      folder: "vasthuconnect/documents",
      public_id: crypto.randomUUID(),
      resource_type: "raw",
      type: "authenticated", // not publicly listable/guessable — signed URL required to read
    });
    return { url: result.secure_url };
  }

  if (env.storage.provider === "s3") {
    throw new Error("S3 storage selected but not wired up — see storageService.js");
  }

  fs.writeFileSync(path.join(uploadRoot, filename), buffer);
  return { url: `/uploads/${filename}` };
}

module.exports = { saveImage, saveDocument, perceptualHash, hammingDistance, uploadRoot };
