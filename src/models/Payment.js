const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
	userId: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User', 
		required: false 
	},
	planId: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'Plan', 
		required: false 
	},
	messagePackId: { 
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'MessagePack', 
		required: false 
	},
	razorpayOrderId: { 
		type: String, 
		required: true
	},
	razorpayPaymentId: { 
		type: String, 
		sparse: true,
		index: { unique: true, sparse: true }
	},
	razorpaySignature: { 
		type: String 
	},
	amount: { 
		type: Number, 
		required: true 
	},
	currency: { 
		type: String, 
		default: 'INR' 
	},
	status: { 
		type: String, 
		enum: ['pending', 'completed', 'failed', 'cancelled'], 
		default: 'pending' 
	},
	paymentMethod: { 
		type: String, 
		default: 'razorpay' 
	},
	receipt: { 
		type: String 
	},
	notes: { 
		type: String 
	},
	metadata: { 
		type: mongoose.Schema.Types.Mixed, 
		default: {} 
	}
}, { 
	timestamps: true 
});

// Index for better query performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
