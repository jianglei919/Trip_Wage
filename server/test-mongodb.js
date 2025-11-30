import dotenv from 'dotenv';
import { connectMongoDB, disconnectMongoDB } from './src/config/mongodb.js';

dotenv.config();

async function testMongoDBConnection() {
  console.log('🧪 Testing MongoDB connection...');
  console.log('MongoDB URL:', process.env.MONGODB_URL?.replace(/:[^:@]+@/, ':****@'));
  
  try {
    await connectMongoDB();
    console.log('✅ MongoDB connection test PASSED');
    
    // Test a simple operation
    const mongoose = (await import('./src/config/mongodb.js')).default;
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Collections:', collections.map(c => c.name));
    
    await disconnectMongoDB();
    console.log('👋 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection test FAILED:', error.message);
    process.exit(1);
  }
}

testMongoDBConnection();
