const express = require('express');
const router = express.Router();

const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');

const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadBrandLogo } = require('../middleware/uploadMiddleware');

// All admin brand routes require a valid admin token
router.use(protectAdmin);

// GET /api/brands
router.get('/', getBrands);

// GET /api/brands/:id
router.get('/:id', getBrand);

// POST /api/brands  (multipart/form-data, optional single logo)
router.post('/', uploadBrandLogo, createBrand);

// PUT /api/brands/:id
router.put('/:id', uploadBrandLogo, updateBrand);

// DELETE /api/brands/:id
router.delete('/:id', deleteBrand);

module.exports = router;
