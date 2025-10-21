const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true
    },
    packageCode: {
      type: String,
      required: true
    },
    subscriptionDetails: {
      startDate: {
        type: Date,
        required: true,
        default: Date.now
      },
      expiryDate: {
        type: Date,
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    pricing: {
      originalPackagePrice: {
        type: Number,
        required: true
      },
      discounts: {
        oneTimeRegistration: {
          type: Number,
          default: 0
        },
        premiumMembership: {
          type: Number,
          default: 0
        },
        totalDiscount: {
          type: Number,
          default: 0
        }
      },
      finalAmountPaid: {
        type: Number,
        required: true
      }
    },
    transactionId: {
      type: String,
      required: true
    }
  }, { timestamps: true });

SubscriptionSchema.index({ memberId: 1 });
SubscriptionSchema.index({ packageId: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);



 
