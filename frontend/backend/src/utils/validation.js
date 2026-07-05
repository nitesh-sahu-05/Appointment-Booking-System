/**
 * Validation utilities for appointment booking system
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date format and ensure it's in the future
 * @param {string|Date} date
 * @param {number} minDaysAhead - Minimum days in future (default: 0)
 * @returns {object} { isValid: boolean, error?: string }
 */
const isValidAppointmentDate = (date, minDaysAhead = 0) => {
  try {
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(appointmentDate.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    // Check if date is in the future
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + minDaysAhead);

    if (appointmentDate < minDate) {
      return {
        isValid: false,
        error: `Appointment date must be at least ${minDaysAhead} days in the future`
      };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid date' };
  }
};

/**
 * Validate time slot format (HH:mm)
 * @param {string} slotTime
 * @returns {object} { isValid: boolean, error?: string }
 */
const isValidTimeSlot = (slotTime) => {
  if (typeof slotTime !== 'string') {
    return { isValid: false, error: 'Slot time must be a string' };
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(slotTime.trim())) {
    return { isValid: false, error: 'Time slot must be in HH:mm format (e.g., "09:30")' };
  }

  return { isValid: true };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate appointment status
 * @param {string} status
 * @returns {boolean}
 */
const isValidAppointmentStatus = (status) => {
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  return validStatuses.includes(status);
};

/**
 * Validate appointment creation request
 * @param {object} data
 * @returns {object} { isValid: boolean, errors?: array }
 */
const validateAppointmentCreation = (data) => {
  const errors = [];

  // Validate patientId
  if (!data.patientId) {
    errors.push('patientId is required');
  } else if (!isValidObjectId(data.patientId)) {
    errors.push('patientId must be a valid MongoDB ID');
  }

  // Validate doctorId
  if (!data.doctorId) {
    errors.push('doctorId is required');
  } else if (!isValidObjectId(data.doctorId)) {
    errors.push('doctorId must be a valid MongoDB ID');
  }

  // Validate appointmentDate
  if (!data.appointmentDate) {
    errors.push('appointmentDate is required');
  } else {
    const dateValidation = isValidAppointmentDate(data.appointmentDate, 1); // At least 1 day ahead
    if (!dateValidation.isValid) {
      errors.push(dateValidation.error);
    }
  }

  // Validate slotTime
  if (!data.slotTime) {
    errors.push('slotTime is required');
  } else {
    const timeValidation = isValidTimeSlot(data.slotTime);
    if (!timeValidation.isValid) {
      errors.push(timeValidation.error);
    }
  }

  // Validate notes (optional)
  if (data.notes && typeof data.notes !== 'string') {
    errors.push('notes must be a string');
  }

  // Validate notes length if provided
  if (data.notes && data.notes.length > 500) {
    errors.push('notes must not exceed 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Validate appointment update request
 * @param {object} data
 * @returns {object} { isValid: boolean, errors?: array }
 */
const validateAppointmentUpdate = (data) => {
  const errors = [];
  const allowedFields = ['status', 'notes'];

  // Check for unexpected fields
  Object.keys(data).forEach(key => {
    if (!allowedFields.includes(key) && key !== '__v') {
      errors.push(`${key} cannot be updated`);
    }
  });

  // Validate status if provided
  if (data.status && !isValidAppointmentStatus(data.status)) {
    errors.push('Invalid status. Must be one of: pending, confirmed, completed, cancelled');
  }

  // Validate notes if provided
  if (data.notes && typeof data.notes !== 'string') {
    errors.push('notes must be a string');
  }

  if (data.notes && data.notes.length > 500) {
    errors.push('notes must not exceed 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Sanitize and validate appointment data
 * @param {object} data
 * @returns {object} Cleaned data
 */
const sanitizeAppointmentData = (data) => {
  const sanitized = {};

  if (data.patientId) sanitized.patientId = data.patientId.trim();
  if (data.doctorId) sanitized.doctorId = data.doctorId.trim();
  if (data.appointmentDate) sanitized.appointmentDate = new Date(data.appointmentDate);
  if (data.slotTime) sanitized.slotTime = data.slotTime.trim();
  if (data.notes) sanitized.notes = data.notes.trim();
  if (data.status) sanitized.status = data.status.toLowerCase().trim();

  return sanitized;
};

module.exports = {
  isValidEmail,
  isValidAppointmentDate,
  isValidTimeSlot,
  isValidObjectId,
  isValidAppointmentStatus,
  validateAppointmentCreation,
  validateAppointmentUpdate,
  sanitizeAppointmentData,
};
