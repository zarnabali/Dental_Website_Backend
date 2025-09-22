const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../config/swagger');

const app = express();

// Security middleware (relaxed for Swagger UI assets on Vercel)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Basic request logging (lightweight)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rate limiting - More generous for Vercel
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Permissive CORS for Vercel/Next.js frontends (reflect origin, allow credentials)
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// MongoDB connection with caching for Vercel serverless and buffering enabled
let cached = global.__mongooseConn;
if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }
  const RESOLVED_MONGODB_URI =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URL ||
    process.env.MONGODB_CONNECTION_STRING;

  if (!RESOLVED_MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not set. Continuing without DB connection.');
    return null;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(RESOLVED_MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        // Disable buffering to fail fast when DB is unreachable
        bufferCommands: false,
      })
      .then((mongooseInstance) => {
        console.log('✅ Connected to MongoDB successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error (non-fatal):', error?.message || error);
        return null;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};

// Initialize connection (non-blocking)
connectDB();

// Ensure DB connected before handling mutating/DB-dependent routes
const ensureDbConnected = async (req, res, next) => {
  try {
    if (!cached?.conn) {
      await connectDB();
    }
    if (!cached?.conn) {
      // Still no connection: return 503 to avoid opaque 500s
      return res.status(503).json({ success: false, message: 'Database unavailable. Check IP allowlist and credentials.' });
    }
    return next();
  } catch (err) {
    console.error('DB readiness check failed:', err?.message || err);
    return res.status(503).json({ success: false, message: 'Service unavailable. Database not connected yet.' });
  }
};

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

// Import routes
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dentist Website API Documentation'
}));

// Routes
app.use('/api/auth', ensureDbConnected, authRoutes);
app.use('/api/users', ensureDbConnected, userRoutes);
app.use('/api/upload', ensureDbConnected, uploadRoutes);
app.use('/api/hero-images', ensureDbConnected, heroImageRoutes);
app.use('/api/hero-videos', ensureDbConnected, heroVideoRoutes);
app.use('/api/partners', ensureDbConnected, partnerRoutes);
app.use('/api/team', ensureDbConnected, teamRoutes);
app.use('/api/team-pictures', ensureDbConnected, teamPictureRoutes);
app.use('/api/features', ensureDbConnected, featuresRoutes);
app.use('/api/faqs', ensureDbConnected, faqRoutes);
app.use('/api/feedback', ensureDbConnected, feedbackRoutes);
app.use('/api/services', ensureDbConnected, serviceRoutes);
app.use('/api/blogs', ensureDbConnected, blogRoutes);
app.use('/api/clinic-info', ensureDbConnected, clinicInfoRoutes);

// Basic route
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

// Debug: environment (non-sensitive)
app.get('/debug/env', (req, res) => {
  const safeEnv = {
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    productionApiUrl: process.env.PRODUCTION_API_URL,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
  };
  res.json({ success: true, env: safeEnv });
});

// Debug: database
app.get('/debug/db', async (req, res) => {
  try {
    const state = mongoose.connection?.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    let ping = null;
    if (state === 1) {
      ping = await mongoose.connection.db.admin().ping();
    }
    res.json({ success: true, state, ping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Simple test route for frontend connectivity
app.get('/api/test-connection', (req, res) => {
  res.json({
    success: true,
    message: 'Backend connection successful',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  console.error('Request:', req.method, req.url);
  if (err && err.stack) console.error('Stack:', err.stack);
  // Handle CORS errors properly
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Not allowed by CORS',
      error: 'Origin not allowed'
    });
  }
  res.status(500).json({
    success: false,
    message: err?.message || 'Internal server error',
    path: req.url,
    method: req.method
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    status: 'error'
  });
});

// Export a request handler for Vercel
module.exports = (req, res) => app(req, res);
