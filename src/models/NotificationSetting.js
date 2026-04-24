import mongoose from 'mongoose';

const notificationSettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  appointmentReminders: {
    type: Boolean,
    default: true
  },
  paymentAlerts: {
    type: Boolean,
    default: true
  },
  prescriptionAlerts: {
    type: Boolean,
    default: true
  },
  labReportReady: {
    type: Boolean,
    default: true
  },
  reminderTime: {
    type: Number,
    default: 15
  }
}, {
  timestamps: true
});

export default mongoose.model('NotificationSetting', notificationSettingSchema);