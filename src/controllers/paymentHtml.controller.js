const createError = require('http-errors');
const paymentService = require('../services/payment.service');
const { Plan } = require('../models');

/**
 * Render payment page with Razorpay integration
 * GET /payments/page/:planId
 */
async function renderPaymentPage(req, res, next) {
	try {
		const { planId } = req.params;
		
		// Get plan details
		const plan = await Plan.findById(planId);
		if (!plan) {
			throw createError(404, 'Plan not found');
		}

		// Create order
		const result = await paymentService.createOrder({
			userId: req.user?.id || null,
			planId: planId,
			amount: plan.amount * 100, // Convert to paise
			currency: plan.currency || 'INR',
			notes: {
				planName: plan.plan,
				billingCycle: plan.billingCycle
			}
		});

		// Render payment page with Razorpay integration
		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment - ${plan.plan}</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .payment-container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .plan-info { 
            margin-bottom: 30px; 
        }
        .plan-name { 
            font-size: 24px; 
            color: #333; 
            margin-bottom: 10px;
        }
        .plan-price { 
            font-size: 32px; 
            font-weight: bold; 
            color: #007bff; 
            margin-bottom: 5px;
        }
        .plan-cycle { 
            color: #666; 
            font-size: 14px;
        }
        .features { 
            margin: 20px 0; 
            text-align: left;
        }
        .features ul { 
            list-style: none; 
            padding: 0; 
        }
        .features li { 
            padding: 5px 0; 
            border-bottom: 1px solid #eee;
        }
        .features li:before { 
            content: "✓ "; 
            color: #28a745; 
            font-weight: bold;
        }
        .pay-button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 15px 40px; 
            font-size: 18px; 
            border-radius: 5px; 
            cursor: pointer; 
            margin: 20px 0;
            transition: background 0.3s;
        }
        .pay-button:hover { 
            background: #0056b3; 
        }
        .pay-button:disabled { 
            background: #ccc; 
            cursor: not-allowed;
        }
        .loading { 
            display: none; 
            color: #666; 
            margin: 10px 0;
        }
        .error { 
            color: #dc3545; 
            margin: 10px 0; 
            padding: 10px; 
            background: #f8d7da; 
            border-radius: 5px;
        }
        .success { 
            color: #28a745; 
            margin: 10px 0; 
            padding: 10px; 
            background: #d4edda; 
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="payment-container">
        <div class="plan-info">
            <div class="plan-name">${plan.plan}</div>
            <div class="plan-price">₹${plan.amount}</div>
            <div class="plan-cycle">per ${plan.billingCycle}</div>
        </div>
        
        <div class="features">
            <h4>Features included:</h4>
            <ul>
                ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
        
        <button class="pay-button" onclick="initiatePayment()">
            💳 Pay ₹${plan.amount}
        </button>
        
        <div class="loading" id="loading">
            Processing payment...
        </div>
        
        <div id="status"></div>
    </div>

    <script>
        const orderData = ${JSON.stringify(result.order)};
        const config = {
            key: '${process.env.RAZORPAY_KEY_ID}',
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'AI Agent Chatbot',
            description: '${plan.plan} Subscription',
            order_id: orderData.id,
            handler: function (response) {
                // Payment successful
                showStatus('Payment successful! Processing...', 'success');
                
                // Send verification to backend
                verifyPayment(response);
            },
            prefill: {
                name: 'Test User',
                email: 'test@example.com',
                contact: '9999999999'
            },
            notes: {
                planId: '${planId}',
                planName: '${plan.plan}'
            },
            theme: {
                color: '#007bff'
            },
            modal: {
                ondismiss: function() {
                    showStatus('Payment cancelled', 'error');
                }
            }
        };

        function initiatePayment() {
            const button = document.querySelector('.pay-button');
            const loading = document.getElementById('loading');
            
            button.disabled = true;
            loading.style.display = 'block';
            
            try {
                const rzp = new Razorpay(config);
                rzp.open();
            } catch (error) {
                showStatus('Error initializing payment: ' + error.message, 'error');
                button.disabled = false;
                loading.style.display = 'none';
            }
        }

        async function verifyPayment(response) {
            try {
                const verifyResponse = await fetch('/payments/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature
                    })
                });
                
                const result = await verifyResponse.json();
                
                if (result.success) {
                    showStatus('Payment verified successfully! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard?payment=success';
                    }, 2000);
                } else {
                    showStatus('Payment verification failed: ' + result.message, 'error');
                }
            } catch (error) {
                showStatus('Verification error: ' + error.message, 'error');
            }
        }

        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = '<div class="' + type + '">' + message + '</div>';
        }

        // Auto-initiate payment after 2 seconds
        setTimeout(() => {
            initiatePayment();
        }, 2000);
    </script>
</body>
</html>`;

		res.send(html);
	} catch (err) {
		return next(err);
	}
}

/**
 * Quick checkout redirect
 * GET /payments/checkout/:planId
 */
async function quickCheckout(req, res, next) {
	try {
		const { planId } = req.params;
		
		// Get plan details
		const plan = await Plan.findById(planId);
		if (!plan) {
			throw createError(404, 'Plan not found');
		}

		// Create order
		const result = await paymentService.createOrder({
			userId: req.user?.id || null,
			planId: planId,
			amount: plan.amount * 100, // Convert to paise
			currency: plan.currency || 'INR',
			notes: {
				planName: plan.plan,
				billingCycle: plan.billingCycle
			}
		});

		// Redirect to Razorpay checkout
		res.redirect(result.checkoutUrl);
	} catch (err) {
		return next(err);
	}
}

/**
 * Test payment page
 * GET /payments/test
 */
async function testPaymentPage(req, res, next) {
	try {
		const plans = await Plan.find({}).sort({ amount: 1 });
		
		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .plan-card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; }
        .plan-card h3 { color: #333; margin-top: 0; }
        .plan-card .price { font-size: 24px; font-weight: bold; color: #007bff; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .test-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🧪 Payment Test Page</h1>
    
    <div class="test-info">
        <h3>Test Instructions:</h3>
        <p>1. Click "Test Payment Page" for full Razorpay integration</p>
        <p>2. Click "Quick Checkout" for direct redirect</p>
        <p>3. Use test card: 4111 1111 1111 1111</p>
    </div>

    ${plans.map(plan => `
        <div class="plan-card">
            <h3>${plan.plan}</h3>
            <div class="price">₹${plan.amount}/${plan.billingCycle}</div>
            <button onclick="testPaymentPage('${plan._id}')">Test Payment Page</button>
            <button onclick="quickCheckout('${plan._id}')">Quick Checkout</button>
        </div>
    `).join('')}

    <script>
        function testPaymentPage(planId) {
            window.location.href = '/payments/page/' + planId;
        }
        
        function quickCheckout(planId) {
            window.location.href = '/payments/checkout/' + planId;
        }
    </script>
</body>
</html>`;

		res.send(html);
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	renderPaymentPage,
	quickCheckout,
	testPaymentPage
};