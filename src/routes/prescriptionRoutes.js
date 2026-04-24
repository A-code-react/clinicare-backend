import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  getPrescriptionStats
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats and special routes (before :id routes)
router.get('/stats/summary', getPrescriptionStats);
router.get('/patient/:patientId', getPrescriptionsByPatient);
router.get('/doctor/:doctorId', getPrescriptionsByDoctor);

// CRUD routes
router.route('/')
  .post(authorize('admin', 'doctor'), createPrescription)
  .get(getPrescriptions);

router.route('/:id')
  .get(getPrescriptionById)
  .put(authorize('admin', 'doctor'), updatePrescription)
  .delete(authorize('admin'), deletePrescription);

export default router;