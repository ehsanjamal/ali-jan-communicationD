const express = require('express');
const router = express.Router();

const {
  getOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
} = require('../controllers/offerController');

const { protectAdmin } = require('../middleware/authMiddleware');

// All admin offer routes require a valid admin token
router.use(protectAdmin);

// GET /api/offers
router.get('/', getOffers);

// GET /api/offers/:id
router.get('/:id', getOffer);

// POST /api/offers
router.post('/', createOffer);

// PUT /api/offers/:id
router.put('/:id', updateOffer);

// DELETE /api/offers/:id
router.delete('/:id', deleteOffer);

module.exports = router;
