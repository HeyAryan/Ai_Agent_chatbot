const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String },
	tags: [{ type: String }],
	category: { type: String },
	isPaid: { type: Boolean, default: false },
	status: { type: String, enum: ['active', 'inactive'], default: 'active' },
	liveOn: { type: Date },
	icon: { type: String },
	color: { type: String },
	featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);


