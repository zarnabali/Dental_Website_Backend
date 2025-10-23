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

// All API routes
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
