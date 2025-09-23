const createError = require('http-errors');
const paymentService = require('../services/payment.service');
const { Plan } = require('../models');

/**
 * Create a new payment order
 * POST /payments/create-order
 */
async function createOrder(req, res, next) {
	try {
		const { planName, amount, currency = 'INR' } = req.body;
		const userId = req.user?.id || req.body.userId || null; // Optional user ID

		if (!planName || !amount) {
			throw createError(400, 'Plan name and amount are required');
		}

		// Find plan by name
		const plan = await Plan.findOne({ plan: planName });
		if (!plan) {
			throw createError(404, `Plan '${planName}' not found. Available plans: Pro, Premium`);
		}

		// Validate amount (convert to paise for Razorpay)
		const amountInPaise = Math.round(amount * 100);
		if (amountInPaise < 100) { // Minimum ₹1
			throw createError(400, 'Minimum amount is ₹1');
		}

		const result = await paymentService.createOrder({
			userId,
			planId: plan._id,
			amount: amountInPaise,
			currency
		});

		return res.status(201).json({
			success: true,
			message: 'Order created successfully',
			data: {
				orderId: result.order.id,
				amount: result.order.amount,
				currency: result.order.currency,
				receipt: result.order.receipt,
				paymentId: result.payment._id,
				checkoutUrl: result.checkoutUrl
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Verify payment after successful payment
 * POST /payments/verify
 */
async function verifyPayment(req, res, next) {
	try {
		const { orderId, paymentId, signature } = req.body;

		if (!orderId || !paymentId || !signature) {
			throw createError(400, 'Order ID, Payment ID, and Signature are required');
		}

		const payment = await paymentService.verifyPayment(orderId, paymentId, signature);

		return res.status(200).json({
			success: true,
			message: 'Payment verified successfully',
			data: {
				paymentId: payment._id,
				status: payment.status,
				amount: payment.amount,
				currency: payment.currency,
				planId: payment.planId
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Get payment details by order ID
 * GET /payments/:orderId
 */
async function getPaymentDetails(req, res, next) {
	try {
		const { orderId } = req.params;

		const payment = await paymentService.getPaymentByOrderId(orderId);

		return res.status(200).json({
			success: true,
			data: payment
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Get user's payment history
 * GET /payments/history
 */
async function getPaymentHistory(req, res, next) {
	try {
		const userId = req.user?.id || req.query.userId || null; // Optional user ID
		const { page = 1, limit = 10, status } = req.query;

		const result = await paymentService.getUserPaymentHistory(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
			status
		});

		return res.status(200).json({
			success: true,
			data: result.payments,
			pagination: result.pagination
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Cancel a pending payment
 * PUT /payments/:orderId/cancel
 */
async function cancelPayment(req, res, next) {
	try {
		const { orderId } = req.params;

		const payment = await paymentService.cancelPayment(orderId);

		return res.status(200).json({
			success: true,
			message: 'Payment cancelled successfully',
			data: {
				paymentId: payment._id,
				status: payment.status
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Get available plans
 * GET /payments/plans
 */
async function getPlans(req, res, next) {
	try {
		const plans = await Plan.find({}).sort({ amount: 1 });

		return res.status(200).json({
			success: true,
			data: plans
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Create a new plan (Admin only)
 * POST /payments/plans
 */
async function createPlan(req, res, next) {
	try {
		const { plan, amount, currency = 'INR', billingCycle = 'monthly', features = [] } = req.body;

		if (!plan || !amount) {
			throw createError(400, 'Plan name and amount are required');
		}

		const newPlan = new Plan({
			plan,
			amount,
			currency,
			billingCycle,
			features
		});

		await newPlan.save();

		return res.status(201).json({
			success: true,
			message: 'Plan created successfully',
			data: newPlan
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Update a plan (Admin only)
 * PUT /payments/plans/:planId
 */
async function updatePlan(req, res, next) {
	try {
		const { planId } = req.params;
		const updateData = req.body;

		const plan = await Plan.findByIdAndUpdate(
			planId,
			updateData,
			{ new: true, runValidators: true }
		);

		if (!plan) {
			throw createError(404, 'Plan not found');
		}

		return res.status(200).json({
			success: true,
			message: 'Plan updated successfully',
			data: plan
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Delete a plan (Admin only)
 * DELETE /payments/plans/:planId
 */
async function deletePlan(req, res, next) {
	try {
		const { planId } = req.params;

		const plan = await Plan.findByIdAndDelete(planId);

		if (!plan) {
			throw createError(404, 'Plan not found');
		}

		return res.status(200).json({
			success: true,
			message: 'Plan deleted successfully'
		});
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	createOrder,
	verifyPayment,
	getPaymentDetails,
	getPaymentHistory,
	cancelPayment,
	getPlans,
	createPlan,
	updatePlan,
	deletePlan
};
