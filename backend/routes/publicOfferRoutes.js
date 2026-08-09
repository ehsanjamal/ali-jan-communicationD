const express = require('express');
const router = express.Router();

const { getPublicOffers } = require('../controllers/offerController');

// GET /api/public/offers  (storefront — active + within date window)
router.get('/', getPublicOffers);

module.exports = router;
