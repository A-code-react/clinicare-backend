import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Invoice from '../models/Invoice.js';
import Prescription from '../models/Prescription.js';
import Room from '../models/Room.js';

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get counts
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const availableDoctors = await Doctor.countDocuments({ availability: 'available' });
    
    // Appointments stats
    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
    
    // Revenue stats from invoices
    const paidInvoices = await Invoice.find({ status: 'paid' });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    
    const pendingRevenue = await Invoice.aggregate([
      {
        $match: { status: { $in: ['pending', 'overdue'] } }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    
    // Room stats
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const availableRooms = await Room.countDocuments({ status: 'available' });
    
    const dailyRevenueFromRooms = await Room.aggregate([
      {
        $match: { status: 'occupied' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricePerDay' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        patients: {
          total: totalPatients,
          newThisMonth: await Patient.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          })
        },
        doctors: {
          total: totalDoctors,
          available: availableDoctors,
          busy: totalDoctors - availableDoctors - await Doctor.countDocuments({ availability: 'on-leave' })
        },
        appointments: {
          today: todayAppointments,
          total: totalAppointments,
          completed: completedAppointments,
          pending: pendingAppointments,
          cancelled: cancelledAppointments,
          completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) : 0
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue[0]?.total || 0,
          pending: pendingRevenue[0]?.total || 0,
          averageBillValue: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0
        },
        rooms: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: availableRooms,
          occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0,
          dailyRevenue: dailyRevenueFromRooms[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/reports/revenue
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'week' } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const invoices = await Invoice.find({
      status: 'paid',
      paymentDate: { $gte: start, $lte: end }
    }).sort({ paymentDate: 1 });
    
    // Group revenue by period
    let revenueData = [];
    
    if (groupBy === 'week') {
      const weeks = {};
      invoices.forEach(inv => {
        const week = getWeekNumber(inv.paymentDate);
        const year = inv.paymentDate.getFullYear();
        const key = `${year}-W${week}`;
        if (!weeks[key]) weeks[key] = { period: `Week ${week}`, revenue: 0, patients: 0 };
        weeks[key].revenue += inv.total;
      });
      revenueData = Object.values(weeks);
    } else if (groupBy === 'month') {
      const months = {};
      invoices.forEach(inv => {
        const month = inv.paymentDate.toLocaleString('default', { month: 'short' });
        if (!months[month]) months[month] = { month, revenue: 0, patients: 0 };
        months[month].revenue += inv.total;
      });
      revenueData = Object.values(months);
    } else if (groupBy === 'day') {
      const days = {};
      invoices.forEach(inv => {
        const date = inv.paymentDate.toISOString().split('T')[0];
        if (!days[date]) days[date] = { date, revenue: 0, patients: 0 };
        days[date].revenue += inv.total;
      });
      revenueData = Object.values(days);
    }
    
    // Calculate growth
    const growth = revenueData.length > 1 
      ? ((revenueData[revenueData.length - 1].revenue - revenueData[0].revenue) / revenueData[0].revenue) * 100 
      : 0;
    
    res.json({
      success: true,
      data: {
        revenueData,
        summary: {
          totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
          totalInvoices: invoices.length,
          averageRevenue: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0,
          growth: growth.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error in getRevenueAnalytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get patient analytics
// @route   GET /api/reports/patients
export const getPatientAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // Patient registrations over time
    const patientsByMonth = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Gender distribution
    const genderDistribution = await Patient.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Blood group distribution
    const bloodGroupDistribution = await Patient.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Age distribution
    const ageGroups = {
      '0-18': 0,
      '19-30': 0,
      '31-45': 0,
      '46-60': 0,
      '60+': 0
    };
    
    const patients = await Patient.find();
    patients.forEach(patient => {
      if (patient.age <= 18) ageGroups['0-18']++;
      else if (patient.age <= 30) ageGroups['19-30']++;
      else if (patient.age <= 45) ageGroups['31-45']++;
      else if (patient.age <= 60) ageGroups['46-60']++;
      else ageGroups['60+']++;
    });
    
    res.json({
      success: true,
      data: {
        totalPatients: await Patient.countDocuments(),
        newPatientsThisPeriod: patientsByMonth.reduce((sum, item) => sum + item.count, 0),
        patientsByMonth: patientsByMonth.map(item => ({
          month: `${item._id.year}-${item._id.month}`,
          count: item.count
        })),
        demographics: {
          byGender: genderDistribution,
          byBloodGroup: bloodGroupDistribution.filter(b => b._id),
          byAge: Object.entries(ageGroups).map(([range, count]) => ({ range, count }))
        }
      }
    });
  } catch (error) {
    console.error('Error in getPatientAnalytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get appointment analytics
// @route   GET /api/reports/appointments
export const getAppointmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    // Appointments by status
    const byStatus = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Appointments by doctor
    const byDoctor = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$doctorId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $project: {
          doctorName: { $arrayElemAt: ['$doctor.name', 0] },
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Appointments by type
    const byType = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Monthly trends
    const monthlyTrends = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    const totalAppointments = await Appointment.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    const completedAppointments = await Appointment.countDocuments({
      status: 'completed',
      createdAt: { $gte: start, $lte: end }
    });
    
    res.json({
      success: true,
      data: {
        summary: {
          total: totalAppointments,
          completed: completedAppointments,
          completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) : 0,
          byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
          byType: byType.map(t => ({ type: t._id, count: t.count }))
        },
        topDoctors: byDoctor.map(d => ({ name: d.doctorName, appointments: d.count })),
        monthlyTrends: monthlyTrends.map(m => ({
          month: `${m._id.year}-${m._id.month}`,
          total: m.total,
          completed: m.completed,
          cancelled: m.cancelled
        }))
      }
    });
  } catch (error) {
    console.error('Error in getAppointmentAnalytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get doctor performance report
// @route   GET /api/reports/doctors
export const getDoctorPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const doctors = await Doctor.find({ isActive: true });
    
    const performance = await Promise.all(doctors.map(async (doctor) => {
      const appointments = await Appointment.countDocuments({
        doctorId: doctor._id,
        createdAt: { $gte: start, $lte: end }
      });
      
      const completedAppointments = await Appointment.countDocuments({
        doctorId: doctor._id,
        status: 'completed',
        createdAt: { $gte: start, $lte: end }
      });
      
      const prescriptions = await Prescription.countDocuments({
        doctorId: doctor._id,
        createdAt: { $gte: start, $lte: end }
      });
      
      const revenue = await Invoice.aggregate([
        {
          $match: {
            status: 'paid',
            paymentDate: { $gte: start, $lte: end }
          }
        },
        {
          $lookup: {
            from: 'appointments',
            localField: 'appointmentId',
            foreignField: '_id',
            as: 'appointment'
          }
        },
        {
          $match: {
            'appointment.doctorId': doctor._id
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);
      
      return {
        id: doctor._id,
        name: doctor.name,
        specialty: doctor.specialty,
        patientsCount: doctor.patientsCount || 0,
        appointments,
        completedAppointments,
        completionRate: appointments > 0 ? ((completedAppointments / appointments) * 100).toFixed(2) : 0,
        prescriptions,
        revenue: revenue[0]?.total || 0
      };
    }));
    
    // Sort by appointments count
    performance.sort((a, b) => b.appointments - a.appointments);
    
    res.json({
      success: true,
      data: {
        performance,
        summary: {
          totalDoctors: doctors.length,
          totalAppointments: performance.reduce((sum, d) => sum + d.appointments, 0),
          totalRevenue: performance.reduce((sum, d) => sum + d.revenue, 0),
          avgCompletionRate: (performance.reduce((sum, d) => sum + parseFloat(d.completionRate), 0) / doctors.length).toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error in getDoctorPerformance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top services report
// @route   GET /api/reports/services
export const getTopServices = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const invoices = await Invoice.find({
      status: 'paid',
      paymentDate: { $gte: start, $lte: end }
    });
    
    // Aggregate services from invoice items
    const servicesMap = new Map();
    
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const serviceName = item.description;
        if (servicesMap.has(serviceName)) {
          const existing = servicesMap.get(serviceName);
          existing.count += item.quantity;
          existing.revenue += item.total;
        } else {
          servicesMap.set(serviceName, {
            service: serviceName,
            count: item.quantity,
            revenue: item.total
          });
        }
      });
    });
    
    const topServices = Array.from(servicesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    res.json({
      success: true,
      data: topServices
    });
  } catch (error) {
    console.error('Error in getTopServices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export report as CSV/Excel
// @route   GET /api/reports/export
export const exportReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    let exportData = [];
    
    switch (type) {
      case 'patients':
        const patients = await Patient.find({
          createdAt: { $gte: start, $lte: end }
        });
        exportData = patients.map(p => ({
          Name: p.name,
          Email: p.email,
          Phone: p.phone,
          Age: p.age,
          Gender: p.gender,
          BloodGroup: p.bloodGroup,
          Status: p.status,
          RegisteredOn: p.createdAt.toISOString().split('T')[0]
        }));
        break;
        
      case 'appointments':
        const appointments = await Appointment.find({
          createdAt: { $gte: start, $lte: end }
        }).populate('patientId', 'name').populate('doctorId', 'name');
        exportData = appointments.map(a => ({
          Patient: a.patientId?.name,
          Doctor: a.doctorId?.name,
          Date: a.date.toISOString().split('T')[0],
          Time: a.time,
          Status: a.status,
          Type: a.type
        }));
        break;
        
      case 'revenue':
        const invoices = await Invoice.find({
          status: 'paid',
          paymentDate: { $gte: start, $lte: end }
        }).populate('patientId', 'name');
        exportData = invoices.map(i => ({
          InvoiceNo: i.invoiceNumber,
          Patient: i.patientId?.name,
          Date: i.paymentDate?.toISOString().split('T')[0],
          Amount: i.total,
          PaymentMethod: i.paymentMethod
        }));
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid export type' });
    }
    
    res.json({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    console.error('Error in exportReport:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}