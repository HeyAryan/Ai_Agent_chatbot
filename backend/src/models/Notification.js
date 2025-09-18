const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	title: { type: String, required: true },
	message: { type: String },
	read: { type: Boolean, default: false },
	type: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);


