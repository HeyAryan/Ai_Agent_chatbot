const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String },
	tags: [{ type: String }],
	category: { type: String },
	isPaid: { type: Boolean, default: false },
	status: { type: String, enum: ['active', 'inactive'], default: 'active' },
	liveOn: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);


