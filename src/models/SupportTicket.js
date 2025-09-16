const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	subject: { type: String, required: true },
	description: { type: String },
	status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);


