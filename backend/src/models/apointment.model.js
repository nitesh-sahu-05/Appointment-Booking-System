const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
	{
		patientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		doctorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Doctor',
			required: true,
		},
		appointmentDate: {
			type: Date,
			required: true,
		},
		slotTime: {
			// store as string like "09:30" or "09:30-10:00"
			type: String,
			required: true,
			trim: true,
		},
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'completed', 'cancelled'],
			default: 'pending',
		},
		notes: {
			type: String,
			trim: true,
		},
	},
	{ 
		timestamps: true,
		// Mongoose automatically includes __v for optimistic concurrency control
		versionKey: '__v'
	}
);

// Unique compound index to prevent double booking
// Prevents multiple active (non-cancelled) appointments for same doctor, date, and time slot
appointmentSchema.index(
	{ doctorId: 1, appointmentDate: 1, slotTime: 1, status: 1 },
	{ 
		unique: true,
		sparse: true,
		// Exclude cancelled appointments from uniqueness constraint
		partialFilterExpression: {
			status: { $in: ['pending', 'confirmed'] }
		}
	}
);

// Index for quick lookups by patient
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });

// Index for quick lookups by doctor
appointmentSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
