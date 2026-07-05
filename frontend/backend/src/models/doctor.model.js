const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const slotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    isBooked: { type: Boolean, default: false },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    specialization: { type: [String], default: [] },
    experience: { type: Number, min: 0, default: 0 },
    fees: { type: Number, min: 0, default: 0 },
    availableSlots: { type: [slotSchema], default: [] },
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

doctorSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.index({ email: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);

