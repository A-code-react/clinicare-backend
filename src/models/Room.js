import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['General Ward', 'Private Room', 'ICU', 'Deluxe Suite'],
    required: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available',
  },
  currentPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null,
  },
  currentPatientName: {
    type: String,
    default: '',
  },
  admissionDate: {
    type: Date,
    default: null,
  },
  expectedDischargeDate: {
    type: Date,
    default: null,
  },
  amenities: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Room', roomSchema);