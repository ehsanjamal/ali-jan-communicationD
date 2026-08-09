const express = require('express');
const router = express.Router();

const {
  getPublicProducts,
  getPublicProductBySlug,
} = require('../controllers/productController');

// GET /api/public/products  (storefront — only active products)
router.get('/', getPublicProducts);

// GET /api/public/products/:slug
router.get('/:slug', getPublicProductBySlug);

module.exports = router;
