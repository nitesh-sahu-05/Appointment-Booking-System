require('dotenv').config();
// console.log(process.env.MONGO_URI);
const express  = require('express');
const app = express();
const connectDB = require('./src/config/db');

app.use(express.json());
connectDB();

// Require routes
const userAuth = require('./src/routes/user.route');
const doctorRoutes = require('./src/routes/doctor.route');
const appointmentRoutes = require('./src/routes/apointment.route');
const { errorHandler, notFoundHandler } = require('./src/middlewares/error.middleware');

// Use routers
app.use('/auth/users', userAuth);
app.use('/auth/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Handle 404 - must be after all other routes
app.use(notFoundHandler);

// Central error handling middleware - must be last
app.use(errorHandler);

app.listen(process.env.PORT || 5000, () => {
  console.log('Server is running on port ' + (process.env.PORT || 5000));
});

module.exports = app;

