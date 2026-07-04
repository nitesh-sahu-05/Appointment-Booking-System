const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const secret = process.env.JWT_SECRET || 'change_this_secret';
    const decoded = jwt.verify(token, secret);

    const isDoctor = decoded.role === 'doctor';
    const user = isDoctor
      ? await Doctor.findById(decoded.id).select('-password')
      : await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    req.user = {
      id: user._id,
      role: decoded.role || user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error('Authorization error:', error.message);
    return res.status(401).json({ message: 'Unauthorized. Token is invalid or expired.' });
  }
};

module.exports = authMiddleware;
