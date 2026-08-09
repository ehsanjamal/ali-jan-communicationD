const express = require('express');
const router = express.Router();

const { getPublicBanners } = require('../controllers/bannerController');

// GET /api/public/banners  (storefront — only active banners, optional ?placement=)
router.get('/', getPublicBanners);

module.exports = router;
