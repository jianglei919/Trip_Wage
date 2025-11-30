import mongoose from 'mongoose';

let isConnected = false;

export const connectMongoDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const mongoUrl = process.env.MONGODB_URL;
    
    if (!mongoUrl) {
      throw new Error('MONGODB_URL is not defined in environment variables');
    }

    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectMongoDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    throw error;
  }
};

export default mongoose;
