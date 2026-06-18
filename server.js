import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './src/config/db.js';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import patientRoutes from './src/routes/patientRoutes.js';
import doctorRoutes from './src/routes/doctorRoutes.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import prescriptionRoutes from './src/routes/prescriptionRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import billingRoutes from './src/routes/billingRoutes.js';
import roomRoutes from './src/routes/roomRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';

import { initializeRoles } from './src/models/Role.js';

// Load environment variables
dotenv.config();

// Debug logs
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Validate required environment variables
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reports', reportRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ClinicCare API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Import mongoose for health check
import mongoose from 'mongoose';

// Start Server Function
const startServer = async () => {
  try {
    // First, connect to database
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected Successfully');

    // Initialize roles
    await initializeRoles();
    console.log('✅ Roles Initialized Successfully');

    // Then start the server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️ Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        console.log('🔄 Closing MongoDB connection...');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('❌ Server Startup Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Catch unexpected errors
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Start the server
startServer();