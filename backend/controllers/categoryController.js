const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');

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
    const existing = await Category.findOne(query);
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

const deleteImageFile = (imgUrl) => {
  if (!imgUrl) return;
  const filename = imgUrl.split('/uploads/categories/')[1];
  if (!filename) return;
  const filePath = path.join(__dirname, '..', 'uploads', 'categories', filename);
  fs.unlink(filePath, () => {}); // best-effort, ignore errors
};

// GET /api/categories  (admin — all categories)
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// GET /api/categories/:id
const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories  (multipart/form-data — optional image)
const createCategory = async (req, res, next) => {
  try {
    const { name, sortOrder, isActive } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('name is required');
    }

    const slug = await makeUniqueSlug(name);
    const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

    const category = await Category.create({
      name: name.trim(),
      slug,
      image,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// PUT /api/categories/:id  (multipart/form-data — optional new image)
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    const { name, sortOrder, isActive } = req.body;

    if (name && name.trim() !== category.name) {
      category.slug = await makeUniqueSlug(name, category._id);
      category.name = name.trim();
    }

    if (req.file) {
      deleteImageFile(category.image);
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    deleteImageFile(category.image);
    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/categories  (storefront — only active, for nav/filters)
const getPublicCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug image sortOrder')
      .sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublicCategories,
};
