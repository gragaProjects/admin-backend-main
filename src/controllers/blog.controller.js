const { Blog } = require('../models');
const { logger } = require('../utils/logger');

class BlogController {
  /**
   * Create new blog
   */
  async createBlog(req, res) {
    try {
      const {
        title,
        content,
        author,
        featuredImage,
        readTimeMins,
        category,
        tags,
        publishDate,
        status = 'draft'
      } = req.body;

      const blog = await Blog.create({
        title,
        content,
        author,
        featuredImage,
        readTimeMins,
        category,
        tags,
        publishDate,
        status
      });

      res.status(201).json({
        status: 'success',
        data: blog
      });
    } catch (error) {
      logger.error('Create blog error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error creating blog'
      });
    }
  }

  /**
   * Get all blog posts with filters
   */
  async getAllBlogs(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        tag,
        author,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Search in title and content
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by category
      if (category) {
        query.category = category;
      }

      // Filter by tag
      if (tag) {
        query.tags = tag;
      }

      // Filter by author
      if (author) {
        query['author.name'] = { $regex: author, $options: 'i' };
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      const blogs = await Blog.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Blog.countDocuments(query);

      res.json({
        status: 'success',
        data: blogs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Get blogs error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching blog posts'
      });
    }
  }

  /**
   * Get blog post by id
   */
  async getBlog(req, res) {
    try {
      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog post not found'
        });
      }

      res.json({
        status: 'success',
        data: blog
      });
    } catch (error) {
      logger.error('Get blog error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error fetching blog post'
      });
    }
  }

  /**
   * Update blog
   */
  async updateBlog(req, res) {
    try {
      const {
        title,
        content,
        author,
        featuredImage,
        readTimeMins,
        category,
        tags,
        publishDate,
        status
      } = req.body;

      const blog = await Blog.findByIdAndUpdate(
        req.params.id,
        {
          ...(title && { title }),
          ...(content && { content }),
          ...(author && { author }),
          ...(featuredImage && { featuredImage }),
          ...(readTimeMins && { readTimeMins }),
          ...(category && { category }),
          ...(tags && { tags }),
          ...(publishDate && { publishDate }),
          ...(status && { status })
        },
        { new: true, runValidators: true }
      );

      if (!blog) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog not found'
        });
      }

      res.json({
        status: 'success',
        data: blog
      });
    } catch (error) {
      logger.error('Update blog error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error updating blog'
      });
    }
  }

  /**
   * Delete blog post
   */
  async deleteBlog(req, res) {
    try {
      const blog = await Blog.findByIdAndDelete(req.params.id);

      if (!blog) {
        return res.status(404).json({
          status: 'error',
          message: 'Blog post not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Blog post deleted successfully'
      });
    } catch (error) {
      logger.error('Delete blog error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error deleting blog post'
      });
    }
  }
}

module.exports = new BlogController(); 