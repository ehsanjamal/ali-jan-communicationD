const express = require('express');
const router = express.Router();

const { getPublicBrands } = require('../controllers/brandController');

// GET /api/public/brands  (storefront — only active brands)
router.get('/', getPublicBrands);

module.exports = router;
