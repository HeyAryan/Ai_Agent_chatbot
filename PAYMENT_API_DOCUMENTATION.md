# Payment API Documentation

This document describes the Razorpay payment integration for the AI Agent Chatbot application.

## Overview

The payment system allows users to subscribe to different plans using Razorpay as the payment gateway. It includes order creation, payment verification, and plan management.

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

### Protected Endpoints (Require Authentication)

#### Create Payment Order
```
POST /payments/create-order
```

**Headers:**
```
Authorization: Bearer <jwt_token>
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
    "paymentId": "payment_db_id"
  }
}
```

#### Verify Payment
```
POST /payments/verify
```

**Headers:**
```
Authorization: Bearer <jwt_token>
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

## Frontend Integration

### 1. Create Order

```javascript
const createOrder = async (planId, amount) => {
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
  
  return await response.json();
};
```

### 2. Initialize Razorpay

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

### 3. Verify Payment

```javascript
const verifyPayment = async (razorpayResponse) => {
  const response = await fetch('/payments/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
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

## Security Notes

1. **Signature Verification**: Always verify Razorpay signatures on the backend
2. **Amount Validation**: Validate amounts match the plan before creating orders
3. **User Authentication**: All payment operations require valid JWT tokens
4. **HTTPS**: Use HTTPS in production for secure payment processing
5. **Environment Variables**: Store Razorpay keys securely in environment variables

## Testing

Use Razorpay test cards for testing:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Production Deployment

1. Replace test key with live Razorpay key
2. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in environment variables
3. Ensure HTTPS is enabled
4. Test payment flow thoroughly before going live
