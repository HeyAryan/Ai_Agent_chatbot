const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	termsAccepted: { type: Boolean, default: false },
	name: { type: String },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	profileImage: { type: String },
	membershipPlan: { type: String },
	bio: { type: String },
	settings: {
		theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
		language: { type: String, default: 'en' },
		fontSize: { type: String, enum: ['sm', 'md', 'lg'], default: 'md' }
	},
	notificationSettings: {
		email: { type: Boolean, default: true },
		push: { type: Boolean, default: true }
	}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


