import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Removed select: false
  role: { 
    type: String, 
    enum: ['admin', 'doctor', 'receptionist', 'lab_technician', 'pharmacist'],
    default: 'receptionist' 
  },
  phone: { type: String, default: '' },
  department: {
  type: String,
  default: 'General'
},
  lastLogin: Date,
}, 
{ timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model('User', userSchema);