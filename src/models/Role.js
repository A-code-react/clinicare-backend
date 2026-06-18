import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'doctor', 'receptionist', 'lab_technician', 'pharmacist']
  },
  description: String,
  permissions: [{
    type: String
  }],
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Default roles data
const defaultRoles = [
  { name: 'admin', description: 'Full access to all features', permissions: ['all'] },
  { name: 'doctor', description: 'Access to patients, appointments, prescriptions', permissions: ['view_patients', 'edit_patients', 'view_appointments', 'edit_appointments', 'view_prescriptions', 'edit_prescriptions'] },
  { name: 'receptionist', description: 'Access to patients, appointments, billing', permissions: ['view_patients', 'edit_patients', 'view_appointments', 'edit_appointments', 'view_billing', 'create_billing'] },
  { name: 'lab_technician', description: 'Access to lab tests and results', permissions: ['view_lab_tests', 'edit_lab_tests', 'view_reports'] },
  { name: 'pharmacist', description: 'Access to prescriptions and medicines', permissions: ['view_prescriptions', 'edit_prescriptions', 'view_inventory'] }
];

// Initialize default roles if none exist
export const initializeRoles = async () => {
  const count = await mongoose.model('Role').countDocuments();
  if (count === 0) {
    await mongoose.model('Role').insertMany(defaultRoles); }
};

export default mongoose.model('Role', roleSchema);
