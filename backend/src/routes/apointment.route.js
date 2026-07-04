const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
} = require('../controllers/apointment.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Appointment CRUD operations
router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/available-slots/:doctorId', getAvailableSlots);
router.get('/:id', getAppointmentById);
router.patch('/:id', updateAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
