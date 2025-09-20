const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('📍 Connection string:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('🌐 Connected to:', mongoose.connection.host);
    console.log('📊 Database:', mongoose.connection.name);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.log('2. Verify your MongoDB connection string is correct');
    console.log('3. Check if your MongoDB Atlas cluster is running');
    console.log('4. Ensure your internet connection is stable');
    process.exit(1);
  }
};

testConnection();
