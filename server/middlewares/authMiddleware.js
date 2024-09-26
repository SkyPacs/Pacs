import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.cookies.authToken) {
    token = req.cookies.authToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(403).json({ message: 'Not authorized as admin' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

