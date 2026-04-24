import express from 'express';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientStats
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats route (before :id route)
router.get('/stats/summary', getPatientStats);

// CRUD routes
router.route('/')
  .post(authorize('admin', 'receptionist'), createPatient)
  .get(getPatients);

router.route('/:id')
  .get(getPatientById)
  .put(authorize('admin', 'receptionist'), updatePatient)
  .delete(authorize('admin'), deletePatient);

export default router; // ✅ Make sure this line exists