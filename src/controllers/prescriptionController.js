import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

// @desc    Create a new prescription
// @route   POST /api/prescriptions
export const createPrescription = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, medicines, diagnosis, symptoms, notes, followUpDate } = req.body;

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // If appointmentId provided, check if exists
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId,
      medicines,
      diagnosis,
      symptoms,
      notes,
      followUpDate,
      createdBy: req.user.id,
    });

    // If appointmentId exists, update appointment with prescriptionId
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { prescriptionId: prescription._id });
    }

    res.status(201).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all prescriptions with pagination and filters
// @route   GET /api/prescriptions
export const getPrescriptions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      patientId, 
      doctorId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Role-based access
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ email: req.user.email });
      if (doctor) filter.doctorId = doctor._id;
    } else if (req.user.role === 'patient') {
      filter.patientId = req.user.id;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'name phone email age gender')
      .populate('doctorId', 'name specialty consultationFee')
      .populate('appointmentId', 'date time status')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(filter);

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single prescription by ID
// @route   GET /api/prescriptions/:id
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name phone email age gender bloodGroup address')
      .populate('doctorId', 'name specialty qualification experience consultationFee')
      .populate('appointmentId', 'date time status type')
      .populate('createdBy', 'name');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
export const updatePrescription = async (req, res) => {
  try {
    const { medicines, diagnosis, symptoms, notes, followUpDate, isActive } = req.body;

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { medicines, diagnosis, symptoms, notes, followUpDate, isActive },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedPrescription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // Remove prescription reference from appointment if exists
    if (prescription.appointmentId) {
      await Appointment.findByIdAndUpdate(prescription.appointmentId, { $unset: { prescriptionId: 1 } });
    }

    res.json({
      success: true,
      message: 'Prescription deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get prescriptions by patient ID
// @route   GET /api/prescriptions/patient/:patientId
export const getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialty')
      .populate('appointmentId', 'date')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get prescriptions by doctor ID
// @route   GET /api/prescriptions/doctor/:doctorId
export const getPrescriptionsByDoctor = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name phone')
      .populate('appointmentId', 'date')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get prescription statistics
// @route   GET /api/prescriptions/stats/summary
export const getPrescriptionStats = async (req, res) => {
  try {
    const total = await Prescription.countDocuments();
    const active = await Prescription.countDocuments({ isActive: true });
    const inactive = await Prescription.countDocuments({ isActive: false });
    
    // Get today's prescriptions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayPrescriptions = await Prescription.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        today: todayPrescriptions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};