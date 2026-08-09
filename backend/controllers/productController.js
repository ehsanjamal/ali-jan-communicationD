const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const makeUniqueSlug = async (name, excludeId = null) => {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Product.findOne(query);
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

const deleteImageFiles = (images = []) => {
  images.forEach((imgUrl) => {
    const filename = imgUrl.split('/uploads/products/')[1];
    if (!filename) return;
    const filePath = path.join(__dirname, '..', 'uploads', 'products', filename);
    fs.unlink(filePath, () => {}); // best-effort, ignore errors
  });
};

// GET /api/products  (admin list — supports ?type=&search=&page=&limit=)
const getProducts = async (req, res, next) => {
  try {
    const { type, search, featured, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.productType = type;
    if (search) query.$text = { $search: search };
    if (featured === 'true') query.isFeatured = true;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products  (multipart/form-data)
const createProduct = async (req, res, next) => {
  try {
    const body = req.body;

    if (!body.name || !body.productType || body.price === undefined) {
      res.status(400);
      throw new Error('name, productType and price are required');
    }

    const slug = await makeUniqueSlug(body.name);

    const images = (req.files || []).map((f) => `/uploads/products/${f.filename}`);

    const tags = body.tags
      ? body.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const product = await Product.create({
      name: body.name.trim(),
      slug,
      productType: body.productType,
      category: body.category || undefined,
      brand: body.brand || undefined,
      description: body.description || '',
      price: Number(body.price),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : null,
      stock: body.stock !== undefined ? Number(body.stock) : 0,
      isSoldOut: body.isSoldOut === 'true' || body.isSoldOut === true,
      isFeatured: body.isFeatured === 'true' || body.isFeatured === true,
      isActive: body.isActive === undefined ? true : body.isActive === 'true' || body.isActive === true,
      condition: body.condition || null,
      ptaStatus: body.ptaStatus || null,
      storage: body.storage || null,
      ram: body.ram || null,
      batteryHealth: body.batteryHealth || null,
      warrantyDays: body.warrantyDays ? Number(body.warrantyDays) : 0,
      images,
      tags,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id  (multipart/form-data)
// - new uploaded files are appended
// - body.existingImages (JSON array of URLs) tells us which previously-saved images to KEEP
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const body = req.body;

    if (body.name && body.name.trim() !== product.name) {
      product.slug = await makeUniqueSlug(body.name, product._id);
      product.name = body.name.trim();
    }

    let keptImages = product.images;
    if (body.existingImages !== undefined) {
      try {
        keptImages = JSON.parse(body.existingImages);
      } catch (e) {
        keptImages = product.images;
      }
      const removed = product.images.filter((img) => !keptImages.includes(img));
      deleteImageFiles(removed);
    }

    const newImages = (req.files || []).map((f) => `/uploads/products/${f.filename}`);
    product.images = [...keptImages, ...newImages];

    if (body.productType) product.productType = body.productType;
    if (body.category !== undefined) product.category = body.category || undefined;
    if (body.brand !== undefined) product.brand = body.brand || undefined;
    if (body.description !== undefined) product.description = body.description;
    if (body.price !== undefined) product.price = Number(body.price);
    if (body.discountPrice !== undefined) {
      product.discountPrice = body.discountPrice ? Number(body.discountPrice) : null;
    }
    if (body.stock !== undefined) product.stock = Number(body.stock);
    if (body.isSoldOut !== undefined) product.isSoldOut = body.isSoldOut === 'true' || body.isSoldOut === true;
    if (body.isFeatured !== undefined) product.isFeatured = body.isFeatured === 'true' || body.isFeatured === true;
    if (body.isActive !== undefined) product.isActive = body.isActive === 'true' || body.isActive === true;
    if (body.condition !== undefined) product.condition = body.condition || null;
    if (body.ptaStatus !== undefined) product.ptaStatus = body.ptaStatus || null;
    if (body.storage !== undefined) product.storage = body.storage || null;
    if (body.ram !== undefined) product.ram = body.ram || null;
    if (body.batteryHealth !== undefined) product.batteryHealth = body.batteryHealth || null;
    if (body.warrantyDays !== undefined) product.warrantyDays = Number(body.warrantyDays);
    if (body.tags !== undefined) {
      product.tags = body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    deleteImageFiles(product.images);
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/products  (storefront — supports ?type=&category=&brand=&search=&sort=&page=&limit=)
// Only ever returns active products; no admin auth required.
const getPublicProducts = async (req, res, next) => {
  try {
    const { type, category, brand, search, sort, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (type) query.productType = type;
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (search) query.$text = { $search: search };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    let sortSpec = { isFeatured: -1, createdAt: -1 };
    if (sort === 'price_asc') sortSpec = { price: 1 };
    else if (sort === 'price_desc') sortSpec = { price: -1 };
    else if (sort === 'newest') sortSpec = { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('-__v')
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .sort(sortSpec)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/products/:slug
const getPublicProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo');
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getPublicProductBySlug,
};
