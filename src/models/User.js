const mongoose = require('mongoose');
const config = require('../config');

const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	termsAccepted: { type: Boolean, default: false },
	name: { type: String },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	profileImage: { type: String },
	membershipPlan: { type: String },
	planExpiryDate: { type: Date },
	bio: { type: String },
	// Message tracking per agent
	messageCredits: {
		type: Map,
		of: {
			freeMessages: { type: Number, default: config.messages.freeMessagesPerAgent },
			purchasedMessages: { type: Number, default: 0 },
			usedMessages: { type: Number, default: 0 }
		},
		default: new Map()
	},
	// Total purchased message packs
	purchasedMessagePacks: [{
		packId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessagePack' },
		quantity: { type: Number, default: 1 },
		purchaseDate: { type: Date, default: Date.now },
		expiryDate: { type: Date },
		used: { type: Number, default: 0 }
	}],
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


