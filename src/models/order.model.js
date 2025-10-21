const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
  },
  shippingAddress: String,
  paymentDetails: {
    method: String,
    transactionId: String,
    status: String
  },
  orderDate: Date,
  deliveryDate: Date
}, { timestamps: true });

// Add indexes
OrderSchema.index({ memberId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: 1 });
OrderSchema.index({ 'paymentDetails.transactionId': 1 });

module.exports = mongoose.model('Order', OrderSchema); 