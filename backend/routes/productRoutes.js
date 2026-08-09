const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadProductImages } = require('../middleware/uploadMiddleware');

// All admin product routes require a valid admin token
router.use(protectAdmin);

// GET /api/products  (list — supports ?type=&search=&page=&limit=)
router.get('/', getProducts);

// GET /api/products/:id
router.get('/:id', getProduct);

// POST /api/products  (multipart/form-data, up to 6 images)
router.post('/', uploadProductImages, createProduct);

// PUT /api/products/:id  (multipart/form-data)
router.put('/:id', uploadProductImages, updateProduct);

// DELETE /api/products/:id
router.delete('/:id', deleteProduct);

module.exports = router;
