import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register user
export const register = async (req, res) => {
  try { const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email and password' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: role || 'receptionist',
    }); res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) { res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Login user - FIXED VERSION
export const login = async (req, res) => {
  try { const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Direct bcrypt compare instead of using schema method
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save(); res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) { res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};