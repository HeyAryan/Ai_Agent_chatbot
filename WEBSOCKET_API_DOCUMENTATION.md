# WebSocket API Documentation

## Overview
This document describes the WebSocket API for the AI Agent Chatbot application. The WebSocket server runs on the same port as the HTTP server (default: 3000) and provides real-time communication for chat functionality.

## Connection

### Server URL
```
ws://localhost:3000
```

### Connection Setup
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket']
});
```

## WebSocket Events

### 1. Connection Events

#### `connect`
**Triggered when:** Client successfully connects to the server
**Data:** None
**Example:**
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
  // Register with connection ID
  socket.emit('register', connectionId);
});
```

#### `disconnect`
**Triggered when:** Client disconnects from the server
**Data:** None
**Example:**
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

#### `connect_error`
**Triggered when:** Connection fails
**Data:** Error object
**Example:**
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

### 2. Registration Events

#### `register` (Client → Server)
**Purpose:** Register client with a unique connection ID
**Data:**
```typescript
{
  connectionId: string  // Required: Unique identifier for the client
}
```
**Example:**
```javascript
socket.emit('register', 'user-connection-123');
```

#### `registered` (Server → Client)
**Purpose:** Confirmation of successful registration
**Data:**
```typescript
{
  connectionId: string,
  socketId: string,
  status: "success"
}
```
**Example:**
```javascript
socket.on('registered', (data) => {
  console.log('Registration successful:', data);
  // data = {
  //   connectionId: 'user-connection-123',
  //   socketId: 'CBbENcX-KkkgAuEbAAAD',
  //   status: 'success'
  // }
});
```

---

### 3. Chat Events

#### `message` (Client → Server)
**Purpose:** Send a chat message to the AI assistant
**Data:**
```typescript
{
  message: string,      // Required: The user's message
  agentId: string,      // Required: ID of the AI agent
  userId: string,       // Required: ID of the user
  threadId?: string     // Optional: Existing conversation thread ID
}
```
**Example:**
```javascript
socket.emit('message', {
  message: 'Hello, how are you?',
  agentId: 'agent-demo-123',
  userId: 'user-demo-456',
  threadId: 'thread_abc123'  // Optional for conversation continuity
});
```

#### `messageResponse` (Server → Client)
**Purpose:** Receive AI assistant's response
**Data:**
```typescript
{
  status: "ok" | "error",
  message: string,      // AI response or error message
  userId: string,
  agentId: string,
  threadId: string,     // Thread ID for conversation continuity
  serverTime: string    // ISO timestamp
}
```
**Example:**
```javascript
socket.on('messageResponse', (data) => {
  console.log('AI Response:', data.message);
  // data = {
  //   status: 'ok',
  //   message: 'Hello! I am doing well, thank you for asking.',
  //   userId: 'user-demo-456',
  //   agentId: 'agent-demo-123',
  //   threadId: 'thread_abc123',
  //   serverTime: '2024-01-15T10:30:00.000Z'
  // }
});
```

---

### 4. Error Events

#### `error` (Server → Client)
**Purpose:** Handle various error conditions
**Data:**
```typescript
{
  message: string       // Error description
}
```
**Example:**
```javascript
socket.on('error', (data) => {
  console.error('Server error:', data.message);
  // data = { message: 'Connection ID is required' }
});
```

---

### 5. Extended Chat Events (Available but not implemented)

#### `typing` (Client → Server)
**Purpose:** Send typing indicator
**Data:**
```typescript
{
  user: string,
  isTyping: boolean
}
```

#### `userTyping` (Server → Client)
**Purpose:** Receive typing indicator from other users
**Data:**
```typescript
{
  user: string,
  isTyping: boolean,
  timestamp: string
}
```

#### `joinRoom` (Client → Server)
**Purpose:** Join a chat room
**Data:**
```typescript
{
  roomId: string,
  user: string
}
```

#### `joinedRoom` (Server → Client)
**Purpose:** Confirmation of joining a room
**Data:**
```typescript
{
  roomId: string,
  status: "success",
  timestamp: string
}
```

#### `userJoined` (Server → Client)
**Purpose:** Notification when another user joins the room
**Data:**
```typescript
{
  user: string,
  roomId: string,
  timestamp: string
}
```

#### `leaveRoom` (Client → Server)
**Purpose:** Leave a chat room
**Data:**
```typescript
{
  roomId: string,
  user: string
}
```

#### `userLeft` (Server → Client)
**Purpose:** Notification when a user leaves the room
**Data:**
```typescript
{
  user: string,
  roomId: string,
  timestamp: string
}
```

#### `reaction` (Client → Server)
**Purpose:** Send message reaction
**Data:**
```typescript
{
  messageId: string,
  reaction: string,
  user: string
}
```

#### `messageReaction` (Server → Client)
**Purpose:** Receive message reaction from other users
**Data:**
```typescript
{
  messageId: string,
  reaction: string,
  user: string,
  timestamp: string
}
```

---

## Complete Implementation Example

### Client-Side Implementation (Angular/TypeScript)

```typescript
import { io, Socket } from 'socket.io-client';

export class ChatService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionId: string = '';

  connect(connectionId: string) {
    this.connectionId = connectionId;
    this.socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.socket?.emit('register', connectionId);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Registration events
    this.socket.on('registered', (data) => {
      console.log('Registration successful:', data);
    });

    // Chat events
    this.socket.on('messageResponse', (data) => {
      if (data.status === 'ok') {
        console.log('AI Response:', data.message);
        // Handle successful response
      } else {
        console.error('Error:', data.message);
        // Handle error
      }
    });

    // Error events
    this.socket.on('error', (data) => {
      console.error('Server error:', data.message);
    });
  }

  sendMessage(message: string, agentId: string, userId: string, threadId?: string) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('message', {
      message,
      agentId,
      userId,
      threadId
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}
```

### Usage Example

```typescript
// Initialize chat service
const chatService = new ChatService();

// Connect with connection ID
chatService.connect('user-connection-123');

// Send a message
chatService.sendMessage(
  'Hello, how are you?',
  'agent-demo-123',
  'user-demo-456'
);

// Send a message with thread ID for conversation continuity
chatService.sendMessage(
  'What about the weather?',
  'agent-demo-123',
  'user-demo-456',
  'thread_abc123'
);
```

---

## Error Handling

### Common Error Scenarios

1. **Invalid Message Data**
   ```json
   {
     "status": "error",
     "message": "Invalid message data",
     "serverTime": "2024-01-15T10:30:00.000Z"
   }
   ```

2. **AI Service Unavailable**
   ```json
   {
     "status": "error",
     "message": "AI service is temporarily unavailable. Please try again in a moment.",
     "userId": "user-demo-456",
     "agentId": "agent-demo-123",
     "serverTime": "2024-01-15T10:30:00.000Z"
   }
   ```

3. **Network Connection Issues**
   ```json
   {
     "status": "error",
     "message": "Unable to connect to AI service. Please check your connection and try again.",
     "userId": "user-demo-456",
     "agentId": "agent-demo-123",
     "serverTime": "2024-01-15T10:30:00.000Z"
   }
   ```

4. **Internal Server Error**
   ```json
   {
     "status": "error",
     "message": "Sorry, something went wrong. Please try again.",
     "userId": "user-demo-456",
     "agentId": "agent-demo-123",
     "serverTime": "2024-01-15T10:30:00.000Z"
   }
   ```

---

## Best Practices

### 1. Connection Management
- Always register after connecting
- Handle connection errors gracefully
- Implement reconnection logic
- Clean up connections on component unmount

### 2. Message Handling
- Validate message data before sending
- Handle both success and error responses
- Implement loading states for better UX
- Store threadId for conversation continuity

### 3. Error Handling
- Always check response status
- Display user-friendly error messages
- Implement retry mechanisms for network errors
- Log errors for debugging

### 4. Performance
- Use threadId to maintain conversation context
- Implement message queuing for offline scenarios
- Debounce typing indicators
- Clean up event listeners

---

## Testing

### Manual Testing
1. Connect to WebSocket server
2. Register with connection ID
3. Send test message
4. Verify AI response
5. Test error scenarios

### Automated Testing
```javascript
// Example test using socket.io-client
import { io } from 'socket.io-client';

describe('WebSocket Chat', () => {
  let socket;

  beforeEach(() => {
    socket = io('http://localhost:3000');
  });

  afterEach(() => {
    socket.disconnect();
  });

  it('should connect and register successfully', (done) => {
    socket.on('connect', () => {
      socket.emit('register', 'test-connection-id');
    });

    socket.on('registered', (data) => {
      expect(data.status).toBe('success');
      done();
    });
  });

  it('should send and receive messages', (done) => {
    socket.emit('message', {
      message: 'Hello',
      agentId: 'agent-demo-123',
      userId: 'user-demo-456'
    });

    socket.on('messageResponse', (data) => {
      expect(data.status).toBe('ok');
      expect(data.message).toBeDefined();
      done();
    });
  });
});
```

---

## Security Considerations

1. **Authentication**: Implement JWT token validation for WebSocket connections
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: Validate all incoming message data
4. **CORS**: Configure proper CORS settings for production
5. **HTTPS/WSS**: Use secure connections in production

---

## Version History

- **v1.0.0**: Initial WebSocket implementation with basic chat functionality
- **v1.1.0**: Added conversation thread support
- **v1.2.0**: Enhanced error handling and response formatting

---

## Support

For technical support or questions about the WebSocket API, please contact the backend development team.
