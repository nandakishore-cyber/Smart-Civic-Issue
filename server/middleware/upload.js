const multer = require('multer');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_IMAGE_SIZE_BYTES) || 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error('Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
    callback(null, true);
  },
});

module.exports = upload;
