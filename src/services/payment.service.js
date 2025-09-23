const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config');
const { Payment, Plan, User } = require('../models');
const createError = require('http-errors');

// Initialize Razorpay instance
const razorpay = new Razorpay({
	key_id: config.razorpay.keyId,
	key_secret: config.razorpay.keySecret
});

/**
 * Create a new Razorpay order
 * @param {Object} orderData - Order details
 * @param {string} orderData.userId - User ID
 * @param {string} orderData.planId - Plan ID
 * @param {number} orderData.amount - Amount in paise
 * @param {string} orderData.currency - Currency code
 * @param {string} orderData.receipt - Receipt number
 * @param {Object} orderData.notes - Additional notes
 * @returns {Promise<Object>} Created order and payment record
 */
async function createOrder(orderData) {
	try {
		const { userId, planId, amount, currency = 'INR', receipt, notes = {} } = orderData;

		// Validate plan exists
		const plan = await Plan.findById(planId);
		if (!plan) {
			throw createError(404, 'Plan not found');
		}

		// Validate user exists (optional for anonymous payments)
		let user = null;
		if (userId) {
			user = await User.findById(userId);
			if (!user) {
				throw createError(404, 'User not found');
			}
		}

		// Create Razorpay order
		const razorpayOrder = await razorpay.orders.create({
			amount: amount, // Amount in paise
			currency: currency,
			receipt: receipt || `receipt_${Date.now()}`,
			notes: {
				userId: userId ? userId.toString() : 'anonymous',
				planId: planId.toString(),
				...notes
			}
		});

		// Generate checkout URL - redirect to Razorpay checkout page
		const checkoutUrl = `https://checkout.razorpay.com/v1/checkout.html?order_id=${razorpayOrder.id}&traffic_env=production`;

		// Create payment record in database
		const payment = new Payment({
			userId: userId || null, // Allow null for anonymous payments
			planId,
			razorpayOrderId: razorpayOrder.id,
			amount,
			currency,
			receipt: razorpayOrder.receipt,
			notes: JSON.stringify(notes),
			status: 'pending'
		});

		await payment.save();

		return {
			order: razorpayOrder,
			payment: payment,
			checkoutUrl: checkoutUrl
		};
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to create order: ${error.message}`);
	}
}

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @returns {Promise<Object>} Verified payment data
 */
async function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
	try {
		// Find payment record
		const payment = await Payment.findOne({ razorpayOrderId });
		if (!payment) {
			throw createError(404, 'Payment record not found');
		}

		// Verify signature
		const body = razorpayOrderId + '|' + razorpayPaymentId;
		const expectedSignature = crypto
			.createHmac('sha256', config.razorpay.keySecret)
			.update(body.toString())
			.digest('hex');

		if (expectedSignature !== razorpaySignature) {
			throw createError(400, 'Invalid payment signature');
		}

		// Update payment record
		payment.razorpayPaymentId = razorpayPaymentId;
		payment.razorpaySignature = razorpaySignature;
		payment.status = 'completed';
		await payment.save();

		// Update user's membership plan (only if user exists)
		const plan = await Plan.findById(payment.planId);
		let updatedUser = null;
		
		if (plan && payment.userId) {
			// Calculate plan expiry date based on billing cycle
			const now = new Date();
			let planExpiryDate;
			
			if (plan.billingCycle === 'yearly') {
				planExpiryDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
			} else { // monthly
				planExpiryDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
			}

			updatedUser = await User.findByIdAndUpdate(
				payment.userId, 
				{
					membershipPlan: plan.plan,
					planExpiryDate: planExpiryDate
				},
				{ new: true }
			).lean();
		}

		return { payment, updatedUser };
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Payment verification failed: ${error.message}`);
	}
}

/**
 * Get payment details by order ID
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<Object>} Payment details
 */
async function getPaymentByOrderId(orderId) {
	try {
		const payment = await Payment.findOne({ razorpayOrderId: orderId })
			.populate('userId', 'name email')
			.populate('planId', 'plan amount currency billingCycle features');

		if (!payment) {
			throw createError(404, 'Payment not found');
		}

		return payment;
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to get payment: ${error.message}`);
	}
}

/**
 * Get user's payment history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Payment history
 */
async function getUserPaymentHistory(userId, options = {}) {
	try {
		const { page = 1, limit = 10, status } = options;
		const query = { userId };

		if (status) {
			query.status = status;
		}

		const payments = await Payment.find(query)
			.populate('planId', 'plan amount currency billingCycle features')
			.sort({ createdAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await Payment.countDocuments(query);

		return {
			payments,
			pagination: {
				current: page,
				pages: Math.ceil(total / limit),
				total
			}
		};
	} catch (error) {
		throw createError(500, `Failed to get payment history: ${error.message}`);
	}
}

/**
 * Cancel a pending payment
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<Object>} Updated payment record
 */
async function cancelPayment(orderId) {
	try {
		const payment = await Payment.findOne({ razorpayOrderId: orderId });
		if (!payment) {
			throw createError(404, 'Payment not found');
		}

		if (payment.status !== 'pending') {
			throw createError(400, 'Only pending payments can be cancelled');
		}

		payment.status = 'cancelled';
		await payment.save();

		return payment;
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to cancel payment: ${error.message}`);
	}
}

module.exports = {
	createOrder,
	verifyPayment,
	getPaymentByOrderId,
	getUserPaymentHistory,
	cancelPayment
};
