import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    enum: ['Allergy and Immunology', 'Anesthesiology', 'Cardiology', 'Dermatology', 
           'Emergency Medicine', 'Family Medicine', 'Internal Medicine', 'Neurology',
           'Obstetrics and Gynecology', 'Oncology', 'Orthopedic Surgery', 'Pediatrics',
           'Psychiatry', 'Radiology', 'Urology','Gynecology'],
  },
  qualification: String,
  experience: {
    type: Number,
    min: 0,
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0,
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'on-leave'],
    default: 'available',
  },
  schedule: [{
    day: String,
    startTime: String,
    endTime: String,
    isAvailable: Boolean,
  }],
  patientsCount: {
    type: Number,
    default: 0,
  },
  avatar: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Doctor', doctorSchema);