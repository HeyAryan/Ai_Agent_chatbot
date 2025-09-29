const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
	conversationId: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'Conversation', 
		required: true 
	},

	// Who sent the message
	sender: { 
		type: String, 
		enum: ['user', 'agent', 'system'], 
		required: true 
	},

	// If user → userId, if agent → agentId, if system → null
	senderId: { 
		type: mongoose.Schema.Types.ObjectId, 
		refPath: 'senderRef' 
	},

	// Dynamic reference (can point to User or Agent collection)
	senderRef: { 
		type: String, 
		enum: ['User', 'Agent', null] 
	},

	// Message text (or JSON if structured messages in future)
	content: { 
		type: String, 
		required: true,
		trim: true 
	},

	// Optional: file/image attachments
	attachments: [{
		url: { type: String },
		mimeType: { type: String }
	}],

	// OpenAI / LLM specific data
	tokensUsed: { type: Number, default: 0 },

	// Message delivery status
	status: { 
		type: String, 
		enum: ['sent', 'delivered', 'read'], 
		default: 'sent' 
	}
}, { 
	timestamps: true 
});

// Index for faster conversation history queries
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
