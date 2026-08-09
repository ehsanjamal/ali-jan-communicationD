const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    appliesTo: { type: String, enum: ['all', 'category', 'brand', 'product'], default: 'all' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
