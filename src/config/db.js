import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Check both possible environment variable names
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI or MONGO_URI is not defined in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    console.log(`🔄 Connecting to MongoDB at ${mongoURI.replace(/\/\/.*@/, '//<credentials>@')}`); // Hide credentials in logs
    
    // For Mongoose v8+, deprecated options are removed
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📍 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Full error details:', error);
    
    // Don't exit process here, let server.js handle it
    throw error;
  }
};

export default connectDB;