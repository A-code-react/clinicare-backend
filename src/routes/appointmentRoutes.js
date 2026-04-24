import express from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getAvailableSlots,
  getAppointmentStats
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats and available slots (before :id routes)
router.get('/stats/summary', getAppointmentStats);
router.get('/available-slots', getAvailableSlots);

// CRUD routes
router.route('/')
  .post(authorize('admin', 'receptionist'), createAppointment)
  .get(getAppointments);

router.route('/:id')
  .get(getAppointmentById)
  .put(authorize('admin', 'receptionist'), updateAppointment)
  .delete(authorize('admin'), deleteAppointment);

router.patch('/:id/status', updateAppointmentStatus);

export default router;