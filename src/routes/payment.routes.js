const express = require('express');
const {
	createOrder,
	verifyPayment,
	getPaymentDetails,
	getPaymentHistory,
	cancelPayment,
	getPlans,
	createPlan,
	updatePlan,
	deletePlan
} = require('../controllers/payment.controller');
const {
	paymentCheckout,
	paymentSuccess,
	paymentFailure,
	paymentPage
} = require('../controllers/paymentPage.controller');
const { 
	renderPaymentPage,
	quickCheckout,
	testPaymentPage
} = require('../controllers/paymentHtml.controller');

const router = express.Router();

// Public routes
router.get('/plans', getPlans);
router.get('/test', testPaymentPage);
router.get('/page/:planId', renderPaymentPage);
router.get('/checkout/:planId', quickCheckout);
router.get('/success', paymentSuccess);
router.get('/failure', paymentFailure);

// Payment operations
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/:orderId', getPaymentDetails);
router.put('/:orderId/cancel', cancelPayment);

// Admin routes for plan management
router.post('/plans', createPlan);
router.put('/plans/:planId', updatePlan);
router.delete('/plans/:planId', deletePlan);

module.exports = router;
