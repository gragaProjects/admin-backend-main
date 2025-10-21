const { Product, Order } = require('../models');
const { logger } = require('../utils/logger');

class ProductController {
  /**
   * Create new product
   */
  async createProduct(req, res) {
    try {
      const {
        name,
        category,
        mrp,
        discountInPercentage,
        sellingPrice,
        description,
        stock,
        images
      } = req.body;

      const product = await Product.create({
        name,
        category,
        mrp,
        discountInPercentage,
        sellingPrice,
        description,
        stock,
        images
      });

      res.status(201).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      logger.error('Create product error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating product'
      });
    }
  }

  /**
   * Get all products with filters
   */
  async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        minPrice,
        maxPrice,
        inStock,
        isSubscriptionBased,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Search by name or description
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by category
      if (category) {
        query.category = category;
      }

      // Filter by price range
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      // Filter by stock availability
      if (inStock !== undefined) {
        query.stock = inStock === 'true' ? { $gt: 0 } : 0;
      }

      // Filter by subscription type
      if (isSubscriptionBased !== undefined) {
        query.isSubscriptionBased = isSubscriptionBased === 'true';
      }

      const products = await Product.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(query);

      res.json({
        status: 'success',
        data: products,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get products error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching products'
      });
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(req, res) {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      // Get sales statistics if admin
      if (req.user.userType === 'admin') {
        const salesStats = await Order.aggregate([
          { $unwind: '$items' },
          { $match: { 'items.productId': product._id } },
          {
            $group: {
              _id: null,
              totalSold: { $sum: '$items.quantity' },
              totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
          }
        ]);

        product._doc.salesStats = salesStats[0] || { totalSold: 0, totalRevenue: 0 };
      }

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      logger.error('Get product error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching product'
      });
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res) {
    try {
      const {
        name,
        category,
        mrp,
        discountInPercentage,
        sellingPrice,
        description,
        stock,
        images
      } = req.body;

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          ...(name && { name }),
          ...(category && { category }),
          ...(mrp && { mrp }),
          ...(discountInPercentage && { discountInPercentage }),
          ...(sellingPrice && { sellingPrice }),
          ...(description && { description }),
          ...(typeof stock !== 'undefined' && { stock }),
          ...(images && { images })
        },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating product'
      });
    }
  }

  /**
   * Update product stock
   */
  async updateStock(req, res) {
    try {
      const { operation, quantity } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      if (operation === 'add') {
        product.stock += quantity;
      } else if (operation === 'subtract') {
        if (product.stock < quantity) {
          return res.status(400).json({
            status: 'error',
            message: 'Insufficient stock'
          });
        }
        product.stock -= quantity;
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid operation'
        });
      }

      await product.save();

      res.json({
        status: 'success',
        data: product
      });
    } catch (error) {
      logger.error('Update stock error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating stock'
      });
    }
  }
}

module.exports = new ProductController(); 