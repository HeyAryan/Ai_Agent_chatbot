const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
	plan: { type: String, required: true },
	amount: { type: Number, required: true },
	currency: { type: String, default: 'USD' },
	billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
	features: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);


