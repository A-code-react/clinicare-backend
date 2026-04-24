import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

// @desc    Create a new appointment
// @route   POST /api/appointments
export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, time, type, symptoms, notes } = req.body;

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

    // Check for conflicting appointment
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $nin: ['cancelled', 'completed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor already has an appointment at this time' 
      });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      time,
      type,
      symptoms,
      notes,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all appointments with pagination and filters
// @route   GET /api/appointments
export const getAppointments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      doctorId, 
      patientId,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
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

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name specialty consultationFee')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: appointments,
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

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name phone email age gender bloodGroup')
      .populate('doctorId', 'name specialty consultationFee experience')
      .populate('createdBy', 'name');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
export const updateAppointment = async (req, res) => {
  try {
    const { date, time, status, type, symptoms, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check for conflicting appointment if date/time is changing
    if ((date && date !== appointment.date.toISOString().split('T')[0]) || 
        (time && time !== appointment.time)) {
      const conflictingAppointment = await Appointment.findOne({
        doctorId: appointment.doctorId,
        date: date || appointment.date,
        time: time || appointment.time,
        _id: { $ne: req.params.id },
        status: { $nin: ['cancelled', 'completed'] }
      });

      if (conflictingAppointment) {
        return res.status(400).json({ 
          success: false, 
          message: 'Doctor already has an appointment at this time' 
        });
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { date, time, status, type, symptoms, notes },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/appointments/available-slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor ID and date are required' 
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Define time slots
    const allTimeSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
      '04:00 PM', '04:30 PM', '05:00 PM'
    ];

    // Get booked appointments for that doctor on that date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: new Date(date),
      status: { $nin: ['cancelled', 'completed'] }
    });

    const bookedSlots = bookedAppointments.map(apt => apt.time);

    // Filter available slots
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      data: {
        doctorId,
        doctorName: doctor.name,
        date,
        availableSlots,
        allTimeSlots,
        bookedSlots
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats/summary
export const getAppointmentStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const total = await Appointment.countDocuments();
    const todayCount = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    const pending = await Appointment.countDocuments({ status: 'pending' });
    const confirmed = await Appointment.countDocuments({ status: 'confirmed' });
    const completed = await Appointment.countDocuments({ status: 'completed' });
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' });

    res.json({
      success: true,
      data: {
        total,
        today: todayCount,
        pending,
        confirmed,
        completed,
        cancelled
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};