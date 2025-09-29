const mongoose = require('mongoose');

const messagePackSchema = new mongoose.Schema({
	name: { 
		type: String, 
		required: true,
		unique: true 
	},
	description: { 
		type: String 
	},
	messageCount: { 
		type: Number, 
		required: true,
		min: 1
	},
	price: { 
		type: Number, 
		required: true,
		min: 0
	},
	currency: { 
		type: String, 
		default: 'INR' 
	},
	// Validity period in days (null means no expiry)
	validityDays: { 
		type: Number,
		default: null
	},
	// Whether this pack is currently available for purchase
	isActive: { 
		type: Boolean, 
		default: true 
	},
	// Display order for UI
	displayOrder: { 
		type: Number, 
		default: 0 
	},
	// Special offers or discounts
	discount: {
		percentage: { type: Number, default: 0 },
		originalPrice: { type: Number }
	},
	// Features included in this pack
	features: [{ 
		type: String 
	}],
	// Tags for categorization
	tags: [{ 
		type: String 
	}]
}, { 
	timestamps: true 
});

// Index for better query performance
messagePackSchema.index({ isActive: 1, displayOrder: 1 });
messagePackSchema.index({ price: 1 });

// Virtual for discounted price
messagePackSchema.virtual('discountedPrice').get(function() {
	if (this.discount && this.discount.percentage > 0) {
		return this.price * (1 - this.discount.percentage / 100);
	}
	return this.price;
});

// Method to check if pack is valid
messagePackSchema.methods.isValid = function() {
	return this.isActive && this.messageCount > 0 && this.price >= 0;
};

// Method to get price per message
messagePackSchema.methods.getPricePerMessage = function() {
	return this.discountedPrice / this.messageCount;
};

module.exports = mongoose.model('MessagePack', messagePackSchema);
