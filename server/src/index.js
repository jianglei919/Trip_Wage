import express from 'express';
import cors from 'cors';
// Load environment variables FIRST
import './config/env.js';
import { initializeFirebase } from './config/firebase.js';
import { connectMongoDB } from './config/mongodb.js';

const app = express();
const PORT = process.env.PORT || 5000;
const DB_TYPE = process.env.DB_TYPE || 'firebase';
const DUAL = String(process.env.DB_DUAL_WRITE || '').toLowerCase() === 'true';

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Database based on DB_TYPE / DUAL mode
if (DUAL) {
  console.log('🚀 Initializing database: DUAL-WRITE (MongoDB + Firebase)');
  let mongoOk = false;
  let firebaseOk = false;
  try {
    await connectMongoDB();
    mongoOk = true;
    console.log('✅ MongoDB initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MongoDB:', error);
  }
  try {
    initializeFirebase();
    firebaseOk = true;
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
  }
  if (!mongoOk && !firebaseOk) {
    console.error('❌ Dual mode requires at least one backend initialized. Exiting.');
    process.exit(1);
  }
} else {
  console.log(`🚀 Initializing database: ${DB_TYPE.toUpperCase()}`);
  if (DB_TYPE === 'mongodb') {
    try {
      await connectMongoDB();
      console.log('✅ MongoDB initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MongoDB:', error);
      process.exit(1);
    }
  } else {
    try {
      initializeFirebase();
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      process.exit(1);
    }
  }
}

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Trip Wage API' });
});

// Import routes
import orderRoutes from './routes/tripRoutes.js';
import userRoutes from './routes/userRoutes.js';
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
