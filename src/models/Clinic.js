import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema({
  clinicName: {
    type: String,
    required: true,
    default: 'ClinicCare Multispecialty Hospital'
  },
  registrationNo: {
    type: String,
    default: ''
  },
  gstNo: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  alternatePhone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'India'
  },
  website: {
    type: String,
    default: ''
  },
  establishedYear: {
    type: String,
    default: ''
  },
  licenseNo: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Clinic', clinicSchema);