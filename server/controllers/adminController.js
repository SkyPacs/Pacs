import Admin from '../models/adminModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', 
  });
};

export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Hashed Password:', hashedPassword);

    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    const savedAdmin = await admin.save();

    res.status(201).json({
      message: 'Admin registered successfully',
      token: generateToken(savedAdmin._id),
    });
  } catch (error) {
    console.error("Error during admin registration:", error);
    res.status(500).json({ message: error.message });
  }
};
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(admin._id);
    res.cookie('authToken', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', 
      maxAge: 30 * 24 * 60 * 60 * 1000 
    });

    res.json({
      message: 'Logged in successfully',
      token, 
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: error.message });
  }
};
export const logout = (req, res) => {
  try {
    res.clearCookie('authToken');
    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


