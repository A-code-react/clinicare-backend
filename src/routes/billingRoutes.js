import express from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  processPayment,
  getBillingStats,
  generateInvoiceFromAppointment,
  updateInvoiceStatus  
} from '../controllers/billingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats route (before :id routes)
router.get('/stats', authorize('admin'), getBillingStats);

// Generate invoice from appointment
router.post('/invoices/from-appointment/:appointmentId', authorize('admin', 'receptionist'), generateInvoiceFromAppointment);

// Payment route
router.post('/invoices/:id/pay', authorize('admin', 'receptionist'), processPayment);

// CRUD routes for invoices
router.route('/invoices')
  .post(authorize('admin', 'receptionist'), createInvoice)
  .get(getInvoices);

router.route('/invoices/:id')
  .get(getInvoiceById)
  .put(authorize('admin'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);
router.patch('/invoices/:id/status', authorize('admin'), updateInvoiceStatus);

export default router;