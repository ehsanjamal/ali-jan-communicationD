const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },

    // 'new_phone' | 'used_phone' | 'accessory' | 'tablet' | 'smart_watch'
    productType: {
      type: String,
      required: true,
      enum: ['new_phone', 'used_phone', 'accessory', 'tablet', 'smart_watch'],
    },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },

    description: { type: String, default: '' },

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },

    stock: { type: Number, required: true, default: 0, min: 0 },
    isSoldOut: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    condition: { type: String, enum: ['new', 'used', null], default: null },
    ptaStatus: { type: String, enum: ['pta_approved', 'non_pta', 'factory_unlocked', null], default: null },
    storage: { type: String, default: null },
    ram: { type: String, default: null },
    batteryHealth: { type: String, default: null },
    warrantyDays: { type: Number, default: 0 },

    images: [{ type: String }],
    specs: { type: Map, of: String, default: {} },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
