// Minimal Vercel function - no Express
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

// Main handler function
module.exports = (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Normalize URL (remove query params and handle different formats)
  const url = req.url.split('?')[0];
  console.log('Normalized URL:', url);
  
  // Route handling with more flexible matching
  if (url === '/' || url === '' || url === '/index.html') {
    return res.json({
      message: 'Dentist Website API is running on Vercel!',
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: req.url,
      normalizedUrl: url
    });
  }
  
  if (url === '/health' || url.endsWith('/health')) {
    return res.json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: req.url,
      normalizedUrl: url
    });
  }
  
  if (url === '/debug/env' || url.endsWith('/debug/env')) {
    return res.json({
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
      },
      url: req.url,
      normalizedUrl: url
    });
  }
  
  if (url === '/api/test' || url.endsWith('/api/test')) {
    return res.json({
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      url: req.url,
      normalizedUrl: url
    });
  }
  
  // Debug route to see what's being requested
  if (url === '/debug/request' || url.endsWith('/debug/request')) {
    return res.json({
      success: true,
      request: {
        method: req.method,
        url: req.url,
        normalizedUrl: url,
        headers: req.headers,
        query: req.query
      }
    });
  }
  
  // 404 for other routes
  res.status(404).json({
    message: 'Route not found',
    status: 'error',
    url: req.url,
    normalizedUrl: url,
    availableRoutes: ['/', '/health', '/debug/env', '/api/test', '/debug/request']
  });
};
