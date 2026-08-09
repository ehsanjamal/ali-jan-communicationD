const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    placement: { type: String, enum: ['slider', 'banner'], required: true },
    image: { type: String, required: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    linkUrl: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
