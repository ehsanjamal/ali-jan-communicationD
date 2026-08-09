const Offer = require('../models/Offer');

// GET /api/offers  (admin — all offers)
const getOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find()
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (err) {
    next(err);
  }
};

// GET /api/offers/:id
const getOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found');
    }
    res.json({ success: true, offer });
  } catch (err) {
    next(err);
  }
};

const buildOfferFields = (body) => {
  const fields = {
    title: body.title !== undefined ? body.title.trim() : undefined,
    description: body.description !== undefined ? body.description : undefined,
    discountType: body.discountType !== undefined ? body.discountType : undefined,
    discountValue: body.discountValue !== undefined ? Number(body.discountValue) : undefined,
    appliesTo: body.appliesTo !== undefined ? body.appliesTo : undefined,
    category: body.category ? body.category : (body.appliesTo && body.appliesTo !== 'category' ? null : undefined),
    brand: body.brand ? body.brand : (body.appliesTo && body.appliesTo !== 'brand' ? null : undefined),
    product: body.product ? body.product : (body.appliesTo && body.appliesTo !== 'product' ? null : undefined),
    startsAt: body.startsAt !== undefined ? (body.startsAt || null) : undefined,
    endsAt: body.endsAt !== undefined ? (body.endsAt || null) : undefined,
    isActive: body.isActive !== undefined ? (body.isActive === 'true' || body.isActive === true) : undefined,
  };
  // strip undefined keys so Object.assign / create don't overwrite with undefined
  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
  return fields;
};

// POST /api/offers
const createOffer = async (req, res, next) => {
  try {
    const { title, discountValue } = req.body;
    if (!title || discountValue === undefined) {
      res.status(400);
      throw new Error('title and discountValue are required');
    }

    const offer = await Offer.create(buildOfferFields(req.body));
    res.status(201).json({ success: true, offer });
  } catch (err) {
    next(err);
  }
};

// PUT /api/offers/:id
const updateOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found');
    }

    Object.assign(offer, buildOfferFields(req.body));
    await offer.save();
    res.json({ success: true, offer });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/offers/:id
const deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found');
    }
    await offer.deleteOne();
    res.json({ success: true, message: 'Offer deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/offers  (storefront — only active + within date window)
const getPublicOffers = async (req, res, next) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  getPublicOffers,
};
