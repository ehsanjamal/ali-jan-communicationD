const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/login
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin || !admin.isActive) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken(admin._id);

    // Also set an httpOnly cookie so the admin panel can work without
    // storing the token in localStorage, if the frontend chooses to use it.
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// POST /api/auth/logout
const logoutAdmin = async (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out' });
};

module.exports = { loginAdmin, getMe, logoutAdmin };
