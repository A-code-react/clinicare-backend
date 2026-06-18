import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    // Remove deprecated options for Mongoose v8+
    const conn = await mongoose.connect(mongoURI); return conn;
  } catch (error) { process.exit(1);
  }
};

export default connectDB;