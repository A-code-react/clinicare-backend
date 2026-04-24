import Invoice from '../models/Invoice.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

// Generate invoice number function
const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const count = await Invoice.countDocuments();
  const sequential = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequential}`;
};

// @desc    Create new invoice
// @route   POST /api/billing/invoices
export const createInvoice = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      items,
      discount,
      notes
    } = req.body;

    console.log('Creating invoice for:', { patientId, doctorId });

    // Validate patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Validate doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Calculate totals
    const calculatedItems = items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice
    }));

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax - (discount || 0);

    // Set due date (15 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    const invoiceData = {
      invoiceNumber,
      patientId,
      patientName: patient.name,
      doctorId,
      doctorName: doctor.name,
      appointmentId: appointmentId || null,
      items: calculatedItems,
      subtotal,
      tax,
      discount: discount || 0,
      total,
      dueDate,
      notes: notes || '',
      doctorSignature: doctor.name,
      createdBy: req.user.id
    };

    const invoice = await Invoice.create(invoiceData);

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all invoices with pagination and filters
// @route   GET /api/billing/invoices
export const getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      patientId,
      doctorId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const invoices = await Invoice.find(filter)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name specialty')
      .populate('appointmentId', 'date time')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/billing/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patientId', 'name phone email address')
      .populate('doctorId', 'name specialty qualification consultationFee')
      .populate('appointmentId', 'date time type')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/billing/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const { items, discount, notes, status } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let updateData = {};

    if (items) {
      const calculatedItems = items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      }));
      const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.18;
      updateData.items = calculatedItems;
      updateData.subtotal = subtotal;
      updateData.tax = tax;
      updateData.total = subtotal + tax - (discount || invoice.discount);
    }

    if (discount !== undefined) {
      updateData.discount = discount;
      updateData.total = invoice.subtotal + invoice.tax - discount;
    }

    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process payment
// @route   POST /api/billing/invoices/:id/pay
export const processPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice already paid' });
    }

    invoice.status = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paymentDate = new Date();

    await invoice.save();

    res.json({
      success: true,
      data: invoice,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/billing/invoices/:id
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get billing statistics
// @route   GET /api/billing/stats
// @desc    Get billing statistics with percentage changes
// @route   GET /api/billing/stats
export const getBillingStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    // Current month revenue
    const currentMonthRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: startOfCurrentMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    // Last month revenue
    const lastMonthRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    // Calculate percentage change
    const currentRevenue = currentMonthRevenue[0]?.total || 0;
    const lastRevenue = lastMonthRevenue[0]?.total || 0;
    let revenueChange = 0;
    if (lastRevenue > 0) {
      revenueChange = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
    }
    
    // Get pending invoices count change
    const currentPendingCount = await Invoice.countDocuments({ 
      status: 'pending',
      createdAt: { $gte: startOfCurrentMonth }
    });
    const lastPendingCount = await Invoice.countDocuments({
      status: 'pending',
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    let pendingChange = 0;
    if (lastPendingCount > 0) {
      pendingChange = ((currentPendingCount - lastPendingCount) / lastPendingCount) * 100;
    }
    
    // Get overdue count change
    const currentOverdueCount = await Invoice.countDocuments({ status: 'overdue' });
    const lastOverdueCount = await Invoice.countDocuments({
      status: 'overdue',
      updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    let overdueChange = 0;
    if (lastOverdueCount > 0) {
      overdueChange = ((currentOverdueCount - lastOverdueCount) / lastOverdueCount) * 100;
    }
    
    const stats = {
      totalRevenue: currentRevenue,
      pendingAmount: await Invoice.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]).then(res => res[0]?.total || 0),
      thisMonthAmount: currentRevenue,
      overdueAmount: await Invoice.aggregate([
        { $match: { status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]).then(res => res[0]?.total || 0),
      paidCount: await Invoice.countDocuments({ status: 'paid' }),
      pendingCount: await Invoice.countDocuments({ status: 'pending' }),
      overdueCount: currentOverdueCount,
      // Percentage changes
      revenueChange: revenueChange.toFixed(1),
      pendingChange: pendingChange.toFixed(1),
      overdueChange: overdueChange.toFixed(1),
      isPositiveRevenue: revenueChange >= 0,
      isPositivePending: pendingChange <= 0, // Decreasing pending is positive
      isPositiveOverdue: overdueChange <= 0  // Decreasing overdue is positive
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting billing stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate invoice from appointment
// @route   POST /api/billing/invoices/from-appointment/:appointmentId
export const generateInvoiceFromAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('patientId')
      .populate('doctorId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if invoice already exists for this appointment
    const existingInvoice = await Invoice.findOne({ appointmentId: appointment._id });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: 'Invoice already exists for this appointment' });
    }

    // Create default invoice items
    const items = [
      {
        description: 'Consultation Fee',
        quantity: 1,
        unitPrice: appointment.doctorId.consultationFee,
        total: appointment.doctorId.consultationFee
      }
    ];

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      patientId: appointment.patientId._id,
      patientName: appointment.patientId.name,
      doctorId: appointment.doctorId._id,
      doctorName: appointment.doctorId.name,
      appointmentId: appointment._id,
      items,
      subtotal,
      tax,
      total,
      dueDate,
      doctorSignature: appointment.doctorId.name,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice generated from appointment'
    });
  } catch (error) {
    console.error('Error generating invoice from appointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Update invoice status (for manual status changes)
// @route   PATCH /api/billing/invoices/:id/status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // If marking as paid, set payment date
    if (status === 'paid' && invoice.status !== 'paid') {
      invoice.paymentDate = new Date();
    }

    invoice.status = status;
    await invoice.save();

    res.json({
      success: true,
      data: invoice,
      message: `Invoice status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};