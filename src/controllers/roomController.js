import Room from '../models/Room.js';
import Patient from '../models/Patient.js';

// @desc    Create a new room
// @route   POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { roomNumber, type, floor, pricePerDay, amenities } = req.body;

    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }

    const room = await Room.create({
      roomNumber,
      type,
      floor,
      pricePerDay,
      amenities: amenities || [],
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully',
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all rooms with pagination and filters
// @route   GET /api/rooms
export const getRooms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      type,
      status,
      floor,
      sortBy = 'roomNumber',
      sortOrder = 'asc',
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (floor) filter.floor = parseInt(floor);
    if (search) {
      filter.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { currentPatientName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const rooms = await Room.find(filter)
      .populate('currentPatientId', 'name phone email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Room.countDocuments(filter);

    res.json({
      success: true,
      data: rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('currentPatientId', 'name phone email');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { type, floor, pricePerDay, amenities, status } = req.body;

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { type, floor, pricePerDay, amenities, status },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      data: room,
      message: 'Room updated successfully',
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign patient to room
// @route   POST /api/rooms/:id/assign
// @desc    Assign patient to room
// @route   POST /api/rooms/:id/assign
// @desc    Assign patient to room
// @route   POST /api/rooms/:id/assign
export const assignPatient = async (req, res) => {
  try {
    const { patientId, admissionDate, expectedDischargeDate } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Room is already occupied' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // ✅ FIXED: Check if patient is already assigned to another occupied room
    const existingAssignment = await Room.findOne({
      currentPatientId: patientId,
      status: 'occupied'
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        success: false, 
        message: `Patient ${patient.name} is already assigned to Room ${existingAssignment.roomNumber}. Please discharge them first.` 
      });
    }

    room.status = 'occupied';
    room.currentPatientId = patientId;
    room.currentPatientName = patient.name;
    room.admissionDate = new Date(admissionDate);
    room.expectedDischargeDate = expectedDischargeDate ? new Date(expectedDischargeDate) : null;

    await room.save();

    res.json({
      success: true,
      data: room,
      message: `Patient ${patient.name} assigned to room ${room.roomNumber}`,
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Discharge patient from room
// @route   POST /api/rooms/:id/discharge
export const dischargePatient = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status !== 'occupied') {
      return res.status(400).json({ success: false, message: 'Room is not occupied' });
    }

    const patientName = room.currentPatientName;
    const admissionDate = room.admissionDate;
    const dischargeDate = new Date();
    
    // Calculate number of days stayed
    const daysStayed = Math.ceil((dischargeDate - admissionDate) / (1000 * 60 * 60 * 24));
    const roomBill = daysStayed * room.pricePerDay;

    room.status = 'available';
    room.currentPatientId = null;
    room.currentPatientName = '';
    room.admissionDate = null;
    room.expectedDischargeDate = null;

    await room.save();

    res.json({
      success: true,
      data: {
        room,
        dischargeInfo: {
          patientName,
          admissionDate,
          dischargeDate,
          daysStayed,
          roomBill,
        },
      },
      message: `Patient ${patientName} discharged. Room bill: ₹${roomBill}`,
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get room statistics
// @route   GET /api/rooms/stats
export const getRoomStats = async (req, res) => {
  try {
    const total = await Room.countDocuments();
    const available = await Room.countDocuments({ status: 'available' });
    const occupied = await Room.countDocuments({ status: 'occupied' });
    const maintenance = await Room.countDocuments({ status: 'maintenance' });

    // Revenue from occupied rooms
    const occupiedRooms = await Room.find({ status: 'occupied' });
    const dailyRevenue = occupiedRooms.reduce((sum, room) => sum + room.pricePerDay, 0);

    res.json({
      success: true,
      data: {
        total,
        available,
        occupied,
        maintenance,
        dailyRevenue,
      },
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message });
  }
};