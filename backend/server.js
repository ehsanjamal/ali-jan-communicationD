require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// --- Core middleware ---
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded product/banner images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Ali Jan Communication API is running' });
});

// --- Feature routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/public/products', require('./routes/publicProductRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/public/categories', require('./routes/publicCategoryRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/public/brands', require('./routes/publicBrandRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/public/banners', require('./routes/publicBannerRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/public/settings', require('./routes/publicSettingsRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/public/offers', require('./routes/publicOfferRoutes'));

// NOTE: Orders/Customers modules are OUT OF SCOPE — ordering is via WhatsApp only.

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
