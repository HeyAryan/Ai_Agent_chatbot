# WebSocket Channels Documentation

## Overview
Complete documentation of all WebSocket channels, their payloads, and return data structures.

---

## 🔌 Client Events (Emit)

### 1. Connection & Registration

#### `register`
**Purpose:** Register client connection
```javascript
socket.emit('register', connectionId);
```
**Data:** `string` - Connection ID

---

### 2. Chat Messages

#### `message`
**Purpose:** Send chat message to AI assistant
```javascript
socket.emit('message', {
  message: string,      // User's message
  agentId: string,      // Agent ID
  userId: string,       // User ID
  threadId?: string     // Optional thread ID
});
```

---

### 3. Read Message Management

#### `getUnreadCount`
**Purpose:** Get total unread count for user
```javascript
socket.emit('getUnreadCount', {
  userId: string
});
```

#### `markMessageAsRead`
**Purpose:** Mark single message as read
```javascript
socket.emit('markMessageAsRead', {
  messageId: string,
  userId: string,
  conversationId: string
});
```

#### `markAllMessagesAsRead`
**Purpose:** Mark all messages in conversation as read
```javascript
socket.emit('markAllMessagesAsRead', {
  conversationId: string,
  userId: string
});
```

---

### 4. Conversation Management

#### `getUserConversations`
**Purpose:** Get user's conversation list
```javascript
socket.emit('getUserConversations', {
  userId: string
});
```

#### `getConversationHistory`
**Purpose:** Get conversation message history
```javascript
socket.emit('getConversationHistory', {
  conversationId: string,
  userId: string,
  page?: number,        // Default: 1
  limit?: number        // Default: 50
});
```

#### `getConversationDetails`
**Purpose:** Get detailed conversation information
```javascript
socket.emit('getConversationDetails', {
  conversationId: string,
  userId: string
});
```

---

### 5. Room Management

#### `joinConversation`
**Purpose:** Join conversation room for real-time updates
```javascript
socket.emit('joinConversation', {
  conversationId: string,
  userId: string
});
```

#### `leaveConversation`
**Purpose:** Leave conversation room
```javascript
socket.emit('leaveConversation', {
  conversationId: string,
  userId: string
});
```

#### `joinRoom`
**Purpose:** Join general chat room
```javascript
socket.emit('joinRoom', {
  roomId: string,
  user: string
});
```

#### `leaveRoom`
**Purpose:** Leave general chat room
```javascript
socket.emit('leaveRoom', {
  roomId: string,
  user: string
});
```

---

### 6. Typing Indicators

#### `typing`
**Purpose:** Send typing indicator
```javascript
socket.emit('typing', {
  user: string,
  isTyping: boolean,
  roomId?: string
});
```

---

## 📡 Server Events (Listen)

### 1. Connection & Registration

#### `registered`
**Purpose:** Confirm successful registration
```javascript
socket.on('registered', (data) => {
  // data = {
  //   connectionId: string,
  //   socketId: string,
  //   status: string
  // }
});
```

---

### 2. Chat Messages

#### `messageResponse`
**Purpose:** Receive AI assistant response
```javascript
socket.on('messageResponse', (data) => {
  // data = {
  //   status: "ok" | "error",
  //   message: string,
  //   userId: string,
  //   agentId: string,
  //   threadId: string,
  //   serverTime: string,
  //   messageId?: string,
  //   conversationId?: string
  // }
});
```

---

### 3. Read Message Management

#### `unreadCount`
**Purpose:** Receive unread count for user
```javascript
socket.on('unreadCount', (data) => {
  // data = {
  //   userId: string,
  //   totalUnread: number,
  //   timestamp: string
  // }
});
```

#### `messageMarkedAsRead`
**Purpose:** Confirm message marked as read
```javascript
socket.on('messageMarkedAsRead', (data) => {
  // data = {
  //   messageId: string,
  //   status: string,
  //   timestamp: string
  // }
});
```

#### `allMessagesMarkedAsRead`
**Purpose:** Confirm all messages marked as read
```javascript
socket.on('allMessagesMarkedAsRead', (data) => {
  // data = {
  //   conversationId: string,
  //   messagesUpdated: number,
  //   unread_messages_count: number,
  //   timestamp: string
  // }
});
```

#### `messageStatusUpdate`
**Purpose:** Real-time message status updates
```javascript
socket.on('messageStatusUpdate', (data) => {
  // data = {
  //   messageId: string,
  //   status: string,
  //   userId: string,
  //   timestamp: string
  // }
});
```

#### `conversationMarkedAsRead`
**Purpose:** Real-time conversation read status updates
```javascript
socket.on('conversationMarkedAsRead', (data) => {
  // data = {
  //   conversationId: string,
  //   userId: string,
  //   unread_messages_count: number,
  //   timestamp: string
  // }
});
```

---

### 4. Conversation Management

#### `userConversations`
**Purpose:** Receive user's conversation list
```javascript
socket.on('userConversations', (data) => {
  // data = {
  //   userId: string,
  //   conversations: [
  //     {
  //       _id: string,
  //       user_id: string,
  //       agent_id: {
  //         _id: string,
  //         title: string,
  //         description: string,
  //         icon: string,
  //         color: string
  //       },
  //       last_message_text: string,
  //       last_message_send_by: string,
  //       unread_messages_count: number,
  //       last_message_timestamp: string,
  //       status: string,
  //       pinned: boolean
  //     }
  //   ],
  //   timestamp: string
  // }
});
```

#### `conversationHistory`
**Purpose:** Receive conversation message history
```javascript
socket.on('conversationHistory', (data) => {
  // data = {
  //   conversationId: string,
  //   messages: [
  //     {
  //       _id: string,
  //       conversationId: string,
  //       sender: string,
  //       senderId: string,
  //       content: string,
  //       status: string,
  //       createdAt: string,
  //       updatedAt: string
  //     }
  //   ],
  //   pagination: {
  //     page: number,
  //     limit: number,
  //     total: number,
  //     pages: number
  //   },
  //   timestamp: string
  // }
});
```

#### `conversationDetails`
**Purpose:** Receive detailed conversation information
```javascript
socket.on('conversationDetails', (data) => {
  // data = {
  //   conversationId: string,
  //   conversation: {
  //     _id: string,
  //     user_id: string,
  //     agent_id: {
  //       _id: string,
  //       title: string,
  //       description: string,
  //       icon: string,
  //       color: string,
  //       openai_assistant_id: string
  //     },
  //     openai_thread_id: string,
  //     status: string,
  //     pinned: boolean,
  //     last_message_text: string,
  //     last_message_send_by: string,
  //     unread_messages_count: number,
  //     last_message_timestamp: string
  //   },
  //   timestamp: string
  // }
});
```

---

### 5. Room Management

#### `joinedConversation`
**Purpose:** Confirm joining conversation room
```javascript
socket.on('joinedConversation', (data) => {
  // data = {
  //   conversationId: string,
  //   status: string,
  //   timestamp: string
  // }
});
```

#### `leftConversation`
**Purpose:** Confirm leaving conversation room
```javascript
socket.on('leftConversation', (data) => {
  // data = {
  //   conversationId: string,
  //   status: string,
  //   timestamp: string
  // }
});
```

#### `joinedRoom`
**Purpose:** Confirm joining general room
```javascript
socket.on('joinedRoom', (data) => {
  // data = {
  //   roomId: string,
  //   status: string,
  //   timestamp: string
  // }
});
```

#### `leftRoom`
**Purpose:** Confirm leaving general room
```javascript
socket.on('leftRoom', (data) => {
  // data = {
  //   roomId: string,
  //   status: string,
  //   timestamp: string
  // }
});
```

#### `userJoined`
**Purpose:** Notify when user joins room
```javascript
socket.on('userJoined', (data) => {
  // data = {
  //   user: string,
  //   roomId: string,
  //   timestamp: string
  // }
});
```

#### `userLeft`
**Purpose:** Notify when user leaves room
```javascript
socket.on('userLeft', (data) => {
  // data = {
  //   user: string,
  //   roomId: string,
  //   timestamp: string
  // }
});
```

---

### 6. Typing Indicators

#### `userTyping`
**Purpose:** Receive typing indicator from other users
```javascript
socket.on('userTyping', (data) => {
  // data = {
  //   user: string,
  //   isTyping: boolean,
  //   timestamp: string
  // }
});
```

---

### 7. Error Handling

#### `error`
**Purpose:** Handle various error conditions
```javascript
socket.on('error', (data) => {
  // data = {
  //   message: string
  // }
});
```

---

## 📊 Data Types

### Message Status
- `"sent"` - Message sent successfully
- `"delivered"` - Message delivered to recipient
- `"read"` - Message read by recipient

### Conversation Status
- `"active"` - Active conversation
- `"archived"` - Archived conversation
- `"deleted"` - Deleted conversation

### Last Message Sender
- `"User"` - Last message sent by user
- `"System"` - Last message sent by AI system

---

## 🔄 Common Flow Examples

### 1. Send Message Flow
```javascript
// 1. Send message
socket.emit('message', {
  message: 'Hello!',
  agentId: 'agent-123',
  userId: 'user-456'
});

// 2. Receive response
socket.on('messageResponse', (data) => {
  console.log('AI Response:', data.message);
});
```

### 2. Load Conversation History Flow
```javascript
// 1. Get user conversations
socket.emit('getUserConversations', { userId: 'user-456' });

// 2. Receive conversations
socket.on('userConversations', (data) => {
  // 3. Load history for specific conversation
  socket.emit('getConversationHistory', {
    conversationId: data.conversations[0]._id,
    userId: 'user-456'
  });
});

// 4. Receive history
socket.on('conversationHistory', (data) => {
  console.log('Messages:', data.messages);
});
```

### 3. Mark Messages as Read Flow
```javascript
// 1. Mark all messages as read
socket.emit('markAllMessagesAsRead', {
  conversationId: 'conv-123',
  userId: 'user-456'
});

// 2. Receive confirmation
socket.on('allMessagesMarkedAsRead', (data) => {
  console.log('Messages updated:', data.messagesUpdated);
});
```

---

## 🚀 Quick Reference

### Essential Events for Chat App
- `message` → `messageResponse`
- `getUserConversations` → `userConversations`
- `getConversationHistory` → `conversationHistory`
- `markAllMessagesAsRead` → `allMessagesMarkedAsRead`
- `getUnreadCount` → `unreadCount`

### Real-time Updates
- `messageStatusUpdate` - Message status changes
- `conversationMarkedAsRead` - Conversation read status
- `userTyping` - Typing indicators
- `userJoined` / `userLeft` - User presence

### Error Handling
- Always listen for `error` events
- Check `status` field in responses
- Handle connection failures gracefully
