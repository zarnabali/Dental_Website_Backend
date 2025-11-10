const express = require('express');

// Load environment variables (for local development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

console.log('Vercel function starting...');

// Basic middleware - IMPORTANT: Don't parse multipart/form-data with body parsers
// express.json() and express.urlencoded() only parse specific content types
// Multer will handle multipart/form-data, so these won't interfere
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware - Allow all necessary headers for file uploads
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Basic logging - log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers['content-type'] || 'No content-type');
  next();
});

// MongoDB connection setup
const mongoose = require('mongoose');

// Resolve MongoDB URI from environment variables
const MONGODB_URI = 
  process.env.MONGODB_URI || 
  process.env.DATABASE_URL || 
  process.env.MONGO_URL || 
  process.env.MONGODB_CONNECTION_STRING ||
  'mongodb+srv://Admin01:Admin@admin.ywqztuq.mongodb.net/dentist_website?retryWrites=true&w=majority';

console.log('MongoDB URI configured:', MONGODB_URI ? 'YES' : 'NO');
console.log('URI length:', MONGODB_URI?.length || 0);

// Global connection promise for serverless caching
let cachedConnection = null;
let connectionPromise = null;

// Optimized MongoDB connection for serverless
const connectDB = async () => {
  // Return cached connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  // Return existing connection attempt if in progress
  if (connectionPromise) {
    console.log('Connection attempt in progress, waiting...');
    return connectionPromise;
  }

  // Create new connection promise
  connectionPromise = (async () => {
    try {
      console.log('Creating new MongoDB connection...');
      
      // Disconnect if in a bad state
      if (mongoose.connection.readyState !== 0) {
        console.log('Disconnecting existing connection...');
        await mongoose.disconnect();
      }

      // Connect with serverless-optimized settings
      const conn = await mongoose.connect(MONGODB_URI, {
        // Shorter timeouts for serverless
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        
        // Minimal pool for serverless
        maxPoolSize: 1,
        minPoolSize: 0,
        
        // Enable connection reuse
        maxIdleTimeMS: 10000,
        
        // Retry settings
        retryWrites: true,
        retryReads: true,
      });

      console.log('MongoDB connected successfully');
      cachedConnection = conn;
      return conn;
      
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      cachedConnection = null;
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected');
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  cachedConnection = null;
  connectionPromise = null;
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
  cachedConnection = null;
  connectionPromise = null;
});

// Database connection middleware - BLOCKING until connected
const checkDBConnection = async (req, res, next) => {
  try {
    console.log(`DB Check for ${req.method} ${req.url}`);
    console.log('Current mongoose state:', mongoose.connection.readyState);
    
    // Wait for connection with timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 8000)
    );
    
    await Promise.race([connectDB(), timeout]);
    
    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Connection not ready after connect attempt');
    }
    
    console.log('DB connection verified, proceeding');
    next();
    
  } catch (error) {
    console.error('DB connection check failed:', error.message);
    
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      debug: {
        mongooseState: mongoose.connection.readyState,
        stateNames: ['disconnected', 'connected', 'connecting', 'disconnecting'],
        currentState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
        hasUri: !!MONGODB_URI,
        timestamp: new Date().toISOString()
      }
    });
  }
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

// Load results routes with error handling
let resultsRoutes;
try {
  console.log('🔄 Loading results routes from ../routes/results...');
  resultsRoutes = require('../routes/results');
  console.log('✅ Results routes loaded successfully');
  console.log('Results routes is a function:', typeof resultsRoutes === 'function');
  console.log('Results routes has router methods:', typeof resultsRoutes.get === 'function');
} catch (error) {
  console.error('❌ CRITICAL ERROR loading results routes:', error);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  // Create a dummy router that returns an error so the app doesn't crash
  const express = require('express');
  resultsRoutes = express.Router();
  resultsRoutes.all('*', (req, res) => {
    console.error('Results routes failed to load, returning error');
    res.status(500).json({
      success: false,
      message: 'Results routes failed to load: ' + error.message,
      error: error.stack
    });
  });
}

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

// Register results routes - CRITICAL: Must be registered BEFORE the 404 handler
console.log('═══════════════════════════════════════════════════════');
console.log('🔄 Registering /api/results route...');
if (!resultsRoutes) {
  console.error('❌ CRITICAL: resultsRoutes is undefined!');
} else {
  console.log('✅ Results routes object exists');
  console.log('Results routes type:', typeof resultsRoutes);
  console.log('Has get method:', typeof resultsRoutes.get === 'function');
  console.log('Has post method:', typeof resultsRoutes.post === 'function');
  console.log('Has delete method:', typeof resultsRoutes.delete === 'function');
}

try {
  // Register the route with DB check
  app.use('/api/results', checkDBConnection, resultsRoutes);
  console.log('✅ Results route registered at /api/results');
  console.log('Routes available: GET /api/results, POST /api/results, DELETE /api/results/:id');
  console.log('Test route: GET /api/results/test (no DB required)');
} catch (error) {
  console.error('❌ FATAL ERROR registering results route:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
}
console.log('═══════════════════════════════════════════════════════');

// Basic routes (no DB required)
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
      results: '/api/results',
      docs: '/api-docs'
    }
  });
});

app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await connectDB();
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'not ready';
  } catch (error) {
    dbStatus = 'error: ' + error.message;
  }
  
  res.json({
    status: 'OK',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/debug/db', async (req, res) => {
  let connectionStatus = 'unknown';
  let connectionError = null;
  
  try {
    await connectDB();
    connectionStatus = 'connected';
  } catch (error) {
    connectionStatus = 'failed';
    connectionError = error.message;
  }
  
  // Mask the URI for security
  let maskedUri = 'NOT SET';
  if (MONGODB_URI) {
    maskedUri = MONGODB_URI.replace(/:[^:@]*@/, ':***@');
  }
  
  res.json({
    success: connectionStatus === 'connected',
    connectionStatus,
    connectionError,
    hasUri: !!MONGODB_URI,
    uriLength: MONGODB_URI?.length || 0,
    maskedUri: maskedUri,
    uriStructure: {
      startsWithMongo: MONGODB_URI?.startsWith('mongodb') || false,
      hasSrv: MONGODB_URI?.includes('mongodb+srv') || false,
      hasAuth: MONGODB_URI?.includes('@') || false,
      hasDatabase: MONGODB_URI?.includes('/dentist_website') || false,
      hasQueryParams: MONGODB_URI?.includes('?') || false
    },
    mongooseState: mongoose.connection.readyState,
    stateNames: {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    },
    currentStateName: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    cachedConnection: !!cachedConnection,
    timestamp: new Date().toISOString()
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
      hasMongoUri: !!MONGODB_URI,
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

// Test route without database dependency
app.get('/api/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Simple API test - no database required',
    timestamp: new Date().toISOString(),
    dbStatus: {
      mongooseState: mongoose.connection.readyState,
      cached: !!cachedConnection
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

// 404 handler - MUST be last
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log('Available routes should include /api/results');
  res.status(404).json({
    message: 'Route not found',
    status: 'error',
    url: req.originalUrl,
    method: req.method,
    hint: 'Check if the route is registered and the server was restarted'
  });
});

// Export for Vercel
module.exports = app;

