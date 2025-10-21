const { Subscription, Member, Package, Setting } = require('../models');
const { logger } = require('../utils/logger');

class SubscriptionController {
  /**
   * Create new subscription
   */
  async createSubscription(req, res) {
    try {
      const {
        packageId,
        planDuration,
        autoRenew,
        paymentMethod
      } = req.body;

      const memberId = req.params.id;
      
      // Validate package
      const pkg = await Package.findById(packageId);
      if (!pkg) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid package'
        });
      }

      // Check if package is active
      if (!pkg.active) {
        return res.status(400).json({
          status: 'error',
          message: 'This package is no longer active'
        });
      }

      // Validate package has required fields
      if (!pkg.price || !pkg.durationInDays || !pkg.code || !pkg.title) {
        return res.status(400).json({
          status: 'error',
          message: 'Package configuration is incomplete'
        });
      }

      //validate member
      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid member'
        });
      }

      // Check for existing active subscription
      const existingSubscription = await Subscription.findOne({
        memberId: memberId,  // Fixed: Using correct memberId from params
        packageId,
        'subscriptionDetails.isActive': true
      });

      if (existingSubscription) {
        return res.status(400).json({
          status: 'error',
          message: 'Active subscription already exists for this package'
        });
      }

      // Calculate duration in days
      const durationInDays = (planDuration || 1) * 30; // Default to 1 month if not specified

      //fetch settings with default values
      const settings = await Setting.findOne({key: 'subscription'}) || { 
        value: { 
          one_time_registration_cost: 0,
          premium_membership_cost: 0
        }
      };

      const oneTimeRegistration = settings.value?.one_time_registration_cost || 0;
      const premiumMembership = settings.value?.premium_membership_cost || 0;
      const totalDiscount = oneTimeRegistration + premiumMembership;

      //create subscription
      const subscription = await Subscription.create({
        memberId,
        packageId,
        packageCode: pkg.code,
        packageName: pkg.title,
        subscriptionDetails: {
          startDate: new Date(),
          expiryDate: new Date(new Date().getTime() + (durationInDays * 24 * 60 * 60 * 1000)),
          isActive: true,
          autoRenewal: autoRenew || false
        },
        pricing: {
          originalPackagePrice: pkg.price,
          discounts: {
            oneTimeRegistration,
            premiumMembership,
            totalDiscount
          },
          finalAmountPaid: Math.max(0, pkg.price - totalDiscount) // Ensure final amount is not negative
        },
        transactionId: paymentMethod ? `${paymentMethod.toUpperCase()}_${Date.now()}` : 'CASH'
      });

      await subscription.populate([
        { path: 'packageId', select: 'name description' }
      ]);

      res.status(201).json({
        status: 'success',
        data: subscription
      });
    } catch (error) {
      logger.error('Create subscription error:', error);
      
      // More specific error messages based on error type
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error: ' + Object.values(error.errors).map(err => err.message).join(', ')
        });
      }
      
      if (error.name === 'MongoServerError' && error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'Duplicate subscription entry'
        });
      }

      console.error('Detailed error:', error); // Add this for debugging
      
      res.status(500).json({
        status: 'error',
        message: error.message || 'Error creating subscription',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get all subscriptions with filters
   */
  async getAllSubscriptions(req, res) {
    try {
      const member = await Member.findById(req.params.id);
      //get current active subscriptions
      const subscriptions = await Subscription.find({memberId: req.params.id, 'subscriptionDetails.isActive': true});

      let packages = [];
      if(subscriptions.length > 0) {
        for(let subscription of subscriptions) {
          const pkg = await Package.findById(subscription.packageId);
          let pkgData = {
            packageCode: pkg.code,
            packageName: pkg.title,
            startDate: subscription.subscriptionDetails.startDate,
            expiryDate: subscription.subscriptionDetails.expiryDate,
            finalAmountPaid: subscription.pricing.finalAmountPaid,
            transactionId: subscription.transactionId
          };
          packages.push(pkgData);
        }
      }
      
      let history = [];
      const oldSubscriptions = await Subscription.find({memberId: req.params.id, 'subscriptionDetails.isActive': false});
      if(oldSubscriptions.length > 0) {
        for(let subscription of oldSubscriptions) {
          const pkg = await Package.findById(subscription.packageId);
          let pkgData = {
            packageCode: pkg.code,
            packageName: pkg.title,
            startDate: subscription.subscriptionDetails.startDate,
            expiryDate: subscription.subscriptionDetails.expiryDate,
            finalAmountPaid: subscription.pricing.finalAmountPaid,
            transactionId: subscription.transactionId
          };
          history.push(pkgData);
        }
      }
      
      res.json({
        status: 'success',
        data: {
            memberId: member.memberId,
            memberName: member.name,
            membershipStatus: {
              isRegistered: member.membershipStatus.isRegistered,
              registrationDate: member.membershipStatus.registrationDate,
              premiumMembership: {
                isActive: member.membershipStatus.premiumMembership.isActive,
                startDate: member.membershipStatus.premiumMembership.startDate,
                expiryDate: member.membershipStatus.premiumMembership.expiryDate,
                renewalCount: member.membershipStatus.premiumMembership.renewalCount
              }
            },
            packages: packages,
            history: history
        }
      });
    } catch (error) {
      logger.error('Get subscriptions error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching subscriptions'
      });
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(req, res) {
    try {
      const subscription = await Subscription.findById(req.params.id)
        .populate('memberId', 'name email')
        .populate('packageId', 'name description');

      if (!subscription) {
        return res.status(404).json({
          status: 'error',
          message: 'Subscription not found'
        });
      }

      // Check access permission
      if (
        req.user.userType !== 'admin' &&
        subscription.memberId._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to view this subscription'
        });
      }

      res.json({
        status: 'success',
        data: subscription
      });
    } catch (error) {
      logger.error('Get subscription error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching subscription'
      });
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(req, res) {
    try {
      const { isActive } = req.body;

      const subscription = await Subscription.findById(req.params.id);

      if (!subscription) {
        return res.status(404).json({
          status: 'error',
          message: 'Subscription not found'
        });
      }

      // Check permission
      if (
        req.user.userType !== 'admin' &&
        subscription.memberId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to modify this subscription'
        });
      }

      subscription.subscriptionDetails.isActive = isActive;
      await subscription.save();
      await subscription.populate([
        { path: 'packageId', select: 'name description' }
      ]);

      res.json({
        status: 'success',
        data: subscription
      });
    } catch (error) {
      logger.error('Update subscription status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating subscription status'
      });
    }
  }

  /**
   * Toggle auto-renewal
   */
  async toggleAutoRenewal(req, res) {
    try {
      const subscription = await Subscription.findById(req.params.id);

      if (!subscription) {
        return res.status(404).json({
          status: 'error',
          message: 'Subscription not found'
        });
      }

      // Check permission
      if (
        req.user.userType !== 'admin' &&
        subscription.memberId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to modify this subscription'
        });
      }

      subscription.subscriptionDetails.autoRenewal = !subscription.subscriptionDetails.autoRenewal;
      await subscription.save();
      await subscription.populate([
        { path: 'packageId', select: 'name description' }
      ]);

      res.json({
        status: 'success',
        data: subscription
      });
    } catch (error) {
      logger.error('Toggle auto-renewal error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating auto-renewal'
      });
    }
  }
}

module.exports = new SubscriptionController(); 