const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: null },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    city: { type: String, required: true },

    items: [orderItemSchema],
    itemsTotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    paymentMethod: { type: String, enum: ['cod', 'bank_transfer'], default: 'cod' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
