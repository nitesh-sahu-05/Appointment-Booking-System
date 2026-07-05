require('dotenv').config();
// console.log(process.env.MONGO_URI);
const express  = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./src/config/db');

app.use(express.json());

// Configure CORS whitelist from env (comma-separated), default allow localhost dev origin
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy does not allow access from the specified Origin.'), false);
  },
  optionsSuccessStatus: 200,
}));
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

