const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const connectDB = require('../config/database');
const { logger, requestLogger } = require('./utils/logger');

// Import routes
const mediaRoutes = require('./routes/media');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const navigatorRoutes = require('./routes/navigator.routes');
const doctorRoutes = require('./routes/doctor.routes');
const empanelledDoctorRoutes = require('./routes/empanelled-doctor.routes');
const schoolRoutes = require('./routes/school.routes');
const healthcareProviderRoutes = require('./routes/healthcare-provider.routes');
const nurseRoutes = require('./routes/nurse.routes');
const memberRoutes = require('./routes/member.routes');
const medicalHistoryRoutes = require('./routes/medical-history.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const blogRoutes = require('./routes/blog.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const notificationRoutes = require('./routes/notification.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const infirmaryRoutes = require('./routes/infirmary.routes');
const commonRoutes = require('./routes/common.routes');
const packageRoutes = require('./routes/package.routes');

// Initialize express app
const app = express();

// Trust proxy - Add this before other middleware
app.set('trust proxy', 1);
// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// Serve files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Sanitize data
app.use(xss()); // Clean user input
app.use(compression()); // Compress responses

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // increased from 100 to 3000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS
//app.use(cors());
const allowedOrigins = [
  'https://admin-frontend-master.vercel.app',
  'http://localhost:3000' // optional for local testing
];

app.use(cors({
  origin: function(origin, callback){
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
// Request logging
app.use(requestLogger);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
const apiVersion = '/api/v1';

app.use(`${apiVersion}/media`, mediaRoutes);

app.use(`${apiVersion}/auth`, authRoutes);
app.use(`${apiVersion}/admins`, adminRoutes);
app.use(`${apiVersion}/navigators`, navigatorRoutes);
app.use(`${apiVersion}/doctors`, doctorRoutes);
app.use(`${apiVersion}/emp-doctors`, empanelledDoctorRoutes);
app.use(`${apiVersion}/schools`, schoolRoutes);
app.use(`${apiVersion}/hc-providers`, healthcareProviderRoutes);
app.use(`${apiVersion}/nurses`, nurseRoutes);
app.use(`${apiVersion}/members`, memberRoutes);
app.use(`${apiVersion}/medical-history`, medicalHistoryRoutes);
app.use(`${apiVersion}/appointments`, appointmentRoutes);
app.use(`${apiVersion}/assessments`, assessmentRoutes);
app.use(`${apiVersion}/infirmary`, infirmaryRoutes);
app.use(`${apiVersion}/inventory`, inventoryRoutes);
app.use(`${apiVersion}/blogs`, blogRoutes);
app.use(`${apiVersion}/products`, productRoutes);
app.use(`${apiVersion}/orders`, orderRoutes);
app.use(`${apiVersion}/packages`, packageRoutes);
app.use(`${apiVersion}/subscriptions`, subscriptionRoutes);
app.use(`${apiVersion}/notifications`, notificationRoutes);
app.use(`${apiVersion}/common`, commonRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({ status: 'OK' });
});

// 404 handler
app.use((req, res, next) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid input data',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: 'error',
      message: `Duplicate ${field}. Please use another value!`
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again!'
    });
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Your token has expired! Please log in again.'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app; 