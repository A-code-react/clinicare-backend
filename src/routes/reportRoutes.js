import express from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getPatientAnalytics,
  getAppointmentAnalytics,
  getDoctorPerformance,
  getTopServices,
  exportReport
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard and analytics
router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/patients', getPatientAnalytics);
router.get('/appointments', getAppointmentAnalytics);
router.get('/doctors', authorize('admin'), getDoctorPerformance);
router.get('/services', getTopServices);
router.get('/export', exportReport);

export default router;