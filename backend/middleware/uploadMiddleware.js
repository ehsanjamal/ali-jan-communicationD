const multer = require('multer');
const path = require('path');
const fs = require('fs');

const allowedTypes = /jpeg|jpg|png|webp|gif/;

const fileFilter = (req, file, cb) => {
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
  }
};

const makeStorage = (subfolder) => {
  const uploadDir = path.join(__dirname, '..', 'uploads', subfolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });
};

// Product images (up to 6 per product)
const uploadProductImages = multer({
  storage: makeStorage('products'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
}).array('images', 6);

// Category image (single, optional)
const uploadCategoryImage = multer({
  storage: makeStorage('categories'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

// Brand logo (single, optional)
const uploadBrandLogo = multer({
  storage: makeStorage('brands'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('logo');

// Banner image (single, required by controller validation)
const uploadBannerImage = multer({
  storage: makeStorage('banners'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

module.exports = { uploadProductImages, uploadCategoryImage, uploadBrandLogo, uploadBannerImage };
