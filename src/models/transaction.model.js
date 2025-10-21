const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionSchema = new Schema({
    transactionId: {
      type: String,
      unique: true,
      required: true
    },
    memberId: {
      type: String,
      required: true,
      index: true
    },
    transactionType: {
      type: String,
      enum: ['REGISTRATION', 'PREMIUM_MEMBERSHIP', 'PACKAGE_PURCHASE', 'PACKAGE_RENEWAL'],
      required: true
    },
    items: [{
      type: {
        type: String,
        enum: ['ONE_TIME_REGISTRATION', 'PREMIUM_MEMBERSHIP', 'PACKAGE']
      },
      itemId: String, // packageId for packages
      itemCode: String, // packageCode for packages
      originalPrice: Number,
      discountApplied: Number,
      finalPrice: Number
    }],
    pricing: {
      subtotal: {
        type: Number,
        required: true
      },
      totalDiscounts: {
        oneTimeRegistration: {
          type: Number,
          default: 0
        },
        premiumMembership: {
          type: Number,
          default: 0
        },
        total: {
          type: Number,
          default: 0
        }
      },
      finalAmount: {
        type: Number,
        required: true
      }
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentMethod: String,
    paymentGatewayResponse: Schema.Types.Mixed
  }, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);



 
