import express from 'express';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getSpecialties
} from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get specialties list
router.get('/specialties', getSpecialties);

// CRUD routes
router.route('/')
  .post(authorize('admin'), createDoctor)
  .get(getDoctors);

router.route('/:id')
  .get(getDoctorById)
  .put(authorize('admin'), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

export default router;