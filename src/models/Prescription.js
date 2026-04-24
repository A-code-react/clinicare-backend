import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
  },
  instructions: String,
  timing: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
  }],
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    unique: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required'],
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required'],
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  medicines: [medicineSchema],
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
  },
  symptoms: String,
  notes: String,
  followUpDate: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// ✅ FIXED: Remove 'next' parameter - use async without calling next
prescriptionSchema.pre('save', async function() {
  if (!this.prescriptionNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const Prescription = mongoose.model('Prescription');
    const count = await Prescription.countDocuments();
    this.prescriptionNumber = `PRX/${year}/${month}/${String(count + 1).padStart(4, '0')}`;
  }
});

export default mongoose.model('Prescription', prescriptionSchema);