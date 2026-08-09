const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protects admin routes: requires a valid JWT (from Authorization header or cookie)
const protectAdmin = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-passwordHash');

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, admin not found' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

module.exports = { protectAdmin };
