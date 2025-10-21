const { Order, Product, Member } = require('../models');
const { logger } = require('../utils/logger');

class OrderController {
  /**
   * Create new order
   */
  async createOrder(req, res) {
    try {
      const {
        items,
        shippingAddress,
        paymentMethod,
        couponCode
      } = req.body;

      // Validate products and calculate total
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          return res.status(404).json({
            status: 'error',
            message: `Product not found: ${item.productId}`
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            status: 'error',
            message: `Insufficient stock for product: ${product.name}`
          });
        }

        const itemPrice = product.discountPrice || product.price;
        subtotal += itemPrice * item.quantity;

        orderItems.push({
          productId: product._id,
          name: product.name,
          price: itemPrice,
          quantity: item.quantity
        });

        // Update product stock
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: -item.quantity }
        });
      }

      // Apply coupon if provided
      let discount = 0;
      if (couponCode) {
        // TODO: Implement coupon logic
      }

      // Calculate final amount
      const shipping = 0; // TODO: Implement shipping calculation
      const tax = subtotal * 0.18; // 18% tax
      const total = subtotal + shipping + tax - discount;

      // Create order
      const order = await Order.create({
        memberId: req.user._id,
        items: orderItems,
        subtotal,
        shipping,
        tax,
        discount,
        total,
        shippingAddress,
        paymentMethod,
        couponCode,
        status: 'pending'
      });

      await order.populate('memberId', 'name email phone');

      res.status(201).json({
        status: 'success',
        data: order
      });
    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating order'
      });
    }
  }

  /**
   * Get all orders with filters
   */
  async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Filter by amount range
      if (minAmount || maxAmount) {
        query.total = {};
        if (minAmount) query.total.$gte = parseFloat(minAmount);
        if (maxAmount) query.total.$lte = parseFloat(maxAmount);
      }

      // Add member filter for non-admin users
      if (req.user.userType !== 'admin') {
        query.memberId = req.user._id;
      }

      const orders = await Order.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('memberId', 'name email phone');

      const total = await Order.countDocuments(query);

      res.json({
        status: 'success',
        data: orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching orders'
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(req, res) {
    try {
      const order = await Order.findById(req.params.id)
        .populate('memberId', 'name email phone');

      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        });
      }

      // Check access permission
      if (
        req.user.userType !== 'admin' &&
        order.memberId._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to view this order'
        });
      }

      res.json({
        status: 'success',
        data: order
      });
    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching order'
      });
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        });
      }

      // Validate status transition
      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['shipped', 'cancelled'],
        shipped: ['delivered', 'returned'],
        delivered: ['returned'],
        returned: [],
        cancelled: []
      };

      if (!validTransitions[order.status].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status transition'
        });
      }

      // Handle stock updates for cancellations
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity }
          });
        }
      }

      order.status = status;
      order.statusHistory.push({
        status,
        updatedBy: req.user._id,
        timestamp: new Date()
      });

      await order.save();
      await order.populate('memberId', 'name email phone');

      res.json({
        status: 'success',
        data: order
      });
    } catch (error) {
      logger.error('Update order status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating order status'
      });
    }
  }
}

module.exports = new OrderController(); 