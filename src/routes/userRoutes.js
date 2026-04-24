import express from 'express';
import {
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserById
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id/role', authorize('admin'), updateUserRole);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;