# Socket-based Read Messages Implementation

## Overview

This document describes the implementation of read message functionality using WebSocket channels instead of REST API endpoints. The system provides real-time read message tracking with socket events for better performance and user experience.

## 🔌 WebSocket Events

### Client Events (Emit)

#### 1. `getUnreadCount`
Get total unread count for a user.

**Data:**
```javascript
{
  userId: string
}
```

**Example:**
```javascript
socket.emit('getUnreadCount', { userId: '68d3d06639d8fc6c51c933a3' });
```

#### 2. `markMessageAsRead`
Mark a single message as read.

**Data:**
```javascript
{
  messageId: string,
  userId: string,
  conversationId: string
}
```

**Example:**
```javascript
socket.emit('markMessageAsRead', {
  messageId: '507f1f77bcf86cd799439011',
  userId: '68d3d06639d8fc6c51c933a3',
  conversationId: '68dabaa6130824c60bc2a77c'
});
```

#### 3. `markAllMessagesAsRead`
Mark all messages in a conversation as read.

**Data:**
```javascript
{
  conversationId: string,
  userId: string
}
```

**Example:**
```javascript
socket.emit('markAllMessagesAsRead', {
  conversationId: '68dabaa6130824c60bc2a77c',
  userId: '68d3d06639d8fc6c51c933a3'
});
```

#### 4. `joinConversation`
Join a conversation room for real-time updates.

**Data:**
```javascript
{
  conversationId: string,
  userId: string
}
```

**Example:**
```javascript
socket.emit('joinConversation', {
  conversationId: '68dabaa6130824c60bc2a77c',
  userId: '68d3d06639d8fc6c51c933a3'
});
```

#### 5. `leaveConversation`
Leave a conversation room.

**Data:**
```javascript
{
  conversationId: string,
  userId: string
}
```

**Example:**
```javascript
socket.emit('leaveConversation', {
  conversationId: '68dabaa6130824c60bc2a77c',
  userId: '68d3d06639d8fc6c51c933a3'
});
```

#### 6. `getUserConversations`
Get user's conversation list with agent details.

**Data:**
```javascript
{
  userId: string
}
```

**Example:**
```javascript
socket.emit('getUserConversations', { userId: '68d3d06639d8fc6c51c933a3' });
```

#### 7. `getConversationHistory`
Get conversation message history with pagination.

**Data:**
```javascript
{
  conversationId: string,
  userId: string,
  page?: number,
  limit?: number
}
```

**Example:**
```javascript
socket.emit('getConversationHistory', {
  conversationId: '68dabaa6130824c60bc2a77c',
  userId: '68d3d06639d8fc6c51c933a3',
  page: 1,
  limit: 50
});
```

#### 8. `getConversationDetails`
Get detailed conversation information.

**Data:**
```javascript
{
  conversationId: string,
  userId: string
}
```

**Example:**
```javascript
socket.emit('getConversationDetails', {
  conversationId: '68dabaa6130824c60bc2a77c',
  userId: '68d3d06639d8fc6c51c933a3'
});
```

### Server Events (Listen)

#### 1. `unreadCount`
Receive unread count for user.

**Data:**
```javascript
{
  userId: string,
  totalUnread: number,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('unreadCount', (data) => {
  console.log('Total unread:', data.totalUnread);
});
```

#### 2. `messageMarkedAsRead`
Confirmation that message was marked as read.

**Data:**
```javascript
{
  messageId: string,
  status: string,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('messageMarkedAsRead', (data) => {
  console.log('Message marked as read:', data.messageId);
});
```

#### 3. `allMessagesMarkedAsRead`
Confirmation that all messages were marked as read.

**Data:**
```javascript
{
  conversationId: string,
  messagesUpdated: number,
  unread_messages_count: number,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('allMessagesMarkedAsRead', (data) => {
  console.log('Messages updated:', data.messagesUpdated);
});
```

#### 4. `messageStatusUpdate`
Real-time message status updates.

**Data:**
```javascript
{
  messageId: string,
  status: string,
  userId: string,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('messageStatusUpdate', (data) => {
  console.log('Status update:', data.status);
});
```

#### 5. `conversationMarkedAsRead`
Real-time conversation read status updates.

**Data:**
```javascript
{
  conversationId: string,
  userId: string,
  unread_messages_count: number,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('conversationMarkedAsRead', (data) => {
  console.log('Conversation marked as read:', data.conversationId);
});
```

#### 6. `joinedConversation`
Confirmation of joining conversation room.

**Data:**
```javascript
{
  conversationId: string,
  status: string,
  timestamp: string
}
```

#### 7. `leftConversation`
Confirmation of leaving conversation room.

**Data:**
```javascript
{
  conversationId: string,
  status: string,
  timestamp: string
}
```

#### 8. `userConversations`
Receive user's conversation list.

**Data:**
```javascript
{
  userId: string,
  conversations: Array,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('userConversations', (data) => {
  console.log('User conversations:', data.conversations);
});
```

#### 9. `conversationHistory`
Receive conversation message history.

**Data:**
```javascript
{
  conversationId: string,
  messages: Array,
  pagination: Object,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('conversationHistory', (data) => {
  console.log('Messages:', data.messages);
  console.log('Pagination:', data.pagination);
});
```

#### 10. `conversationDetails`
Receive detailed conversation information.

**Data:**
```javascript
{
  conversationId: string,
  conversation: Object,
  timestamp: string
}
```

**Example:**
```javascript
socket.on('conversationDetails', (data) => {
  console.log('Conversation details:', data.conversation);
});
```

#### 11. `error`
Error notifications.

**Data:**
```javascript
{
  message: string
}
```

## 🏗️ Backend Implementation

### Socket Event Handlers

#### ChatEvents Class
```javascript
// src/socket/events/chatEvents.js
class ChatEvents {
  static async handleMarkMessageAsRead(socket, data) {
    const { messageId, userId, conversationId } = data;
    
    // Update message status in database
    await Message.findByIdAndUpdate(messageId, {
      status: 'read',
      updatedAt: new Date()
    });

    // Emit success response
    socket.emit('messageMarkedAsRead', {
      messageId,
      status: 'read',
      timestamp: new Date().toISOString()
    });

    // Broadcast to other users in the conversation
    socket.to(`conversation_${conversationId}`).emit('messageStatusUpdate', {
      messageId,
      status: 'read',
      userId,
      timestamp: new Date().toISOString()
    });
  }

  static async handleMarkAllMessagesAsRead(socket, data) {
    const { conversationId, userId } = data;
    
    // Mark all unread messages as read
    const result = await Message.updateMany(
      { 
        conversationId: conversationId,
        status: { $in: ['sent', 'delivered'] }
      },
      { 
        status: 'read',
        updatedAt: new Date()
      }
    );

    // Reset conversation unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      unread_messages_count: 0,
      updatedAt: new Date()
    });

    // Emit success response
    socket.emit('allMessagesMarkedAsRead', {
      conversationId,
      messagesUpdated: result.modifiedCount,
      unread_messages_count: 0,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Socket Manager Integration

```javascript
// src/socket/socketManager.js
setupEventHandlers() {
  this.io.on("connection", (socket) => {
    // Read message events
    socket.on("markMessageAsRead", async (data) => {
      await ChatEvents.handleMarkMessageAsRead(socket, data);
    });

    socket.on("markAllMessagesAsRead", async (data) => {
      await ChatEvents.handleMarkAllMessagesAsRead(socket, data);
    });

    socket.on("getUnreadCount", async (data) => {
      await ChatEvents.handleGetUnreadCount(socket, data);
    });

    socket.on("joinConversation", (data) => {
      ChatEvents.handleJoinConversation(socket, data);
    });

    socket.on("leaveConversation", (data) => {
      ChatEvents.handleLeaveConversation(socket, data);
    });
  });
}
```

## 🎨 Frontend Implementation

### Angular Component Integration

```typescript
// ui/src/app/dual-chat/dual-chat.component.ts
export class DualChatComponent {
  // Socket-based read message methods
  async markMessageAsRead(messageId: string, agentType: 'astrologer' | 'contentWriter') {
    if (!messageId || !this.socket) return;

    const conversationId = agentType === 'astrologer' 
      ? this.conversationIds.astrologer 
      : this.conversationIds.contentWriter;

    if (!conversationId) return;

    // Emit socket event
    this.socket.emit('markMessageAsRead', {
      messageId,
      userId: '68d3d06639d8fc6c51c933a3',
      conversationId
    });
  }

  async markAllMessagesAsRead(agentType: 'astrologer' | 'contentWriter') {
    const conversationId = agentType === 'astrologer' 
      ? this.conversationIds.astrologer 
      : this.conversationIds.contentWriter;

    if (!conversationId || !this.socket) return;

    // Emit socket event
    this.socket.emit('markAllMessagesAsRead', {
      conversationId,
      userId: '68d3d06639d8fc6c51c933a3'
    });
  }

  // Socket event listeners
  setupSocketListeners() {
    this.socket.on('messageMarkedAsRead', (data: any) => {
      // Update local message status
      const message = this.findMessageById(data.messageId);
      if (message) {
        message.status = 'read';
      }
    });

    this.socket.on('allMessagesMarkedAsRead', (data: any) => {
      // Update all messages in local history to read
      this.updateAllMessagesToRead(data.conversationId);
      this.unreadCounts[this.getAgentType(data.conversationId)] = 0;
    });

    this.socket.on('messageStatusUpdate', (data: any) => {
      // Real-time message status updates
      this.updateMessageStatus(data.messageId, data.status);
    });
  }
}
```

## 🔄 Real-time Flow

### Message Read Flow

1. **User views message** → Frontend triggers `onMessageView()`
2. **Frontend emits** → `markMessageAsRead` socket event
3. **Backend processes** → Updates database, emits confirmation
4. **Frontend receives** → `messageMarkedAsRead` event
5. **UI updates** → Message status changes to 'read'

### Bulk Read Flow

1. **User clicks "Mark All Read"** → Frontend triggers `markAllMessagesAsRead()`
2. **Frontend emits** → `markAllMessagesAsRead` socket event
3. **Backend processes** → Updates all messages, resets unread count
4. **Frontend receives** → `allMessagesMarkedAsRead` event
5. **UI updates** → All messages marked as read, unread count resets

### Real-time Updates

1. **User A marks message as read** → Backend broadcasts to conversation room
2. **User B receives** → `messageStatusUpdate` event
3. **User B's UI updates** → Message status changes in real-time

## 🧪 Testing

### Test Script
```bash
node test-socket-read-messages.js
```

### Manual Testing

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Connect WebSocket client**:
   ```javascript
   const socket = io('http://localhost:3000');
   ```

3. **Test read message events**:
   ```javascript
   // Get unread count
   socket.emit('getUnreadCount', { userId: 'user123' });
   
   // Mark message as read
   socket.emit('markMessageAsRead', {
     messageId: 'msg123',
     userId: 'user123',
     conversationId: 'conv123'
   });
   
   // Mark all messages as read
   socket.emit('markAllMessagesAsRead', {
     conversationId: 'conv123',
     userId: 'user123'
   });
   ```

4. **Listen for responses**:
   ```javascript
   socket.on('messageMarkedAsRead', (data) => {
     console.log('Message marked as read:', data);
   });
   
   socket.on('allMessagesMarkedAsRead', (data) => {
     console.log('All messages marked as read:', data);
   });
   ```

## 🚀 Advantages of Socket-based Implementation

### Performance Benefits
- **Real-time updates**: Instant message status changes
- **Reduced latency**: No HTTP request/response overhead
- **Efficient broadcasting**: Updates sent to all relevant users
- **Persistent connection**: No connection setup for each operation

### User Experience Benefits
- **Instant feedback**: Immediate visual updates
- **Real-time collaboration**: Multiple users see updates simultaneously
- **Reduced server load**: Fewer HTTP requests
- **Better responsiveness**: No waiting for API responses

### Technical Benefits
- **Event-driven architecture**: Clean separation of concerns
- **Scalable**: Easy to add new real-time features
- **Maintainable**: Centralized event handling
- **Flexible**: Easy to extend with new events

## 🔧 Configuration

### Socket.IO Server Configuration
```javascript
const io = new Server(server, {
  cors: {
    origin: "*", // Configure for production
    methods: ["GET", "POST"]
  }
});
```

### Client Connection
```javascript
const socket = io('http://localhost:3000', { 
  transports: ['websocket'] 
});
```

## 📊 Monitoring

### Connection Statistics
```javascript
// Get connection stats
const stats = socketManager.getStats();
console.log('Total connections:', stats.totalConnections);
console.log('Active sockets:', stats.activeSockets);
```

### Event Monitoring
```javascript
// Log all socket events
socket.onAny((event, ...args) => {
  console.log(`Socket event: ${event}`, args);
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection fails**:
   - Check server is running
   - Verify CORS configuration
   - Check network connectivity

2. **Events not received**:
   - Verify event names match exactly
   - Check data format is correct
   - Ensure proper error handling

3. **Database updates fail**:
   - Check MongoDB connection
   - Verify user permissions
   - Check conversation ownership

### Debug Mode
```javascript
// Enable debug logging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## 🔮 Future Enhancements

### Planned Features
- **Typing indicators**: Real-time typing status
- **Message reactions**: Real-time emoji reactions
- **Presence indicators**: Show who's online
- **Message editing**: Real-time message updates
- **Message deletion**: Real-time message removal

### Advanced Features
- **Message encryption**: End-to-end encryption
- **Message threading**: Reply to specific messages
- **Message forwarding**: Forward messages between conversations
- **Message scheduling**: Schedule messages for later
- **Message search**: Real-time search results

## 📝 API Reference

### Socket Events Summary

| Event | Direction | Purpose |
|-------|------------|---------|
| `getUnreadCount` | Client → Server | Get user's unread count |
| `markMessageAsRead` | Client → Server | Mark single message as read |
| `markAllMessagesAsRead` | Client → Server | Mark all messages as read |
| `joinConversation` | Client → Server | Join conversation room |
| `leaveConversation` | Client → Server | Leave conversation room |
| `unreadCount` | Server → Client | Receive unread count |
| `messageMarkedAsRead` | Server → Client | Message read confirmation |
| `allMessagesMarkedAsRead` | Server → Client | All messages read confirmation |
| `messageStatusUpdate` | Server → Client | Real-time status updates |
| `conversationMarkedAsRead` | Server → Client | Conversation read updates |
| `joinedConversation` | Server → Client | Join confirmation |
| `leftConversation` | Server → Client | Leave confirmation |
| `error` | Server → Client | Error notifications |

## 📞 Support

For issues or questions regarding the socket-based read message implementation, please refer to the main application documentation or contact the development team.

## 🎉 Conclusion

The socket-based read message implementation provides a robust, real-time solution for tracking message read status. With WebSocket channels, users experience instant updates, better performance, and a more responsive chat interface. The event-driven architecture makes it easy to extend with additional real-time features in the future.
