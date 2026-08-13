const multer = require("multer");
const path = require("path");
const { ApiError } = require("../utils/apiResponse");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOC_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_DOC_BYTES = 15 * 1024 * 1024; // 15MB

// Files land in memory first so storageService can hash/resize/upload them
// without ever trusting the client-supplied filename or extension.
const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 20 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new ApiError(422, "Only JPEG, PNG or WEBP images are allowed"));
    cb(null, true);
  },
});

const docUpload = multer({
  storage,
  limits: { fileSize: MAX_DOC_BYTES, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_DOC_MIME.has(file.mimetype)) return cb(new ApiError(422, "Only PDF, JPEG or PNG documents are allowed"));
    cb(null, true);
  },
});

module.exports = { imageUpload, docUpload };
