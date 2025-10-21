const jwt = require('jsonwebtoken');
const { AuthCredential } = require('../models');
const { logger } = require('../utils/logger');

class AuthMiddleware {
  /**
   * Verify JWT token and attach user to request
   */
  verifyToken = async (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : null;

      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Access denied. No token provided.'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || `digital_conquest`);

      // Find user
      const user = await AuthCredential.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is inactive. Please contact support.'
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token.'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired.'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Error verifying token.'
      });
    }
  };

  /**
   * Check if user has required role
   */
  hasRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required.'
        });
      }

      if (!roles.includes(req.user.userType)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    };
  };

  /**
   * Check if user is accessing their own resource
   */
  isResourceOwner = (paramName = 'id') => {
    return (req, res, next) => {
      const resourceId = req.params[paramName];
      
      if (req.user.userType === 'admin') {
        return next(); // Admins can access all resources
      }

      if (req.user._id.toString() !== resourceId) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    };
  };

  /**
   * Check if user is active
   */
  isActive = (req, res, next) => {
    if (!req.user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is inactive. Please contact support.'
      });
    }
    next();
  };

  /**
   * Middleware composition for protected routes
   */
  protect = (roles = []) => {
    return [
      this.verifyToken,
      this.isActive,
      ...(roles.length > 0 ? [this.hasRole(...roles)] : [])
    ];
  };
}

module.exports = new AuthMiddleware();



