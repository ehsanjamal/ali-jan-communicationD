const express = require('express');
const router = express.Router();

const { getPublicSettings } = require('../controllers/settingsController');

// GET /api/public/settings  (storefront — public-safe subset: contact info, whatsapp, socials, policies)
router.get('/', getPublicSettings);

module.exports = router;
