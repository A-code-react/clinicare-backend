import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String,
  }],
  allergies: [String],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'admitted'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Patient', patientSchema);