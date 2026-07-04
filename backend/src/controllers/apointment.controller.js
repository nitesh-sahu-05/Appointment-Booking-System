const Appointment = require('../models/apointment.model');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const {
  validateAppointmentCreation,
  validateAppointmentUpdate,
  sanitizeAppointmentData,
} = require('../utils/validation');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * Create a new appointment with comprehensive validation
 * POST /api/appointments
 */
const createAppointment = asyncHandler(async (req, res) => {
  // Validate request body
  const validation = validateAppointmentCreation(req.body);
  if (!validation.isValid) {
    throw new ValidationError('Invalid appointment data', validation.errors);
  }

  // Sanitize input data
  const sanitized = sanitizeAppointmentData(req.body);
  const { patientId, doctorId, appointmentDate, slotTime, notes } = sanitized;

  // Validate doctor exists and is active
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }
  if (!doctor.isActive) {
    throw new ValidationError('Doctor is not available for appointments');
  }

  // Validate patient exists and is active
  const user = await User.findById(patientId);
  if (!user) {
    throw new NotFoundError('Patient not found');
  }
  if (!user.isActive) {
    throw new ValidationError('Patient account is not active');
  }

  // Check for existing appointment (double-booking prevention)
  const existingAppointment = await Appointment.findOne({
    doctorId,
    appointmentDate,
    slotTime,
    status: { $in: ['pending', 'confirmed'] }
  });

  if (existingAppointment) {
    throw new ConflictError(
      'This appointment slot is already booked. Please select another time.',
      'SLOT_ALREADY_BOOKED'
    );
  }

  // Create appointment
  const appointment = new Appointment({
    patientId,
    doctorId,
    appointmentDate,
    slotTime,
    notes: notes || '',
    status: 'pending',
  });

  await appointment.save();

  // Update doctor's appointments list
  doctor.appointments = doctor.appointments || [];
  doctor.appointments.push(appointment._id);
  await doctor.save();

  // Fetch and return populated appointment
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name email specialization fees');

  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    appointment: populatedAppointment,
  });
});

/**
 * Get appointments with optional filters
 * GET /api/appointments
 */
const getAppointments = asyncHandler(async (req, res) => {
  const filter = {};

  // Build filter from query parameters
  if (req.query.patientId) {
    if (!/^[0-9a-fA-F]{24}$/.test(req.query.patientId)) {
      throw new ValidationError('Invalid patientId format');
    }
    filter.patientId = req.query.patientId;
  }

  if (req.query.doctorId) {
    if (!/^[0-9a-fA-F]{24}$/.test(req.query.doctorId)) {
      throw new ValidationError('Invalid doctorId format');
    }
    filter.doctorId = req.query.doctorId;
  }

  if (req.query.status) {
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(req.query.status)) {
      throw new ValidationError('Invalid status. Must be one of: ' + validStatuses.join(', '));
    }
    filter.status = req.query.status;
  }

  const appointments = await Appointment.find(filter)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name email specialization fees')
    .sort({ appointmentDate: 1 })
    .select('-__v');

  res.json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

/**
 * Get a specific appointment by ID
 * GET /api/appointments/:id
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  // Validate ID format
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    throw new ValidationError('Invalid appointment ID format');
  }

  const appointment = await Appointment.findById(req.params.id)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name email specialization fees');

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  res.json({
    success: true,
    appointment,
  });
});

/**
 * Update appointment with validation and concurrency control
 * PATCH /api/appointments/:id
 */
const updateAppointment = asyncHandler(async (req, res) => {
  // Validate ID format
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    throw new ValidationError('Invalid appointment ID format');
  }

  // Validate update data
  const validation = validateAppointmentUpdate(req.body);
  if (!validation.isValid) {
    throw new ValidationError('Invalid update data', validation.errors);
  }

  const { __v, ...updates } = req.body;

  // Build query with optional version check for optimistic locking
  const query = { _id: req.params.id };
  if (__v !== undefined) {
    query.__v = __v;
  }

  const appointment = await Appointment.findOneAndUpdate(query, updates, {
    new: true,
    runValidators: true,
  })
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name email specialization fees');

  if (!appointment) {
    // Check if document exists but version didn't match
    const existingAppointment = await Appointment.findById(req.params.id);
    if (!existingAppointment) {
      throw new NotFoundError('Appointment not found');
    }
    throw new ConflictError(
      'Appointment was modified by another user. Please refresh and try again.',
      'VERSION_CONFLICT'
    );
  }

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    appointment,
  });
});

/**
 * Delete an appointment
 * DELETE /api/appointments/:id
 */
const deleteAppointment = asyncHandler(async (req, res) => {
  // Validate ID format
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    throw new ValidationError('Invalid appointment ID format');
  }

  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Remove appointment from doctor's list
  if (appointment.doctorId) {
    await Doctor.findByIdAndUpdate(
      appointment.doctorId,
      { $pull: { appointments: appointment._id } }
    );
  }

  res.json({
    success: true,
    message: 'Appointment deleted successfully',
    appointment,
  });
});

/**
 * Get available slots for a doctor on a specific date
 * GET /api/appointments/available-slots/:doctorId
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  // Validate doctorId
  if (!doctorId || !/^[0-9a-fA-F]{24}$/.test(doctorId)) {
    throw new ValidationError('Invalid doctor ID format');
  }

  // Validate date
  if (!date) {
    throw new ValidationError('Date is required');
  }

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  // Get booked appointments for this doctor on the given date
  const bookedAppointments = await Appointment.find({
    doctorId,
    appointmentDate: {
      $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
      $lt: new Date(appointmentDate.setHours(23, 59, 59, 999)),
    },
    status: { $in: ['pending', 'confirmed'] },
  }).select('slotTime');

  const bookedSlots = bookedAppointments.map(apt => apt.slotTime);

  res.json({
    success: true,
    doctorId,
    date: appointmentDate.toISOString().split('T')[0],
    bookedSlots,
    message: `Found ${bookedSlots.length} booked slots for this date`,
  });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
};
