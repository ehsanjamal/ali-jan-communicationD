const fs = require('fs');
const path = require('path');
const Brand = require('../models/Brand');

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
    const existing = await Brand.findOne(query);
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

const deleteImageFile = (imgUrl) => {
  if (!imgUrl) return;
  const filename = imgUrl.split('/uploads/brands/')[1];
  if (!filename) return;
  const filePath = path.join(__dirname, '..', 'uploads', 'brands', filename);
  fs.unlink(filePath, () => {}); // best-effort, ignore errors
};

// GET /api/brands  (admin — all brands)
const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json({ success: true, brands });
  } catch (err) {
    next(err);
  }
};

// GET /api/brands/:id
const getBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }
    res.json({ success: true, brand });
  } catch (err) {
    next(err);
  }
};

// POST /api/brands  (multipart/form-data — optional logo)
const createBrand = async (req, res, next) => {
  try {
    const { name, isActive } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('name is required');
    }

    const slug = await makeUniqueSlug(name);
    const logo = req.file ? `/uploads/brands/${req.file.filename}` : null;

    const brand = await Brand.create({
      name: name.trim(),
      slug,
      logo,
      isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
    });

    res.status(201).json({ success: true, brand });
  } catch (err) {
    next(err);
  }
};

// PUT /api/brands/:id  (multipart/form-data — optional new logo)
const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }

    const { name, isActive } = req.body;

    if (name && name.trim() !== brand.name) {
      brand.slug = await makeUniqueSlug(name, brand._id);
      brand.name = name.trim();
    }

    if (req.file) {
      deleteImageFile(brand.logo);
      brand.logo = `/uploads/brands/${req.file.filename}`;
    }

    if (isActive !== undefined) brand.isActive = isActive === 'true' || isActive === true;

    await brand.save();
    res.json({ success: true, brand });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/brands/:id
const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }
    deleteImageFile(brand.logo);
    await brand.deleteOne();
    res.json({ success: true, message: 'Brand deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/brands  (storefront — only active, for nav/filters)
const getPublicBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select('name slug logo')
      .sort({ name: 1 });
    res.json({ success: true, brands });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getPublicBrands,
};
