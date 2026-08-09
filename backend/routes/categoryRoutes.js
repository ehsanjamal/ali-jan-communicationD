const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadCategoryImage } = require('../middleware/uploadMiddleware');

// All admin category routes require a valid admin token
router.use(protectAdmin);

// GET /api/categories
router.get('/', getCategories);

// GET /api/categories/:id
router.get('/:id', getCategory);

// POST /api/categories  (multipart/form-data, optional single image)
router.post('/', uploadCategoryImage, createCategory);

// PUT /api/categories/:id
router.put('/:id', uploadCategoryImage, updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', deleteCategory);

module.exports = router;
