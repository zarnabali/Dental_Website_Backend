// Test script to verify the setup
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

console.log('🧪 Testing Node.js Express.js setup...\n');

// Test 1: Check if all required packages are installed
console.log('1. Checking required packages...');
try {
  require('express');
  require('mongoose');
  require('cloudinary');
  require('cors');
  require('helmet');
  require('morgan');
  require('bcryptjs');
  require('jsonwebtoken');
  require('multer');
  require('express-validator');
  console.log('✅ All required packages are installed\n');
} catch (error) {
  console.log('❌ Missing packages:', error.message);
  process.exit(1);
}

// Test 2: Check environment variables
console.log('2. Checking environment variables...');
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'FRONTEND_URL'
];

let missingEnvVars = [];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
});

if (missingEnvVars.length === 0) {
  console.log('✅ All environment variables are set\n');
} else {
  console.log('⚠️  Missing environment variables:', missingEnvVars.join(', '));
  console.log('   Please update your config.env file with actual values\n');
}

// Test 3: Check MongoDB connection
console.log('3. Testing MongoDB connection...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connection successful\n');
  
  // Test 4: Check if models can be loaded
  console.log('4. Testing model loading...');
  try {
    require('./models/User');
    require('./models/Appointment');
    require('./models/Service');
    require('./models/Contact');
    console.log('✅ All models loaded successfully\n');
  } catch (error) {
    console.log('❌ Error loading models:', error.message);
  }
  
  // Test 5: Check if routes can be loaded
  console.log('5. Testing route loading...');
  try {
    require('./routes/auth');
    require('./routes/appointments');
    require('./routes/services');
    require('./routes/contacts');
    console.log('✅ All routes loaded successfully\n');
  } catch (error) {
    console.log('❌ Error loading routes:', error.message);
  }
  
  console.log('🎉 Setup verification completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Update config.env with your actual MongoDB and Cloudinary credentials');
  console.log('2. Start the server with: npm run dev');
  console.log('3. Test the API at: http://localhost:5000');
  console.log('4. Check health at: http://localhost:5000/health');
  
  process.exit(0);
})
.catch((error) => {
  console.log('❌ MongoDB connection failed:', error.message);
  console.log('   Please check your MONGODB_URI in config.env');
  process.exit(1);
});
