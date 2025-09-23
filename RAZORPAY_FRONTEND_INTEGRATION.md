# Razorpay Payment Integration - Frontend Redirect Methods

Since you're not integrating the Razorpay SDK in the frontend, here are several ways to redirect users to the Razorpay payment page:

## Method 1: Direct Checkout URL Redirect (Recommended)

### Backend Response
When you call `POST /payments/create-order`, you'll get:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_xyz123",
    "amount": 29900,
    "currency": "INR",
    "receipt": "receipt_1234567890",
    "paymentId": "payment_db_id",
    "checkoutUrl": "https://checkout.razorpay.com/v1/checkout.js?payment_id=order_xyz123"
  }
}
```

### Frontend Implementation
```javascript
// Create order and redirect
const initiatePayment = async (planId, amount) => {
  try {
    const response = await fetch('/payments/create-order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planId,
        amount,
        currency: 'INR'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Redirect to Razorpay checkout
      window.location.href = result.data.checkoutUrl;
    }
  } catch (error) {
    console.error('Payment initiation failed:', error);
  }
};
```

## Method 2: Direct Plan Checkout (One-Click)

### Frontend Implementation
```javascript
// Direct redirect to checkout for a specific plan
const checkoutPlan = (planId) => {
  // Redirect to checkout URL
  window.location.href = `/payments/checkout/${planId}`;
};

// Usage in HTML
<button onclick="checkoutPlan('plan_id_here')">
  Pay Now - ₹299/month
</button>
```

### Backend Flow
1. User clicks "Pay Now" button
2. Frontend redirects to `/payments/checkout/:planId`
3. Backend creates order and redirects to Razorpay
4. User completes payment on Razorpay
5. Razorpay redirects back to your success/failure URLs

## Method 3: Payment Page with Plan Selection

### Access the Payment Page
```
GET /payments/html
```

This serves a complete HTML page with:
- Plan selection interface
- Login prompt
- Direct checkout buttons
- Responsive design

### Features
- Beautiful UI with plan cards
- Login integration
- One-click payment buttons
- Mobile responsive

## Method 4: API-Based Plan Selection

### Get Available Plans
```javascript
// Fetch plans
const getPlans = async () => {
  const response = await fetch('/payments/plans');
  const result = await response.json();
  return result.data;
};

// Display plans and create checkout URLs
const displayPlans = async () => {
  const plans = await getPlans();
  
  plans.forEach(plan => {
    const checkoutUrl = `/payments/checkout/${plan._id}`;
    // Create plan card with checkout button
    createPlanCard(plan, checkoutUrl);
  });
};
```

## Method 5: Form-Based Payment

### HTML Form
```html
<form action="/payments/checkout/plan_id" method="GET">
  <input type="hidden" name="planId" value="plan_id">
  <button type="submit">Pay ₹299/month</button>
</form>
```

### JavaScript Form Submission
```javascript
const submitPayment = (planId) => {
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = `/payments/checkout/${planId}`;
  document.body.appendChild(form);
  form.submit();
};
```

## Payment Flow Summary

### Complete Payment Flow
1. **User selects plan** → Frontend shows plan options
2. **User clicks "Pay Now"** → Redirect to `/payments/checkout/:planId`
3. **Backend creates order** → Creates Razorpay order and payment record
4. **Redirect to Razorpay** → User sees Razorpay checkout page
5. **User completes payment** → Payment processed on Razorpay
6. **Razorpay redirects back** → To success/failure URLs
7. **Backend verifies payment** → Updates payment status and user membership

### Success/Failure Handling
```javascript
// Razorpay will redirect to these URLs after payment:
// Success: /payments/success?order_id=xxx&payment_id=xxx&signature=xxx
// Failure: /payments/failure?order_id=xxx&error_code=xxx&error_description=xxx

// Your backend handles these callbacks automatically
```

## Example Frontend Integration

### Complete Example
```html
<!DOCTYPE html>
<html>
<head>
    <title>Choose Your Plan</title>
</head>
<body>
    <div id="plans-container">
        <!-- Plans will be loaded here -->
    </div>
    
    <script>
        // Load and display plans
        async function loadPlans() {
            try {
                const response = await fetch('/payments/plans');
                const result = await response.json();
                
                if (result.success) {
                    displayPlans(result.data);
                }
            } catch (error) {
                console.error('Failed to load plans:', error);
            }
        }
        
        function displayPlans(plans) {
            const container = document.getElementById('plans-container');
            
            plans.forEach(plan => {
                const planCard = document.createElement('div');
                planCard.innerHTML = `
                    <h3>${plan.plan}</h3>
                    <p>₹${plan.amount}/${plan.billingCycle}</p>
                    <ul>
                        ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    <button onclick="checkoutPlan('${plan._id}')">
                        Pay Now
                    </button>
                `;
                container.appendChild(planCard);
            });
        }
        
        function checkoutPlan(planId) {
            // Redirect to checkout
            window.location.href = `/payments/checkout/${planId}`;
        }
        
        // Load plans on page load
        loadPlans();
    </script>
</body>
</html>
```

## Testing the Integration

### Test URLs
1. **View Plans**: `GET http://localhost:3000/payments/plans`
2. **Payment Page**: `GET http://localhost:3000/payments/html`
3. **Checkout**: `GET http://localhost:3000/payments/checkout/plan_id` (requires auth)

### Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Security Notes

1. **Authentication Required**: All checkout operations require valid JWT tokens
2. **Server-Side Verification**: Payment verification happens on the backend
3. **HTTPS Required**: Use HTTPS in production
4. **Signature Verification**: Razorpay signatures are verified server-side

This approach gives you a complete payment system without needing the Razorpay SDK in your frontend! 🚀
