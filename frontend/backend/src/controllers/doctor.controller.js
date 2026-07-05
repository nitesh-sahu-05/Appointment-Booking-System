const jwt = require('jsonwebtoken');
const Doctor = require('../models/doctor.model');

const generateToken = (doctor) => {
  const payload = { id: doctor._id, role: 'doctor' };
  const secret = process.env.JWT_SECRET || 'change_this_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

//register
const createDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, experience, fees, availableSlots } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({ message: 'Doctor with that email already exists' });
    }

    const doctor = new Doctor({
      name,
      email,
      password,
      specialization: Array.isArray(specialization) ? specialization : [specialization].filter(Boolean),
      experience,
      fees,
      availableSlots,
    });
    await doctor.save();

    const doctorObj = doctor.toObject();
    delete doctorObj.password;
    const token = generateToken(doctor);

    return res.status(201).json({ message: 'Doctor created successfully', doctor: doctorObj, token });
  } catch (err) {
    console.error('createDoctor error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor || !doctor.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await doctor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ message: 'Doctor account is inactive' });
    }

    const token = generateToken(doctor);
    const doctorObj = doctor.toObject();
    delete doctorObj.password;

    return res.json({ message: 'Doctor login successful', doctor: doctorObj, token });
  } catch (err) {
    console.error('loginDoctor error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// get doctors
const getDoctors = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.specialization) {
      filter.specialization = { $in: [req.query.specialization] };
    }
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }

    const doctors = await Doctor.find(filter).select('-__v');
    return res.json({ doctors });
  } catch (err) {
    console.error('getDoctors error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// get doctor by id
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-__v');
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    return res.json({ doctor });
  } catch (err) {
    console.error('getDoctorById error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


//update doctors
const updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const updates = { ...req.body };

    if (updates.email) {
      const existing = await Doctor.findOne({ email: updates.email, _id: { $ne: doctorId } });
      if (existing) {
        return res.status(409).json({ message: 'Email already in use by another doctor' });
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(doctorId, updates, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.json({ message: 'Doctor updated successfully', doctor });
  } catch (err) {
    console.error('updateDoctor error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


//delete doctors
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-__v');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.json({ message: 'Doctor removed successfully', doctor });
  } catch (err) {
    console.error('deleteDoctor error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createDoctor,
  loginDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
