import Doctor from '../models/Doctor.js';

// @desc    Create a new doctor
// @route   POST /api/doctors
export const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    
    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all doctors with pagination and filters
// @route   GET /api/doctors
export const getDoctors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      specialty,
      availability,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {};
    if (specialty) filter.specialty = specialty;
    if (availability) filter.availability = availability;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const doctors = await Doctor.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(filter);

    res.json({
      success: true,
      data: doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    res.json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get doctor specialties list
// @route   GET /api/doctors/specialties
export const getSpecialties = async (req, res) => {
  try {
    const specialties = [
      'Allergy and Immunology', 'Anesthesiology', 'Cardiology', 'Dermatology',
      'Emergency Medicine', 'Family Medicine', 'Internal Medicine', 'Neurology',
      'Obstetrics and Gynecology', 'Oncology', 'Orthopedic Surgery', 'Pediatrics',
      'Psychiatry', 'Radiology', 'Urology'
    ];
    
    res.json({
      success: true,
      data: specialties
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};