const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
	conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
	sender: { type: String, enum: ['user', 'agent', 'system'], required: true },
	senderId: { type: mongoose.Schema.Types.ObjectId },
	content: { type: String, required: true },
	attachments: [{
		url: String,
		mimeType: String
	}],
	tokensUsed: { type: Number },
	status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);


