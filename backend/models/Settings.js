const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'Ali Jan Communication' },

    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    address: { type: String, default: '' },

    whatsappNumber: { type: String, default: '' },

    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },

    warrantyPolicy: { type: String, default: '' },
    ptaPolicyInfo: { type: String, default: '' },

    isStoreOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
