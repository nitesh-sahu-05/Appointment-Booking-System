/**
 * Generate available appointment slots for a given date
 * Supports concurrency control to prevent double booking
 * 
 * @param {Date} date - The date to generate slots for
 * @param {number} slotDuration - Duration of each slot in minutes (default: 30)
 * @param {string} startTime - Opening time in HH:mm format (default: "09:00")
 * @param {string} endTime - Closing time in HH:mm format (default: "17:00")
 * @param {Array} bookedSlots - Array of already booked slots to exclude (optional)
 * @returns {Array} Array of available time slots
 */
const generateSlots = (
  date,
  slotDuration = 30,
  startTime = "09:00",
  endTime = "17:00",
  bookedSlots = []
) => {
  const slots = [];

  // Convert time string (HH:mm) to Date object for the given date
  const createDateTime = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  // Get start and end times as Date objects
  const startDateTime = createDateTime(startTime);
  const endDateTime = createDateTime(endTime);

  // Generate slots from start time to end time
  let currentTime = new Date(startDateTime);

  while (currentTime < endDateTime) {
    // Format the slot time as HH:mm
    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    const slotTime = `${hours}:${minutes}`;

    // Check if this slot is already booked
    const isBooked = bookedSlots.includes(slotTime);

    // Add slot to list if not booked
    if (!isBooked) {
      slots.push({
        time: slotTime,
        available: true,
        startTime: new Date(currentTime),
        endTime: new Date(new Date(currentTime).setMinutes(currentTime.getMinutes() + slotDuration))
      });
    }

    // Move to next slot
    currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
  }

  return slots;
};

/**
 * Generate slots for multiple days
 * 
 * @param {Array} dates - Array of dates to generate slots for
 * @param {number} slotDuration - Duration of each slot in minutes
 * @param {string} startTime - Opening time in HH:mm format
 * @param {string} endTime - Closing time in HH:mm format
 * @param {Object} bookedSlotsMap - Object mapping date (YYYY-MM-DD) to booked slots array
 * @returns {Object} Object with dates as keys (YYYY-MM-DD) and slots array as values
 */
const generateSlotsForWeek = (
  dates,
  slotDuration = 30,
  startTime = "09:00",
  endTime = "17:00",
  bookedSlotsMap = {}
) => {
  const weekSlots = {};

  dates.forEach((date) => {
    const dateKey = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const bookedSlots = bookedSlotsMap[dateKey] || [];
    
    weekSlots[dateKey] = generateSlots(
      date,
      slotDuration,
      startTime,
      endTime,
      bookedSlots
    );
  });

  return weekSlots;
};

/**
 * Get available slots for a doctor on a specific date
 * Fetches booked appointments from database and returns available slots
 * 
 * @param {Object} Appointment - Mongoose Appointment model
 * @param {string} doctorId - Doctor's ID
 * @param {Date} date - The date to check
 * @param {number} slotDuration - Duration of each slot in minutes
 * @param {string} startTime - Opening time in HH:mm format
 * @param {string} endTime - Closing time in HH:mm format
 * @returns {Promise<Array>} Array of available slots
 */
const getAvailableSlotsForDoctor = async (
  Appointment,
  doctorId,
  date,
  slotDuration = 30,
  startTime = "09:00",
  endTime = "17:00"
) => {
  try {
    // Query database for booked appointments
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      },
      status: { $in: ['pending', 'confirmed'] } // Only count active bookings
    }).select('slotTime');

    // Extract just the time strings
    const bookedSlots = bookedAppointments.map(apt => apt.slotTime);

    // Generate available slots
    return generateSlots(
      date,
      slotDuration,
      startTime,
      endTime,
      bookedSlots
    );
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

/**
 * Check if a specific time slot is available
 * Performs atomic check to prevent double booking
 * 
 * @param {Object} Appointment - Mongoose Appointment model
 * @param {string} doctorId - Doctor's ID
 * @param {Date} appointmentDate - The appointment date
 * @param {string} slotTime - The time slot in HH:mm format
 * @returns {Promise<boolean>} True if slot is available, false otherwise
 */
const isSlotAvailable = async (
  Appointment,
  doctorId,
  appointmentDate,
  slotTime
) => {
  try {
    // Check for any active appointment at this time
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      slotTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    return !existingAppointment;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    throw error;
  }
};

module.exports = {
  generateSlots,
  generateSlotsForWeek,
  getAvailableSlotsForDoctor,
  isSlotAvailable,
};
