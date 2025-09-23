const express = require('express');
const paymentService = require('../services/payment.service');
const { Plan } = require('../models');
const createError = require('http-errors');

/**
 * Payment page route - redirects to Razorpay checkout
 * GET /payments/checkout/:planId
 */
async function paymentCheckout(req, res, next) {
	try {
		const { planId } = req.params;
		const userId = req.user?.id; // Optional user ID

		if (!planId) {
			throw createError(400, 'Plan ID is required');
		}

		// Get plan details
		const plan = await Plan.findById(planId);
		if (!plan) {
			throw createError(404, 'Plan not found');
		}

		// Create order (works with or without user authentication)
		const amountInPaise = Math.round(plan.amount * 100);
		
		const result = await paymentService.createOrder({
			userId: userId || null, // Allow null userId for anonymous payments
			planId,
			amount: amountInPaise,
			currency: plan.currency,
			notes: {
				planName: plan.plan,
				billingCycle: plan.billingCycle
			}
		});

		// Redirect to Razorpay checkout
		return res.redirect(result.checkoutUrl);
	} catch (err) {
		return next(err);
	}
}

/**
 * Payment success callback
 * GET /payments/success
 */
async function paymentSuccess(req, res, next) {
	try {
		const { order_id, payment_id, signature } = req.query;

		if (!order_id || !payment_id || !signature) {
			throw createError(400, 'Missing payment parameters');
		}

		// Verify payment
		const payment = await paymentService.verifyPayment(order_id, payment_id, signature);

		// Redirect to success page or return success response
		return res.json({
			success: true,
			message: 'Payment successful!',
			payment: {
				id: payment._id,
				status: payment.status,
				amount: payment.amount,
				currency: payment.currency
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Payment failure callback
 * GET /payments/failure
 */
async function paymentFailure(req, res, next) {
	try {
		const { order_id, error_code, error_description } = req.query;

		// Update payment status to failed
		if (order_id) {
			await paymentService.cancelPayment(order_id);
		}

		return res.json({
			success: false,
			message: 'Payment failed',
			error: {
				code: error_code,
				description: error_description
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Payment page with plan selection
 * GET /payments/page
 */
async function paymentPage(req, res, next) {
	try {
		const plans = await Plan.find({}).sort({ amount: 1 });

		// Return HTML page or JSON with plans
		return res.json({
			success: true,
			message: 'Payment page',
			plans: plans,
			checkoutUrls: plans.map(plan => ({
				planId: plan._id,
				planName: plan.plan,
				amount: plan.amount,
				checkoutUrl: `/payments/checkout/${plan._id}`
			}))
		});
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	paymentCheckout,
	paymentSuccess,
	paymentFailure,
	paymentPage
};
