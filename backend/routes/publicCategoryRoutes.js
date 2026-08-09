const express = require('express');
const router = express.Router();

const { getPublicCategories } = require('../controllers/categoryController');

// GET /api/public/categories  (storefront — only active categories)
router.get('/', getPublicCategories);

module.exports = router;
