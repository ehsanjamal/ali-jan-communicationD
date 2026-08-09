const express = require('express');
const router = express.Router();

const {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadBannerImage } = require('../middleware/uploadMiddleware');

// All admin banner routes require a valid admin token
router.use(protectAdmin);

// GET /api/banners  (optional ?placement=slider|banner)
router.get('/', getBanners);

// GET /api/banners/:id
router.get('/:id', getBanner);

// POST /api/banners  (multipart/form-data, required image)
router.post('/', uploadBannerImage, createBanner);

// PUT /api/banners/:id
router.put('/:id', uploadBannerImage, updateBanner);

// DELETE /api/banners/:id
router.delete('/:id', deleteBanner);

module.exports = router;
