# Socket.IO Integration Documentation

## Overview
This document describes the Socket.IO integration for the AI Agent Chatbot backend, providing real-time communication capabilities with JWT authentication and structured event handling.

## Features
- ✅ JWT Authentication for WebSocket connections
- ✅ Active connection management (userId ↔ socketId mapping)
- ✅ Structured event naming (resource:action pattern)
- ✅ Message routing with offline user handling
- ✅ Comprehensive logging for debugging
- ✅ REST endpoint for WebSocket connection information

## Installation
The Socket.IO dependency has been added to `package.json`:
```json
{
  "dependencies": {
    "socket.io": "^4.7.5"
  }
}
```

## API Endpoints

### GET /app/get-connection-id
Returns WebSocket server URL and connection information.

**Response:**
```json
{
  "success": true,
  "data": {
    "websocketUrl": "ws://localhost:3000",
    "connectionInfo": {
      "protocol": "ws",
      "host": "localhost:3000",
      "port": "3000",
      "timestamp": "2024-01-01T10:00:00.000Z"
    },
    "instructions": {
      "authentication": "Include JWT token in auth.token or Authorization header",
      "events": [
        "notification:get → notification:receive",
        "connection:get → connection:receive",
        "conversation:get → conversation:receive",
        "message:send → message:receive"
      ]
    }
  }
}
```

## WebSocket Events

### Authentication
Connect to the WebSocket server with JWT authentication:
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Event Patterns
All events follow the `resource:action` naming convention:

#### 1. notification:get → notification:receive
**Purpose:** Fetch all notifications for the authenticated user

**Client Request:**
```javascript
socket.emit('notification:get', {});
```

**Server Response:**
```javascript
socket.on('notification:receive', (data) => {
  console.log(data);
  // {
  //   success: true,
  //   data: [...notifications],
  //   timestamp: "2024-01-01T10:00:00.000Z"
  // }
});
```

#### 2. connection:get → connection:receive
**Purpose:** Fetch all active connections

**Client Request:**
```javascript
socket.emit('connection:get', {});
```

**Server Response:**
```javascript
socket.on('connection:receive', (data) => {
  console.log(data);
  // {
  //   success: true,
  //   data: [{ userId: "...", socketId: "..." }],
  //   totalConnections: 5,
  //   timestamp: "2024-01-01T10:00:00.000Z"
  // }
});
```

#### 3. conversation:get → conversation:receive
**Purpose:** Fetch all conversations for the authenticated user

**Client Request:**
```javascript
socket.emit('conversation:get', {});
```

**Server Response:**
```javascript
socket.on('conversation:receive', (data) => {
  console.log(data);
  // {
  //   success: true,
  //   data: [...conversations],
  //   timestamp: "2024-01-01T10:00:00.000Z"
  // }
});
```

#### 4. message:send → message:receive
**Purpose:** Send a message to an active conversation

**Client Request:**
```javascript
socket.emit('message:send', {
  conversationId: "conversation_id",
  targetUserId: "target_user_id", // Optional
  content: "Hello, world!",
  attachments: [] // Optional
});
```

**Server Response:**
```javascript
socket.on('message:receive', (data) => {
  console.log(data);
  // {
  //   success: true,
  //   data: {
  //     _id: "message_id",
  //     conversationId: "conversation_id",
  //     sender: "user",
  //     senderId: "user_id",
  //     content: "Hello, world!",
  //     senderInfo: {
  //       userId: "user_id",
  //       email: "user@example.com",
  //       role: "user"
  //     },
  //     createdAt: "2024-01-01T10:00:00.000Z"
  //   },
  //   timestamp: "2024-01-01T10:00:00.000Z"
  // }
});
```

## Connection Management

### Active Connections Map
The server maintains two maps for connection management:
- `activeConnections`: userId → socketId
- `socketToUser`: socketId → userId

### Connection Lifecycle
1. **Connect:** User authenticates with JWT token
2. **Join Room:** User joins their personal room (`user:${userId}`)
3. **Track Connection:** Added to active connections map
4. **Disconnect:** Removed from active connections map

### Message Routing
- **Online Users:** Messages are delivered immediately via WebSocket
- **Offline Users:** Messages are stored in database and logged

## Logging

### Connection Logs
```
[SOCKET] [socket_id] New connection established { userId: "...", email: "...", role: "..." }
[SOCKET] [socket_id] User connected { userId: "...", totalConnections: 5 }
[SOCKET] [socket_id] Disconnected { userId: "...", reason: "client namespace disconnect" }
```

### Event Logs
```
[SOCKET] [socket_id] notification:get received { userId: "..." }
[SOCKET] [socket_id] notification:receive sent { userId: "...", notificationCount: 3 }
[SOCKET] [socket_id] message:send received { userId: "...", targetUserId: "...", conversationId: "..." }
[SOCKET] [socket_id] message:receive sent { userId: "...", targetUserId: "...", messageId: "..." }
```

### Error Logs
```
[SOCKET] [socket_id] Authentication failed: No token provided
[SOCKET] [socket_id] Error sending message: [error details]
[SOCKET] [socket_id] Target user not connected, message stored in database
```

## File Structure

```
src/
├── services/
│   └── socket.service.js          # Socket.IO service with connection management
├── controllers/
│   └── app.controller.js          # Updated with getConnectionId endpoint
├── routes/
│   └── app.routes.js              # Updated with /get-connection-id route
└── server.js                      # Updated with Socket.IO integration
```

## Usage Example

### Frontend Integration
```javascript
// 1. Get WebSocket URL
const response = await fetch('/app/get-connection-id');
const { data } = await response.json();
const { websocketUrl } = data;

// 2. Connect with JWT authentication
const socket = io(websocketUrl, {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});

// 3. Handle connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

// 4. Send and receive messages
socket.emit('message:send', {
  conversationId: 'conv_123',
  targetUserId: 'user_456',
  content: 'Hello!'
});

socket.on('message:receive', (data) => {
  if (data.success) {
    console.log('Message received:', data.data);
  }
});

// 5. Fetch notifications
socket.emit('notification:get', {});
socket.on('notification:receive', (data) => {
  if (data.success) {
    console.log('Notifications:', data.data);
  }
});
```

## Security Considerations

1. **JWT Authentication:** All WebSocket connections require valid JWT tokens
2. **CORS Configuration:** Configure CORS properly for production
3. **Rate Limiting:** Consider implementing rate limiting for WebSocket events
4. **Input Validation:** Validate all incoming WebSocket data
5. **Error Handling:** Comprehensive error handling and logging

## Production Deployment

1. **Environment Variables:** Configure proper CORS origins
2. **SSL/TLS:** Use WSS (WebSocket Secure) in production
3. **Load Balancing:** Consider sticky sessions for WebSocket connections
4. **Monitoring:** Monitor connection counts and message throughput
5. **Scaling:** Consider Redis adapter for multiple server instances

## Troubleshooting

### Common Issues
1. **Authentication Failures:** Check JWT token validity and format
2. **Connection Drops:** Implement reconnection logic in frontend
3. **Message Delivery:** Check if target user is online
4. **CORS Errors:** Verify CORS configuration matches frontend domain

### Debug Commands
```bash
# Check active connections
curl http://localhost:3000/app/get-connection-id

# Monitor server logs
npm run dev
```

## Future Enhancements

1. **Room Management:** Add support for group conversations
2. **Message Status:** Implement read receipts and delivery status
3. **File Sharing:** Add support for file attachments
4. **Push Notifications:** Integrate with push notification services
5. **Analytics:** Add connection and message analytics
