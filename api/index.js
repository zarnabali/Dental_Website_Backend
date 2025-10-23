const express = require('express');

// Load environment variables (for local development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

console.log('Vercel function starting...');

// Environment debugging
console.log('ENVIRONMENT:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('VERCEL_URL:', process.env.VERCEL_URL);

// Check MongoDB environment variables
const mongoVars = ['MONGODB_URI', 'DATABASE_URL', 'MONGO_URL', 'MONGODB_CONNECTION_STRING'];
console.log('MongoDB env vars:');
mongoVars.forEach(varName => {
  console.log(`  ${varName}:`, process.env[varName] ? 'SET' : 'NOT SET');
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Basic logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB connection setup
const mongoose = require('mongoose');

// Resolve MongoDB URI from environment variables
let RESOLVED_MONGODB_URI = 
  process.env.MONGODB_URI || 
  process.env.DATABASE_URL || 
  process.env.MONGO_URL || 
  process.env.MONGODB_CONNECTION_STRING;

console.log('MongoDB URI resolved:', RESOLVED_MONGODB_URI ? 'SET' : 'NOT SET');
if (RESOLVED_MONGODB_URI) {
  console.log('URI length:', RESOLVED_MONGODB_URI.length);
}

// TEMPORARY FIX: Vercel environment variable caching issue
// Force correct URI if we detect the broken cached URI
if (RESOLVED_MONGODB_URI && RESOLVED_MONGODB_URI.length <= 65) {
  console.log('DETECTED CACHED BROKEN URI ON VERCEL - APPLYING FIX');
  console.log('Old URI length:', RESOLVED_MONGODB_URI.length);
  RESOLVED_MONGODB_URI = 'mongodb+srv://Admin01:Admin@admin.ywqztuq.mongodb.net/dentist_website?retryWrites=true&w=majority';
  console.log('Applied fixed URI length:', RESOLVED_MONGODB_URI.length);
}

// MongoDB connection with error handling
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  if (!RESOLVED_MONGODB_URI) {
    console.error('No MongoDB URI found in environment variables');
    return;
  }
  
  try {
    await mongoose.connect(RESOLVED_MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    isConnected = false;
  }
};

// Initialize connection
connectDB();

// Database connection middleware
const checkDBConnection = (req, res, next) => {
  if (!isConnected) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected. Check environment variables.',
      debug: {
        hasUri: !!RESOLVED_MONGODB_URI,
        uriLength: RESOLVED_MONGODB_URI?.length || 0,
        envVars: {
          MONGODB_URI: !!process.env.MONGODB_URI,
          DATABASE_URL: !!process.env.DATABASE_URL,
          MONGO_URL: !!process.env.MONGO_URL,
          MONGODB_CONNECTION_STRING: !!process.env.MONGODB_CONNECTION_STRING
        }
      }
    });
  }
  next();
};

// Import all routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const uploadRoutes = require('../routes/upload');
const heroImageRoutes = require('../routes/heroImage');
const heroVideoRoutes = require('../routes/heroVideo');
const partnerRoutes = require('../routes/partners');
const teamRoutes = require('../routes/team');
const teamPictureRoutes = require('../routes/teamPictures');
const featuresRoutes = require('../routes/features');
const faqRoutes = require('../routes/faqs');
const feedbackRoutes = require('../routes/feedback');
const serviceRoutes = require('../routes/services');
const blogRoutes = require('../routes/blogs');
const clinicInfoRoutes = require('../routes/clinicInfo');

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dentist Website API Documentation'
}));

// All API routes with database connection check
app.use('/api/auth', checkDBConnection, authRoutes);
app.use('/api/users', checkDBConnection, userRoutes);
app.use('/api/upload', checkDBConnection, uploadRoutes);
app.use('/api/hero-images', checkDBConnection, heroImageRoutes);
app.use('/api/hero-videos', checkDBConnection, heroVideoRoutes);
app.use('/api/partners', checkDBConnection, partnerRoutes);
app.use('/api/team', checkDBConnection, teamRoutes);
app.use('/api/team-pictures', checkDBConnection, teamPictureRoutes);
app.use('/api/features', checkDBConnection, featuresRoutes);
app.use('/api/faqs', checkDBConnection, faqRoutes);
app.use('/api/feedback', checkDBConnection, feedbackRoutes);
app.use('/api/services', checkDBConnection, serviceRoutes);
app.use('/api/blogs', checkDBConnection, blogRoutes);
app.use('/api/clinic-info', checkDBConnection, clinicInfoRoutes);

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Dentist Website API is running on Vercel!',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
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

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/debug/env', (req, res) => {
  res.json({
    success: true,
    env: {
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      vercelEnv: process.env.VERCEL_ENV,
      vercel: process.env.VERCEL,
      hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL || process.env.MONGODB_CONNECTION_STRING),
      mongoVars: {
        MONGODB_URI: !!process.env.MONGODB_URI,
        DATABASE_URL: !!process.env.DATABASE_URL,
        MONGO_URL: !!process.env.MONGO_URL,
        MONGODB_CONNECTION_STRING: !!process.env.MONGODB_CONNECTION_STRING
      },
      platform: 'Vercel'
    }
  });
});

app.get('/debug/db', (req, res) => {
  res.json({
    success: true,
    connected: isConnected,
    hasUri: !!RESOLVED_MONGODB_URI,
    uriLength: RESOLVED_MONGODB_URI?.length || 0,
    mongooseState: mongoose.connection.readyState,
    stateNames: {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(500).json({
    success: false,
    message: err?.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    status: 'error',
    url: req.url
  });
});

// Export for Vercel
module.exports = (req, res) => app(req, res);
