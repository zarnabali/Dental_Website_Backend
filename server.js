const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
require('dotenv').config({ path: './config.env' });

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - Disabled for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use(limiter);

// Alternative: Very generous rate limiting for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute (very generous)
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // In development or when NODE_ENV is not set, allow all origins
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log('Development mode - allowing origin:', origin || 'no origin');
      return callback(null, true);
    }
    
    // Allow requests with no origin (like mobile apps, curl requests, or direct API calls)
    if (!origin) {
      console.log('Request with no origin - allowing');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 20, // Increased from 10
  minPoolSize: 2, // Reduced from 5
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.log('💡 Make sure your IP address is whitelisted in MongoDB Atlas');
  console.log('💡 Check your MongoDB Atlas Network Access settings');
  process.exit(1);
});

// MongoDB connection monitoring
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const heroImageRoutes = require('./routes/heroImage');
const heroVideoRoutes = require('./routes/heroVideo');
const partnerRoutes = require('./routes/partners');
const teamRoutes = require('./routes/team');
const teamPictureRoutes = require('./routes/teamPictures');
const featuresRoutes = require('./routes/features');
const faqRoutes = require('./routes/faqs');
const feedbackRoutes = require('./routes/feedback');
const serviceRoutes = require('./routes/services');
const blogRoutes = require('./routes/blogs');
const clinicInfoRoutes = require('./routes/clinicInfo');

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dentist Website API Documentation'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hero-images', heroImageRoutes);
app.use('/api/hero-videos', heroVideoRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/team-pictures', teamPictureRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/clinic-info', clinicInfoRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Dentist Website API is running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      upload: '/api/upload',
      heroImages: '/api/hero-images',
      heroVideos: '/api/hero-videos',
      partners: '/api/partners',
      team: '/api/team',
      teamPictures: '/api/team-pictures',
      features: '/api/features',
      faqs: '/api/faqs',
      feedback: '/api/feedback',
      services: '/api/services',
      blogs: '/api/blogs',
      clinicInfo: '/api/clinic-info',
      docs: '/api-docs'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Simple test route for frontend connectivity
app.get('/api/test-connection', (req, res) => {
  res.json({
    success: true,
    message: 'Backend connection successful',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle CORS errors properly
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'CORS: Not allowed by CORS',
      error: 'Origin not allowed'
    });
  }
  
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    status: 'error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   • Authentication: http://localhost:${PORT}/api/auth`);
  console.log(`   • Users: http://localhost:${PORT}/api/users`);
  console.log(`   • File Upload: http://localhost:${PORT}/api/upload`);
  console.log(`   • Hero Images: http://localhost:${PORT}/api/hero-images`);
  console.log(`   • Hero Videos: http://localhost:${PORT}/api/hero-videos`);
  console.log(`   • Partners: http://localhost:${PORT}/api/partners`);
  console.log(`   • Team: http://localhost:${PORT}/api/team`);
  console.log(`   • Team Pictures: http://localhost:${PORT}/api/team-pictures`);
  console.log(`   • Features: http://localhost:${PORT}/api/features`);
  console.log(`   • FAQs: http://localhost:${PORT}/api/faqs`);
  console.log(`   • Feedback: http://localhost:${PORT}/api/feedback`);
  console.log(`   • Services: http://localhost:${PORT}/api/services`);
  console.log(`   • Blogs: http://localhost:${PORT}/api/blogs`);
  console.log(`   • Clinic Info: http://localhost:${PORT}/api/clinic-info`);
  console.log(`   • Swagger UI: http://localhost:${PORT}/api-docs`);
});
