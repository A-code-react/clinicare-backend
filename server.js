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
// Load environment variables FIRST
dotenv.config();

// Check if .env loaded correctly
console.log('📝 Environment variables loaded:');
console.log(`   PORT: ${process.env.PORT || 'not set'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✓ set' : '✗ not set'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✓ set' : '✗ not set'}`);

// Connect to database
connectDB();
connectDB().then(() => {
  initializeRoles();
});
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));

// ============ ROUTES ============
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
// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ClinicCare API is running', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============ ERROR HANDLING ============

// 404 handler - for routes that don't exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler - MUST have 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err.message);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});