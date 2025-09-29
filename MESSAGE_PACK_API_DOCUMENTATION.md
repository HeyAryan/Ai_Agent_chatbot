# Message Pack API Documentation

## Overview

The Message Pack system allows users to purchase additional messages for AI agents. Each user gets a configurable number of free messages per agent (default: 10), and can purchase additional message packs to continue conversations.

## Features

- **Free Messages**: Configurable free messages per agent per user (default: 10)
- **Message Packs**: Purchase additional messages in predefined packs
- **Per-Agent Tracking**: Message credits are tracked separately for each agent
- **Flexible Pricing**: Multiple pack sizes with different pricing tiers
- **Validity Periods**: Message packs can have expiry dates
- **Real-time Deduction**: Messages are deducted in real-time when sent

## API Endpoints

### 1. Get Available Message Packs

**GET** `/api/message-packs`

Get all available message packs for purchase.

**Query Parameters:**
- `active` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "pack_id",
      "name": "Starter Pack",
      "description": "Perfect for trying out our AI agents",
      "messageCount": 30,
      "price": 10,
      "currency": "INR",
      "validityDays": 30,
      "isActive": true,
      "displayOrder": 1,
      "features": ["30 messages", "30 days validity"],
      "tags": ["starter", "popular"],
      "discountedPrice": 10
    }
  ]
}
```

### 2. Get Specific Message Pack

**GET** `/api/message-packs/:packId`

Get details of a specific message pack.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "pack_id",
    "name": "Starter Pack",
    "messageCount": 30,
    "price": 10,
    "discountedPrice": 10
  }
}
```

### 3. Purchase Message Pack

**POST** `/api/message-packs/:packId/purchase`

Create a payment order for purchasing a message pack.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_xyz",
    "amount": 1000,
    "currency": "INR",
    "receipt": "msgpack_1234567890",
    "paymentId": "payment_id",
    "checkoutUrl": "https://checkout.razorpay.com/...",
    "messagePack": {
      "id": "pack_id",
      "name": "Starter Pack",
      "messageCount": 30,
      "price": 10
    }
  }
}
```

### 4. Verify Message Pack Purchase

**POST** `/api/message-packs/verify-purchase`

Verify payment after successful purchase.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "orderId": "order_xyz",
  "paymentId": "pay_xyz",
  "signature": "signature_xyz"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message pack purchase verified successfully",
  "data": {
    "paymentId": "payment_id",
    "status": "completed",
    "amount": 1000,
    "currency": "INR",
    "messagePackId": "pack_id",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "messageCredits": {},
      "purchasedMessagePacks": []
    }
  }
}
```

### 5. Get User Message Credits for Agent

**GET** `/api/message-packs/credits/:agentId`

Get message credits for a specific agent.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "agent_id",
    "freeMessages": 10,
    "purchasedMessages": 30,
    "usedMessages": 5,
    "totalAvailable": 40,
    "remaining": 35
  }
}
```

### 6. Get All User Message Credits

**GET** `/api/message-packs/credits`

Get message credits for all agents.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": {
      "agent_id_1": {
        "freeMessages": 10,
        "purchasedMessages": 30,
        "usedMessages": 5,
        "totalAvailable": 40,
        "remaining": 35
      }
    },
    "purchasedMessagePacks": [
      {
        "packId": "pack_id",
        "quantity": 1,
        "purchaseDate": "2024-01-01T00:00:00.000Z",
        "expiryDate": "2024-01-31T00:00:00.000Z",
        "used": 0
      }
    ]
  }
}
```

## Admin Endpoints

### 7. Create Message Pack (Admin Only)

**POST** `/api/message-packs`

Create a new message pack.

**Headers:**
- `Authorization: Bearer <admin_token>`

**Body:**
```json
{
  "name": "New Pack",
  "description": "Description",
  "messageCount": 50,
  "price": 20,
  "currency": "INR",
  "validityDays": 30,
  "displayOrder": 5,
  "features": ["50 messages", "30 days validity"],
  "tags": ["new", "special"]
}
```

### 8. Update Message Pack (Admin Only)

**PUT** `/api/message-packs/:packId`

Update an existing message pack.

### 9. Delete Message Pack (Admin Only)

**DELETE** `/api/message-packs/:packId`

Delete a message pack.

## Integration with Chat System

### Message Deduction

When a user sends a message to an agent:

1. System checks if user has available credits for that agent
2. If credits are available, message is sent and credit is deducted
3. If no credits, returns 402 Payment Required error

**Example Chat Response with Credits:**
```json
{
  "success": true,
  "data": {
    "_id": "message_id",
    "content": "Hello!",
    "sender": "user",
    "conversationId": "conv_id"
  },
  "credits": {
    "remaining": 34,
    "hasCredits": true
  }
}
```

**Example Insufficient Credits Response:**
```json
{
  "success": false,
  "message": "Insufficient message credits. Please purchase more messages.",
  "remaining": 0
}
```

## Default Message Packs

The system comes with these default message packs:

1. **Starter Pack**: 30 messages for ₹10 (30 days)
2. **Basic Pack**: 50 messages for ₹15 (30 days)
3. **Premium Pack**: 100 messages for ₹25 (30 days, 10% discount)
4. **Mega Pack**: 200 messages for ₹45 (60 days, 15% discount)
5. **Unlimited Pack**: 1000+ messages for ₹99 (30 days)

## Error Codes

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Authentication required
- `402`: Payment Required - Insufficient message credits
- `403`: Forbidden - Admin access required
- `404`: Not Found - Message pack or user not found
- `500`: Internal Server Error - Server error

## Usage Examples

### Frontend Integration

```javascript
// Get available message packs
const response = await fetch('/api/message-packs');
const packs = await response.json();

// Purchase a message pack
const purchaseResponse = await fetch(`/api/message-packs/${packId}/purchase`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Check user credits before sending message
const creditsResponse = await fetch(`/api/message-packs/credits/${agentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const credits = await creditsResponse.json();

if (credits.data.remaining > 0) {
  // Send message
  const messageResponse = await fetch(`/api/chats/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'Hello!',
      sender: 'user'
    })
  });
}
```

## Database Schema

### User Model Updates
```javascript
{
  messageCredits: {
    type: Map,
    of: {
      freeMessages: { type: Number, default: config.messages.freeMessagesPerAgent },
      purchasedMessages: { type: Number, default: 0 },
      usedMessages: { type: Number, default: 0 }
    }
  },
  purchasedMessagePacks: [{
    packId: { type: ObjectId, ref: 'MessagePack' },
    quantity: { type: Number, default: 1 },
    purchaseDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    used: { type: Number, default: 0 }
  }]
}
```

### MessagePack Model
```javascript
{
  name: { type: String, required: true },
  description: { type: String },
  messageCount: { type: Number, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  validityDays: { type: Number },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  discount: {
    percentage: { type: Number, default: 0 },
    originalPrice: { type: Number }
  },
  features: [{ type: String }],
  tags: [{ type: String }]
}
```

## Environment Variables

Add the following environment variable to configure the number of free messages per agent:

```bash
# Number of free messages each user gets per agent (default: 10)
FREE_MESSAGES_PER_AGENT=10
```

## Setup Instructions

1. **Set environment variables** in your `.env` file:
```bash
FREE_MESSAGES_PER_AGENT=10
```

2. **Run the seed script** to create default message packs:
```bash
node src/scripts/seedMessagePacks.js
```

3. **Update your frontend** to integrate with the message pack system
4. **Test the payment flow** with Razorpay integration
5. **Monitor message usage** through the credits endpoints

## Security Considerations

- All purchase endpoints require authentication
- Admin endpoints require admin role
- Payment verification uses cryptographic signatures
- Message credits are validated on every message send
- Expired message packs are automatically handled
