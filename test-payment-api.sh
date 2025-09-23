# Razorpay API Testing Script

# 1. Get available plans
echo "=== Getting Available Plans ==="
curl -X GET http://localhost:3000/payments/plans \
  -H "Content-Type: application/json" | jq

echo -e "\n=== Creating Payment Order ==="
# 2. Create payment order (replace PLAN_ID with actual plan ID)
curl -X POST http://localhost:3000/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planId": "PLAN_ID_HERE",
    "amount": 299,
    "currency": "INR",
    "notes": {
      "description": "Test payment"
    }
  }' | jq

echo -e "\n=== Payment Verification ==="
# 3. Verify payment (replace with actual values from Razorpay response)
curl -X POST http://localhost:3000/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "ORDER_ID_HERE",
    "paymentId": "PAYMENT_ID_HERE", 
    "signature": "SIGNATURE_HERE"
  }' | jq

echo -e "\n=== Payment History ==="
# 4. Get payment history
curl -X GET http://localhost:3000/payments/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
