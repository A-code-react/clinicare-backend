import Clinic from '../models/Clinic.js';
import NotificationSetting from '../models/NotificationSetting.js';
import Role from '../models/Role.js';

// @desc    Get clinic settings (Admin only)
// @route   GET /api/settings/clinic
export const getClinicSettings = async (req, res) => {
  try {
    let clinic = await Clinic.findOne();
    
    if (!clinic) {
      // Create default clinic settings if none exists
      clinic = await Clinic.create({
        clinicName: 'ClinicCare Multispecialty Hospital',
        registrationNo: 'MH123456789',
        gstNo: '27AAACC1234D1Z',
        email: 'info@clinicare.com',
        phone: '+91 98765 43210',
        address: '123 Healthcare Ave, Medical District, Mumbai - 400001',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        website: 'www.clinicare.com'
      });
    }

    res.json({ success: true, data: clinic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update clinic settings (Admin only)
// @route   PUT /api/settings/clinic
export const updateClinicSettings = async (req, res) => {
  try {
    const {
      clinicName,
      registrationNo,
      gstNo,
      email,
      phone,
      alternatePhone,
      address,
      city,
      state,
      pincode,
      country,
      website,
      establishedYear,
      licenseNo
    } = req.body;

    let clinic = await Clinic.findOne();
    
    if (!clinic) {
      clinic = new Clinic();
    }

    if (clinicName) clinic.clinicName = clinicName;
    if (registrationNo) clinic.registrationNo = registrationNo;
    if (gstNo) clinic.gstNo = gstNo;
    if (email) clinic.email = email;
    if (phone) clinic.phone = phone;
    if (alternatePhone) clinic.alternatePhone = alternatePhone;
    if (address) clinic.address = address;
    if (city) clinic.city = city;
    if (state) clinic.state = state;
    if (pincode) clinic.pincode = pincode;
    if (country) clinic.country = country;
    if (website) clinic.website = website;
    if (establishedYear) clinic.establishedYear = establishedYear;
    if (licenseNo) clinic.licenseNo = licenseNo;

    await clinic.save();

    res.json({
      success: true,
      data: clinic,
      message: 'Clinic settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notification settings
// @route   GET /api/settings/notifications
export const getNotificationSettings = async (req, res) => {
  try {
    let settings = await NotificationSetting.findOne({ userId: req.user.id });
    
    if (!settings) {
      // Create default notification settings
      settings = await NotificationSetting.create({
        userId: req.user.id,
        emailNotifications: true,
        appointmentReminders: true,
        paymentAlerts: true,
        prescriptionAlerts: true,
        labReportReady: true,
        reminderTime: 15
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
export const updateNotificationSettings = async (req, res) => {
  try {
    const {
      emailNotifications,
      smsNotifications,
      appointmentReminders,
      paymentAlerts,
      prescriptionAlerts,
      labReportReady,
      reminderTime
    } = req.body;

    let settings = await NotificationSetting.findOne({ userId: req.user.id });
    
    if (!settings) {
      settings = new NotificationSetting({ userId: req.user.id });
    }

    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) settings.smsNotifications = smsNotifications;
    if (appointmentReminders !== undefined) settings.appointmentReminders = appointmentReminders;
    if (paymentAlerts !== undefined) settings.paymentAlerts = paymentAlerts;
    if (prescriptionAlerts !== undefined) settings.prescriptionAlerts = prescriptionAlerts;
    if (labReportReady !== undefined) settings.labReportReady = labReportReady;
    if (reminderTime !== undefined) settings.reminderTime = reminderTime;

    await settings.save();

    res.json({
      success: true,
      data: settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all roles (Admin only)
// @route   GET /api/settings/roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update role permissions (Admin only)
// @route   PUT /api/settings/roles/:roleId
export const updateRolePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    
    const role = await Role.findByIdAndUpdate(
      req.params.roleId,
      { permissions },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    res.json({
      success: true,
      data: role,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system settings (Admin only)
// @route   GET /api/settings/system
export const getSystemSettings = async (req, res) => {
  try {
    const systemSettings = {
      appName: 'ClinicCare',
      version: '1.0.0',
      maintenanceMode: false,
      allowRegistration: true,
      defaultUserRole: 'receptionist'
    };
    
    res.json({ success: true, data: systemSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
