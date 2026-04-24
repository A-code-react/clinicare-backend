import express from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  assignPatient,
  dischargePatient,
  getRoomStats,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats route (before :id routes)
router.get('/stats', authorize('admin'), getRoomStats);

// Assign/Discharge routes
router.post('/:id/assign', authorize('admin', 'receptionist'), assignPatient);
router.post('/:id/discharge', authorize('admin', 'receptionist'), dischargePatient);

// CRUD routes
router.route('/')
  .post(authorize('admin'), createRoom)
  .get(getRooms);

router.route('/:id')
  .get(getRoomById)
  .put(authorize('admin'), updateRoom)
  .delete(authorize('admin'), deleteRoom);

export default router;