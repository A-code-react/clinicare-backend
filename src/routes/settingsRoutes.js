import express from 'express';
import {
  getClinicSettings,
  updateClinicSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getRoles,
  updateRolePermissions,
  getSystemSettings
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Clinic settings (Admin only)
router.get('/clinic', authorize('admin'), getClinicSettings);
router.put('/clinic', authorize('admin'), updateClinicSettings);

// Notification settings (All users)
router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);

// Roles & Permissions (Admin only)
router.get('/roles', authorize('admin'), getRoles);
router.put('/roles/:roleId', authorize('admin'), updateRolePermissions);

// System settings (Admin only)
router.get('/system', authorize('admin'), getSystemSettings);

export default router;