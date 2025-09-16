const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
	title: { type: String },
	lastMessage: { type: String },
	unreadCount: { type: Number, default: 0 },
	pinned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);


