import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../src/models/Appointment.js';
import Prescription from '../src/models/Prescription.js';

dotenv.config();

// Your actual patient IDs from database (based on your earlier response)
const patientIds = [
  "69e2158bd3289451f326ffe7",  // Arnav Chauhan
  "69e21582d3289451f326ffe6",  // Navya Rajput
  "69e2157bd3289451f326ffe5",  // Yuvraj Rana
  "69e21573d3289451f326ffe4",  // Alisha Dutta
  "69e2156bd3289451f326ffe3",  // Ishaan Khurana
  "69e21562d3289451f326ffe2",  // Anaya Chatterjee
  "69e2155bd3289451f326ffe1",  // Dhruv Seth
  "69e21551d3289451f326ffe0",  // Pari Agarwal
  "69e21549d3289451f326ffdf",  // Reyansh Saxena
  "69e21540d3289451f326ffde",  // Aadhya Goyal
  "69e21538d3289451f326ffdd",  // Add your remaining patient IDs
  "69e21530d3289451f326ffdc",  // Add your remaining patient IDs
   "69e2158bd3289451f326ffe7",  // Arnav Chauhan
  "69e21582d3289451f326ffe6",  // Navya Rajput
  "69e2157bd3289451f326ffe5",  // Yuvraj Rana
  "69e21573d3289451f326ffe4",  // Alisha Dutta
  "69e2156bd3289451f326ffe3",  // Ishaan Khurana
  "69e21562d3289451f326ffe2",  // Anaya Chatterjee
  "69e2155bd3289451f326ffe1",  // Dhruv Seth
  "69e21551d3289451f326ffe0",  // Pari Agarwal
  "69e21549d3289451f326ffdf",  // Reyansh Saxena
  "69e21540d3289451f326ffde",  // Aadhya Goyal// ... add all 40 patient IDs
];

// Your actual doctor IDs from database
const doctorIds = {
  cardiology: "69e20a25f3f02be755c80252",
  neurology: ["69e209bdf3f02be755c8024c", "69e20a4bf3f02be755c80254", "69e20ee1d3289451f326ffbd"],
  orthopedic: "69e20d42f3f02be755c8025c",
  pediatrics: "69e209cff3f02be755c8024d",
  dermatology: "69e20d53f3f02be755c8025e",
  gynecology: ["69e20ec7d3289451f326ffbb", "69e20b25f3f02be755c80258"],
  oncology: "69e20f47d3289451f326ffbe",
  anesthesiology: "69e20fb3d3289451f326ffbf",
  obstetrics: "69e20dfbd3289451f326ffb9"
};

// 40 Appointment Templates
const appointmentTemplates = [
  // Existing appointments (based on your successful ones)
  { patientIndex: 0, doctorType: 'cardiology', date: '2024-01-15', time: '10:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Chest pain, shortness of breath', notes: 'High BP history' },
  { patientIndex: 1, doctorType: 'neurology', date: '2024-01-15', time: '11:30 AM', type: 'consultation', status: 'confirmed', symptoms: 'Severe headache, dizziness', notes: 'Migraine symptoms' },
  { patientIndex: 2, doctorType: 'orthopedic', date: '2024-01-16', time: '09:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Knee pain, difficulty walking', notes: 'Old injury' },
  { patientIndex: 3, doctorType: 'pediatrics', date: '2024-01-16', time: '02:00 PM', type: 'follow-up', status: 'confirmed', symptoms: 'Fever, cough, cold', notes: 'Viral fever' },
  { patientIndex: 4, doctorType: 'dermatology', date: '2024-01-17', time: '10:30 AM', type: 'consultation', status: 'confirmed', symptoms: 'Skin rash, itching', notes: 'Allergic reaction' },
  { patientIndex: 5, doctorType: 'gynecology', date: '2024-01-17', time: '11:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Irregular periods, abdominal pain', notes: 'PCOS suspected' },
  { patientIndex: 6, doctorType: 'cardiology', date: '2024-01-18', time: '09:30 AM', type: 'emergency', status: 'confirmed', symptoms: 'Heart palpitations', notes: 'Rapid heartbeat' },
  { patientIndex: 7, doctorType: 'neurology', date: '2024-01-18', time: '03:00 PM', type: 'follow-up', status: 'confirmed', symptoms: 'Numbness in hands', notes: 'Carpal tunnel' },
  { patientIndex: 8, doctorType: 'orthopedic', date: '2024-01-19', time: '10:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Lower back pain', notes: 'Sitting job' },
  { patientIndex: 9, doctorType: 'pediatrics', date: '2024-01-19', time: '01:00 PM', type: 'checkup', status: 'confirmed', symptoms: 'Routine checkup', notes: 'Vaccination due' },
  
  // Additional 30 appointments
  { patientIndex: 10, doctorType: 'cardiology', date: '2024-01-20', time: '09:00 AM', type: 'consultation', status: 'pending', symptoms: 'Chest discomfort', notes: 'ECG recommended' },
  { patientIndex: 11, doctorType: 'neurology', date: '2024-01-20', time: '11:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Memory loss', notes: 'Dementia screening' },
  { patientIndex: 12, doctorType: 'orthopedic', date: '2024-01-21', time: '10:30 AM', type: 'consultation', status: 'pending', symptoms: 'Shoulder pain', notes: 'Frozen shoulder' },
  { patientIndex: 13, doctorType: 'pediatrics', date: '2024-01-21', time: '02:00 PM', type: 'emergency', status: 'confirmed', symptoms: 'High fever', notes: 'Febrile seizures' },
  { patientIndex: 14, doctorType: 'dermatology', date: '2024-01-22', time: '09:30 AM', type: 'consultation', status: 'confirmed', symptoms: 'Hair fall', notes: 'Stress-related' },
  { patientIndex: 15, doctorType: 'gynecology', date: '2024-01-22', time: '11:00 AM', type: 'follow-up', status: 'pending', symptoms: 'Post-natal checkup', notes: '6 weeks post delivery' },
  { patientIndex: 16, doctorType: 'cardiology', date: '2024-01-23', time: '10:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Chest discomfort', notes: 'Angina' },
  { patientIndex: 17, doctorType: 'neurology', date: '2024-01-23', time: '02:00 PM', type: 'consultation', status: 'pending', symptoms: 'Tremors', notes: 'Parkinson evaluation' },
  { patientIndex: 18, doctorType: 'orthopedic', date: '2024-01-24', time: '09:00 AM', type: 'follow-up', status: 'confirmed', symptoms: 'Post-surgery', notes: 'Knee replacement' },
  { patientIndex: 19, doctorType: 'pediatrics', date: '2024-01-24', time: '10:30 AM', type: 'consultation', status: 'confirmed', symptoms: 'Growth concerns', notes: 'Height below average' },
  { patientIndex: 20, doctorType: 'dermatology', date: '2024-01-25', time: '11:00 AM', type: 'consultation', status: 'pending', symptoms: 'Psoriasis', notes: 'Autoimmune condition' },
  { patientIndex: 21, doctorType: 'gynecology', date: '2024-01-25', time: '01:00 PM', type: 'emergency', status: 'confirmed', symptoms: 'Severe bleeding', notes: 'Miscarriage suspected' },
  { patientIndex: 22, doctorType: 'cardiology', date: '2024-01-26', time: '09:30 AM', type: 'follow-up', status: 'confirmed', symptoms: 'Post-angioplasty', notes: 'Regular checkup' },
  { patientIndex: 23, doctorType: 'neurology', date: '2024-01-26', time: '02:00 PM', type: 'consultation', status: 'pending', symptoms: 'Sleep disorders', notes: 'Insomnia' },
  { patientIndex: 24, doctorType: 'orthopedic', date: '2024-01-27', time: '10:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Hip pain', notes: 'Arthritis' },
  { patientIndex: 25, doctorType: 'pediatrics', date: '2024-01-27', time: '11:30 AM', type: 'checkup', status: 'confirmed', symptoms: 'Routine checkup', notes: 'School physical' },
  { patientIndex: 26, doctorType: 'dermatology', date: '2024-01-28', time: '09:00 AM', type: 'consultation', status: 'pending', symptoms: 'Vitiligo', notes: 'White patches' },
  { patientIndex: 27, doctorType: 'gynecology', date: '2024-01-28', time: '03:00 PM', type: 'follow-up', status: 'confirmed', symptoms: 'Fertility treatment', notes: 'IVF consultation' },
  { patientIndex: 28, doctorType: 'cardiology', date: '2024-01-29', time: '10:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'High cholesterol', notes: 'Lipid profile abnormal' },
  { patientIndex: 29, doctorType: 'neurology', date: '2024-01-29', time: '11:00 AM', type: 'consultation', status: 'pending', symptoms: 'Vertigo', notes: 'Balance issues' },
  { patientIndex: 30, doctorType: 'orthopedic', date: '2024-01-30', time: '09:30 AM', type: 'follow-up', status: 'confirmed', symptoms: 'Fracture healing', notes: 'X-ray review' },
  { patientIndex: 31, doctorType: 'pediatrics', date: '2024-01-30', time: '02:00 PM', type: 'consultation', status: 'confirmed', symptoms: 'Developmental delay', notes: 'Speech therapy' },
  { patientIndex: 32, doctorType: 'dermatology', date: '2024-01-31', time: '10:30 AM', type: 'consultation', status: 'pending', symptoms: 'Eczema', notes: 'Chronic condition' },
  { patientIndex: 33, doctorType: 'gynecology', date: '2024-01-31', time: '11:00 AM', type: 'emergency', status: 'confirmed', symptoms: 'Ectopic pregnancy', notes: 'Emergency surgery' },
  { patientIndex: 34, doctorType: 'cardiology', date: '2024-02-01', time: '09:00 AM', type: 'follow-up', status: 'confirmed', symptoms: 'Heart health', notes: 'Stress test' },
  { patientIndex: 35, doctorType: 'neurology', date: '2024-02-01', time: '01:00 PM', type: 'consultation', status: 'pending', symptoms: 'Muscle weakness', notes: 'ALS screening' },
  { patientIndex: 36, doctorType: 'orthopedic', date: '2024-02-02', time: '10:00 AM', type: 'consultation', status: 'confirmed', symptoms: 'Ankle sprain', notes: 'Sports injury' },
  { patientIndex: 37, doctorType: 'pediatrics', date: '2024-02-02', time: '02:30 PM', type: 'checkup', status: 'confirmed', symptoms: 'Newborn checkup', notes: 'First visit' },
  { patientIndex: 38, doctorType: 'dermatology', date: '2024-02-03', time: '11:00 AM', type: 'consultation', status: 'pending', symptoms: 'Skin allergy', notes: 'Contact dermatitis' },
  { patientIndex: 39, doctorType: 'gynecology', date: '2024-02-03', time: '03:00 PM', type: 'consultation', status: 'confirmed', symptoms: 'Menopause', notes: 'Hormonal changes' }
];

// Prescription Templates (matching the conditions)
const prescriptionTemplates = [
  { diagnosis: "Hypertension with chest pain", medicines: [{ name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "30 days", instructions: "Take in the morning", timing: ["morning"] }, { name: "Aspirin", dosage: "75mg", frequency: "Once daily", duration: "30 days", instructions: "Take with food", timing: ["night"] }], notes: "Low salt diet recommended", followUpDays: 30 },
  { diagnosis: "Chronic Migraine", medicines: [{ name: "Sumatriptan", dosage: "50mg", frequency: "As needed", duration: "10 days", instructions: "Take at first sign", timing: ["morning", "afternoon"] }, { name: "Propranolol", dosage: "40mg", frequency: "Twice daily", duration: "90 days", instructions: "Preventive", timing: ["morning", "night"] }], notes: "Avoid stress", followUpDays: 35 },
  { diagnosis: "Osteoarthritis", medicines: [{ name: "Acetaminophen", dosage: "500mg", frequency: "Three times daily", duration: "14 days", instructions: "For pain", timing: ["morning", "afternoon", "night"] }, { name: "Glucosamine", dosage: "1500mg", frequency: "Once daily", duration: "90 days", instructions: "Joint health", timing: ["morning"] }], notes: "Physiotherapy recommended", followUpDays: 30 },
  { diagnosis: "Viral Fever", medicines: [{ name: "Paracetamol", dosage: "250mg", frequency: "Every 6 hours", duration: "5 days", instructions: "For fever", timing: ["morning", "afternoon", "evening", "night"] }, { name: "Cough Syrup", dosage: "5ml", frequency: "Three times daily", duration: "5 days", instructions: "For dry cough", timing: ["morning", "afternoon", "night"] }], notes: "Plenty of fluids", followUpDays: 7 },
  { diagnosis: "Allergic Dermatitis", medicines: [{ name: "Cetirizine", dosage: "10mg", frequency: "Once daily", duration: "10 days", instructions: "For itching", timing: ["night"] }, { name: "Hydrocortisone Cream", dosage: "1%", frequency: "Twice daily", duration: "7 days", instructions: "Apply on affected area", timing: ["morning", "night"] }], notes: "Avoid allergen", followUpDays: 10 },
  { diagnosis: "Polycystic Ovary Syndrome", medicines: [{ name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days", instructions: "Take with meals", timing: ["morning", "night"] }, { name: "Myo-Inositol", dosage: "2000mg", frequency: "Once daily", duration: "90 days", instructions: "Hormonal balance", timing: ["morning"] }], notes: "Exercise recommended", followUpDays: 45 },
  { diagnosis: "Anxiety with Palpitations", medicines: [{ name: "Propranolol", dosage: "20mg", frequency: "Twice daily", duration: "30 days", instructions: "For palpitations", timing: ["morning", "night"] }, { name: "Escitalopram", dosage: "10mg", frequency: "Once daily", duration: "90 days", instructions: "For anxiety", timing: ["morning"] }], notes: "Counseling recommended", followUpDays: 30 },
  { diagnosis: "Carpal Tunnel Syndrome", medicines: [{ name: "Gabapentin", dosage: "300mg", frequency: "Once daily", duration: "30 days", instructions: "For nerve pain", timing: ["night"] }, { name: "Ibuprofen", dosage: "400mg", frequency: "As needed", duration: "10 days", instructions: "For pain", timing: ["morning", "afternoon", "night"] }], notes: "Wrist splint recommended", followUpDays: 30 },
  { diagnosis: "Lumbar Spondylosis", medicines: [{ name: "Diclofenac", dosage: "50mg", frequency: "Twice daily", duration: "10 days", instructions: "After meals", timing: ["morning", "night"] }, { name: "Thiocolchicoside", dosage: "4mg", frequency: "Three times daily", duration: "7 days", instructions: "Muscle relaxant", timing: ["morning", "afternoon", "night"] }], notes: "Physiotherapy sessions", followUpDays: 21 },
  { diagnosis: "Routine Checkup", medicines: [{ name: "Multivitamin", dosage: "Once daily", frequency: "Once daily", duration: "30 days", instructions: "General health", timing: ["morning"] }], notes: "Vaccination given", followUpDays: 90 }
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // Clear existing data (optional - comment out if you want to keep existing)
    // await Appointment.deleteMany({});
    // await Prescription.deleteMany({});
    // const createdAppointments = [];
    const createdPrescriptions = [];

    // Create all appointments
    for (let i = 0; i < appointmentTemplates.length; i++) {
      const apt = appointmentTemplates[i];
      const doctorId = Array.isArray(doctorIds[apt.doctorType]) 
        ? doctorIds[apt.doctorType][i % doctorIds[apt.doctorType].length]
        : doctorIds[apt.doctorType];
      
      // Skip if patient index is beyond available patients
      if (apt.patientIndex >= patientIds.length) { continue;
      }
      
      const appointment = await Appointment.create({
        patientId: patientIds[apt.patientIndex],
        doctorId: doctorId,
        date: new Date(apt.date),
        time: apt.time,
        type: apt.type,
        status: apt.status,
        symptoms: apt.symptoms,
        notes: apt.notes
      });
      
      createdAppointments.push(appointment); }

    // Create prescriptions linked to appointments
    for (let i = 0; i < createdAppointments.length; i++) {
      const apt = createdAppointments[i];
      const presTemplate = prescriptionTemplates[i % prescriptionTemplates.length];
      
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + presTemplate.followUpDays);
      
      const prescription = await Prescription.create({
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        appointmentId: apt._id,
        diagnosis: presTemplate.diagnosis,
        symptoms: apt.symptoms,
        medicines: presTemplate.medicines,
        notes: presTemplate.notes,
        followUpDate: followUpDate,
        isActive: true
      });
      
      createdPrescriptions.push(prescription); }   process.exit(0);
  } catch (error) {  process.exit(1);
  }
}

seedData();