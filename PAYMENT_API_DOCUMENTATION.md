# Payment API Documentation

This document describes the comprehensive Razorpay payment integration for the AI Agent Chatbot application.

## Overview

The payment system provides multiple ways for users to subscribe to different plans using Razorpay as the payment gateway. It includes:
- **API-based payments** with full Razorpay SDK integration
- **Browser-based payments** with direct checkout redirects
- **HTML payment pages** with embedded Razorpay integration
- **Plan management** for administrators
- **Payment verification** and webhook handling

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
RAZORPAY_KEY_ID=rzp_test_LulbryWU8UwbB4
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

### Database Models

- **Payment**: Stores payment transactions and their status
- **Plan**: Defines available subscription plans
- **User**: Updated with membership plan after successful payment

## API Endpoints

### Public Endpoints

#### Get Available Plans
```
GET /payments/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "plan_id",
      "plan": "Basic",
      "amount": 299,
      "currency": "INR",
      "billingCycle": "monthly",
      "features": ["5 AI conversations per day", "Basic AI agents"]
    }
  ]
}
```

#### Payment Test Page
```
GET /payments/test
```

**Description:** Serves a complete HTML test page with all available plans and testing options.

**Features:**
- Plan selection interface
- Test payment page (full Razorpay SDK integration)
- Quick checkout (direct redirect)
- Test card information display

#### Payment Page with Plan Selection
```
GET /payments/page/:planId
```

**Description:** Serves a complete HTML payment page for a specific plan with embedded Razorpay integration.

**Features:**
- Beautiful UI with plan details
- Embedded Razorpay SDK
- Auto-initiated payment
- Payment verification handling

#### Quick Checkout Redirect
```
GET /payments/checkout/:planId
```

**Description:** Creates an order and redirects directly to Razorpay checkout page.

**Flow:**
1. Creates Razorpay order
2. Redirects to Razorpay checkout
3. User completes payment
4. Razorpay redirects to success/failure URLs

#### Payment Success Callback
```
GET /payments/success
```

**Query Parameters:**
- `order_id`: Razorpay order ID
- `payment_id`: Razorpay payment ID
- `signature`: Razorpay signature

**Response:**
```json
{
  "success": true,
  "message": "Payment successful!",
  "payment": {
    "id": "payment_db_id",
    "status": "completed",
    "amount": 29900,
    "currency": "INR"
  }
}
```

#### Payment Failure Callback
```
GET /payments/failure
```

**Query Parameters:**
- `order_id`: Razorpay order ID
- `error_code`: Error code from Razorpay
- `error_description`: Error description

**Response:**
```json
{
  "success": false,
  "message": "Payment failed",
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "Payment failed due to insufficient funds"
  }
}
```

### Protected Endpoints (Optional Authentication)

#### Create Payment Order
```
POST /payments/create-order
```

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "plan_id",
  "amount": 299,
  "currency": "INR",
  "notes": {
    "description": "Monthly subscription"
  }
}
```

**Response:**
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

#### Verify Payment
```
POST /payments/verify
```

**Headers:**
```
Authorization: Bearer <jwt_token> (optional)
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "order_xyz123",
  "paymentId": "pay_xyz123",
  "signature": "razorpay_signature"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "paymentId": "payment_db_id",
    "status": "completed",
    "amount": 29900,
    "currency": "INR",
    "planId": "plan_id"
  }
}
```

#### Get Payment Details
```
GET /payments/:orderId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "payment_id",
    "userId": "user_id",
    "planId": {
      "plan": "Basic",
      "amount": 299,
      "currency": "INR"
    },
    "razorpayOrderId": "order_xyz123",
    "razorpayPaymentId": "pay_xyz123",
    "status": "completed",
    "amount": 29900,
    "currency": "INR"
  }
}
```

#### Get Payment History
```
GET /payments/history?page=1&limit=10&status=completed
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "payment_id",
      "status": "completed",
      "amount": 29900,
      "currency": "INR",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 1,
    "total": 1
  }
}
```

#### Cancel Payment
```
PUT /payments/:orderId/cancel
```

**Response:**
```json
{
  "success": true,
  "message": "Payment cancelled successfully",
  "data": {
    "paymentId": "payment_id",
    "status": "cancelled"
  }
}
```

### Admin Endpoints (Plan Management)

#### Create Plan
```
POST /payments/plans
```

**Request Body:**
```json
{
  "plan": "Premium",
  "amount": 999,
  "currency": "INR",
  "billingCycle": "monthly",
  "features": ["Unlimited conversations", "Priority support"]
}
```

#### Update Plan
```
PUT /payments/plans/:planId
```

#### Delete Plan
```
DELETE /payments/plans/:planId
```

## Browser Testing

### Method 1: Built-in Test Page (Recommended)

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Open test page:**
   ```
   http://localhost:3000/payments/test
   ```

   This provides:
   - All available plans
   - Test payment page (full Razorpay SDK)
   - Quick checkout (direct redirect)
   - Test card information

### Method 2: Individual Plan Testing

1. **Get available plans:**
   ```
   http://localhost:3000/payments/plans
   ```

2. **Test specific plan payment page:**
   ```
   http://localhost:3000/payments/page/[PLAN_ID]
   ```

3. **Test quick checkout:**
   ```
   http://localhost:3000/payments/checkout/[PLAN_ID]
   ```

### Method 3: Standalone Test File

Open the test file directly in your browser:
```
file:///path/to/test-payment.html
```

### Test Cards

| Card Number | Result | CVV | Expiry |
|-------------|--------|-----|--------|
| `4111 1111 1111 1111` | ✅ Success | Any 3 digits | Any future date |
| `4000 0000 0000 0002` | ❌ Failure | Any 3 digits | Any future date |

**Example:** `4111 1111 1111 1111`, CVV: `123`, Expiry: `12/25`

## Frontend Integration

### Method 1: API-Based Integration

#### 1. Create Order

```javascript
const createOrder = async (planId, amount) => {
  const response = await fetch('/payments/create-order', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Optional
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      planId,
      amount,
      currency: 'INR'
    })
  });
  
  return await response.json();
};
```

#### 2. Initialize Razorpay

```javascript
const initializeRazorpay = (orderData) => {
  const options = {
    key: 'rzp_test_LulbryWU8UwbB4', // Your Razorpay Key ID
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'AI Agent Chatbot',
    description: 'Subscription Payment',
    order_id: orderData.orderId,
    handler: async function (response) {
      // Verify payment on your backend
      await verifyPayment(response);
    },
    prefill: {
      name: user.name,
      email: user.email
    },
    theme: {
      color: '#3399cc'
    }
  };
  
  const rzp = new Razorpay(options);
  rzp.open();
};
```

#### 3. Verify Payment

```javascript
const verifyPayment = async (razorpayResponse) => {
  const response = await fetch('/payments/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Optional
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId: razorpayResponse.razorpay_order_id,
      paymentId: razorpayResponse.razorpay_payment_id,
      signature: razorpayResponse.razorpay_signature
    })
  });
  
  const result = await response.json();
  if (result.success) {
    // Payment successful
    console.log('Payment verified successfully');
  }
};
```

### Method 2: Direct Checkout Redirect (Simplest)

```javascript
// Direct redirect to checkout for a specific plan
const checkoutPlan = (planId) => {
  window.location.href = `/payments/checkout/${planId}`;
};

// Usage in HTML
<button onclick="checkoutPlan('plan_id_here')">
  Pay Now - ₹299/month
</button>
```

### Method 3: Form-Based Payment

```html
<form action="/payments/checkout/plan_id" method="GET">
  <input type="hidden" name="planId" value="plan_id">
  <button type="submit">Pay ₹299/month</button>
</form>
```

### Method 4: Complete Frontend Example

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

## Database Seeding

To populate the database with sample plans, run:

```bash
node src/scripts/seedPlans.js
```

This will create 5 sample plans:
- Basic (₹299/month)
- Pro (₹599/month)
- Enterprise (₹1299/month)
- Basic Yearly (₹2999/year)
- Pro Yearly (₹5999/year)

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request (missing required fields, invalid data)
- `401`: Unauthorized (invalid or missing token)
- `404`: Not Found (plan/payment not found)
- `500`: Internal Server Error

Example error response:
```json
{
  "success": false,
  "error": {
    "message": "Plan not found",
    "status": 404
  }
}
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

## Security Notes

1. **Signature Verification**: Always verify Razorpay signatures on the backend
2. **Amount Validation**: Validate amounts match the plan before creating orders
3. **User Authentication**: Payment operations support optional authentication
4. **HTTPS**: Use HTTPS in production for secure payment processing
5. **Environment Variables**: Store Razorpay keys securely in environment variables
6. **Anonymous Payments**: System supports payments without user authentication

## Testing URLs

### Quick Test Links
1. **View Plans**: `GET http://localhost:3000/payments/plans`
2. **Payment Test Page**: `GET http://localhost:3000/payments/test`
3. **Payment Page**: `GET http://localhost:3000/payments/page/[PLAN_ID]`
4. **Quick Checkout**: `GET http://localhost:3000/payments/checkout/[PLAN_ID]`

### Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Production Deployment

1. Replace test key with live Razorpay key
2. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in environment variables
3. Ensure HTTPS is enabled
4. Test payment flow thoroughly before going live
5. Update success/failure redirect URLs in Razorpay dashboard
6. Configure webhooks for payment status updates

## API Testing with cURL

### Get Available Plans
```bash
curl -X GET http://localhost:3000/payments/plans
```

### Create Order
```bash
curl -X POST http://localhost:3000/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan_id_here",
    "amount": 299,
    "currency": "INR"
  }'
```

### Verify Payment
```bash
curl -X POST http://localhost:3000/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_xyz123",
    "paymentId": "pay_xyz123",
    "signature": "razorpay_signature"
  }'
```

This comprehensive payment system provides multiple integration methods suitable for different frontend architectures and use cases! 🚀
