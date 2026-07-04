const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  loginDoctor,
} = require('../controllers/doctor.controller');

const router = express.Router();

router.post('/register', createDoctor);
router.post('/login', loginDoctor);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', authMiddleware, authorizeRoles('doctor', 'admin'), updateDoctor);
router.delete('/:id', authMiddleware, authorizeRoles('doctor', 'admin'), deleteDoctor);

module.exports = router;
