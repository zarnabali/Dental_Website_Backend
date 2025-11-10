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
const resolveAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Always allow requests without an Origin header (curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = resolveAllowedOrigins();
    // If ALLOWED_ORIGINS is not set, default-allow all origins
    if (allowed.length === 0) return callback(null, true);

    if (allowed.includes(origin)) return callback(null, true);

    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
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

// Comprehensive environment variable debugging
console.log('🔍 ENVIRONMENT DEBUGGING:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('Available MongoDB env vars:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  MONGO_URL:', process.env.MONGO_URL ? 'SET' : 'NOT SET');
console.log('  MONGODB_CONNECTION_STRING:', process.env.MONGODB_CONNECTION_STRING ? 'SET' : 'NOT SET');

// Resolve Mongo connection string from multiple possible env var names
let RESOLVED_MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  process.env.MONGO_URL ||
  process.env.MONGODB_CONNECTION_STRING;

// TEMPORARY FIX: Railway environment variable caching issue
// Force correct URI for Railway production
if (process.env.RAILWAY_ENVIRONMENT === 'production') {
  const currentUri = RESOLVED_MONGODB_URI;
  if (currentUri && currentUri.length <= 65) {
    console.log('🚨 DETECTED CACHED BROKEN URI ON RAILWAY - APPLYING FIX');
    console.log('Old URI length:', currentUri.length);
    RESOLVED_MONGODB_URI = 'mongodb+srv://Admin01:Admin@admin.ywqztuq.mongodb.net/dentist_website?retryWrites=true&w=majority';
    console.log('Applied fixed URI length:', RESOLVED_MONGODB_URI.length);
  }
}

console.log('🔗 RESOLVED MONGODB URI:');
if (RESOLVED_MONGODB_URI) {
  // Mask sensitive info but show structure
  const masked = RESOLVED_MONGODB_URI.replace(/:[^:@]*@/, ':***@');
  console.log('  URI Pattern:', masked);
  console.log('  URI Length:', RESOLVED_MONGODB_URI.length);
  console.log('  Contains Auth:', RESOLVED_MONGODB_URI.includes('@'));
  console.log('  Contains Database:', RESOLVED_MONGODB_URI.includes('/') && RESOLVED_MONGODB_URI.split('/').length > 3);
} else {
  console.log('  ❌ NO MONGODB URI FOUND');
}

// MongoDB connection with better error handling (non-fatal in production)
if (RESOLVED_MONGODB_URI) {
  console.log('�� Attempting MongoDB connection...');
  mongoose.connect(RESOLVED_MONGODB_URI, {
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
    console.error('❌ MONGODB CONNECTION ERROR:');
    console.error('Error Type:', error.name);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.cause) console.error('Error Cause:', error.cause);
    
    // Specific guidance based on error type
    if (error.message.includes('authentication failed') || error.code === 8000) {
      console.error('�� AUTHENTICATION ISSUE:');
      console.error('  - Check username/password in MongoDB URI');
      console.error('  - Verify database user exists in MongoDB Atlas');
      console.error('  - Ensure user has proper permissions');
      console.error('  - Check if password contains special characters (URL encode them)');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.error('�� NETWORK ISSUE:');
      console.error('  - Check MongoDB Atlas IP allowlist');
      console.error('  - Add 0.0.0.0/0 to allow all IPs (temporary testing)');
      console.error('  - Verify cluster is running');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('�� CONNECTION REFUSED:');
      console.error('  - MongoDB cluster might be paused or deleted');
      console.error('  - Check MongoDB Atlas dashboard');
    }
    
    console.error('Stack trace:', error.stack);
  });
} else {
  console.warn('⚠️ No MongoDB connection string found. Checked MONGODB_URI, DATABASE_URL, MONGO_URL, MONGODB_CONNECTION_STRING. Starting without DB.');
}

// MongoDB connection monitoring
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB runtime error:', err.message);
  console.error('Error details:', err);
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

// Ensure DB connected before handling /api routes
const ensureDbConnected = async (req, res, next) => {
  if (!RESOLVED_MONGODB_URI) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable: connection string not configured (MONGODB_URI/DATABASE_URL/MONGO_URL)',
      debug: {
        checkedVars: ['MONGODB_URI', 'DATABASE_URL', 'MONGO_URL', 'MONGODB_CONNECTION_STRING'],
        nodeEnv: process.env.NODE_ENV,
        platform: process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.VERCEL ? 'Vercel' : 'Unknown'
      }
    });
  }

  const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  if (state === 1) return next();

  console.log(`⏳ Database not ready (state: ${state}), attempting connection...`);
  try {
    await mongoose.connect(RESOLVED_MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      bufferCommands: false,
    });
    console.log('✅ Database connection established for request');
    return next();
  } catch (err) {
    console.error('❌ DB connect attempt failed:', err?.message || err);
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Verify credentials and IP allowlist.',
      error: err?.message,
      debug: {
        errorCode: err?.code,
        platform: process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.VERCEL ? 'Vercel' : 'Unknown',
        hasUri: !!RESOLVED_MONGODB_URI,
        connectionState: mongoose.connection.readyState
      }
    });
  }
};

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
const resultsRoutes = require('./routes/results');

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dentist Website API Documentation'
}));

// Guard all API routes behind DB readiness
app.use('/api', ensureDbConnected);

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
app.use('/api/results', resultsRoutes);

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
      results: '/api/results',
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

// Debug: environment (non-sensitive)
app.get('/debug/env', (req, res) => {
  const safeEnv = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    baseUrl: process.env.BASE_URL,
    vercelUrl: process.env.VERCEL_URL,
    railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
    railwayUrl: process.env.RAILWAY_PUBLIC_URL,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT,
    vercelEnv: process.env.VERCEL_ENV,
    hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL || process.env.MONGODB_CONNECTION_STRING),
    mongoVars: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      DATABASE_URL: !!process.env.DATABASE_URL,
      MONGO_URL: !!process.env.MONGO_URL,
      MONGODB_CONNECTION_STRING: !!process.env.MONGODB_CONNECTION_STRING
    },
    allowedOrigins: resolveAllowedOrigins(),
    platform: process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.VERCEL ? 'Vercel' : 'Unknown'
  };
  res.json({ success: true, env: safeEnv });
});

// Debug: database
app.get('/debug/db', async (req, res) => {
  try {
    const state = mongoose.connection?.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    let ping = null;
    if (state === 1) {
      ping = await mongoose.connection.db.admin().ping();
    }
    res.json({ 
      success: true, 
      state, 
      stateName: stateNames[state] || 'unknown',
      ping,
      hasUri: !!RESOLVED_MONGODB_URI,
      uriLength: RESOLVED_MONGODB_URI?.length || 0,
      mongooseVersion: mongoose.version
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
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
const getBaseUrl = () => {
  // Check if we're in production based on platform or NODE_ENV
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.RAILWAY_ENVIRONMENT === 'production' ||
                      process.env.VERCEL_ENV === 'production';
                      
  if (isProduction) {
    const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const railway = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : (process.env.RAILWAY_PUBLIC_URL || null);
    return process.env.BASE_URL || vercel || railway || `http://localhost:${PORT}`;
  }
  return `http://localhost:${PORT}`;
};

app.listen(PORT, () => {
  const baseUrl = getBaseUrl();
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.RAILWAY_ENVIRONMENT === 'production' ||
                      process.env.VERCEL_ENV === 'production';
                      
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV} (Production: ${isProduction})`);
  if (process.env.RAILWAY_ENVIRONMENT) console.log(`🚂 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  if (process.env.VERCEL_ENV) console.log(`▲ Vercel Environment: ${process.env.VERCEL_ENV}`);
  console.log(`📊 Health check: ${baseUrl}/health`);
  console.log(`�� API Documentation: ${baseUrl}/api-docs`);
  console.log(`�� Debug Environment: ${baseUrl}/debug/env`);
  console.log(`🗄️ Debug Database: ${baseUrl}/debug/db`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   • Authentication: ${baseUrl}/api/auth`);
  console.log(`   • Users: ${baseUrl}/api/users`);
  console.log(`   • File Upload: ${baseUrl}/api/upload`);
  console.log(`   • Hero Images: ${baseUrl}/api/hero-images`);
  console.log(`   • Hero Videos: ${baseUrl}/api/hero-videos`);
  console.log(`   • Partners: ${baseUrl}/api/partners`);
  console.log(`   • Team: ${baseUrl}/api/team`);
  console.log(`   • Team Pictures: ${baseUrl}/api/team-pictures`);
  console.log(`   • Features: ${baseUrl}/api/features`);
  console.log(`   • FAQs: ${baseUrl}/api/faqs`);
  console.log(`   • Feedback: ${baseUrl}/api/feedback`);
  console.log(`   • Services: ${baseUrl}/api/services`);
  console.log(`   • Blogs: ${baseUrl}/api/blogs`);
  console.log(`   • Clinic Info: ${baseUrl}/api/clinic-info`);
  console.log(`   • Results: ${baseUrl}/api/results`);
  console.log(`   • Swagger UI: ${baseUrl}/api-docs`);
});
