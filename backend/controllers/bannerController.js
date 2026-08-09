const fs = require('fs');
const path = require('path');
const Banner = require('../models/Banner');

const deleteImageFile = (imgUrl) => {
  if (!imgUrl) return;
  const filename = imgUrl.split('/uploads/banners/')[1];
  if (!filename) return;
  const filePath = path.join(__dirname, '..', 'uploads', 'banners', filename);
  fs.unlink(filePath, () => {}); // best-effort, ignore errors
};

// GET /api/banners  (admin — all banners, optional ?placement=slider|banner)
const getBanners = async (req, res, next) => {
  try {
    const { placement } = req.query;
    const query = {};
    if (placement) query.placement = placement;
    const banners = await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, banners });
  } catch (err) {
    next(err);
  }
};

// GET /api/banners/:id
const getBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      throw new Error('Banner not found');
    }
    res.json({ success: true, banner });
  } catch (err) {
    next(err);
  }
};

// POST /api/banners  (multipart/form-data — image required)
const createBanner = async (req, res, next) => {
  try {
    const { placement, title, subtitle, linkUrl, sortOrder, isActive } = req.body;

    if (!placement || !['slider', 'banner'].includes(placement)) {
      res.status(400);
      throw new Error('placement must be "slider" or "banner"');
    }
    if (!req.file) {
      res.status(400);
      throw new Error('image is required');
    }

    const banner = await Banner.create({
      placement,
      image: `/uploads/banners/${req.file.filename}`,
      title: title || '',
      subtitle: subtitle || '',
      linkUrl: linkUrl || null,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
    });

    res.status(201).json({ success: true, banner });
  } catch (err) {
    next(err);
  }
};

// PUT /api/banners/:id  (multipart/form-data — optional new image)
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      throw new Error('Banner not found');
    }

    const { placement, title, subtitle, linkUrl, sortOrder, isActive } = req.body;

    if (placement !== undefined) {
      if (!['slider', 'banner'].includes(placement)) {
        res.status(400);
        throw new Error('placement must be "slider" or "banner"');
      }
      banner.placement = placement;
    }

    if (req.file) {
      deleteImageFile(banner.image);
      banner.image = `/uploads/banners/${req.file.filename}`;
    }

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (linkUrl !== undefined) banner.linkUrl = linkUrl || null;
    if (sortOrder !== undefined) banner.sortOrder = Number(sortOrder);
    if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

    await banner.save();
    res.json({ success: true, banner });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/banners/:id
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      throw new Error('Banner not found');
    }
    deleteImageFile(banner.image);
    await banner.deleteOne();
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/banners  (storefront — only active, optional ?placement=)
const getPublicBanners = async (req, res, next) => {
  try {
    const { placement } = req.query;
    const query = { isActive: true };
    if (placement) query.placement = placement;
    const banners = await Banner.find(query)
      .select('placement image title subtitle linkUrl sortOrder')
      .sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, banners });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  getPublicBanners,
};
