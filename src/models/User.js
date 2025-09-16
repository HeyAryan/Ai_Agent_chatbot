const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	termsAccepted: { type: Boolean, default: false },
	name: { type: String },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	profileImage: { type: String },
	membershipPlan: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


