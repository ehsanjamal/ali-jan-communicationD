const express = require('express');
const router = express.Router();

const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protectAdmin } = require('../middleware/authMiddleware');

// All settings routes require a valid admin token
router.use(protectAdmin);

// GET /api/settings
router.get('/', getSettings);

// PUT /api/settings
router.put('/', updateSettings);

module.exports = router;
