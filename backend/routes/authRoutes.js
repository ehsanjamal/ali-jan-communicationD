const express = require('express');
const router = express.Router();

const { loginAdmin, getMe, logoutAdmin } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', loginAdmin);

// GET /api/auth/me
router.get('/me', protectAdmin, getMe);

// POST /api/auth/logout
router.post('/logout', protectAdmin, logoutAdmin);

module.exports = router;
