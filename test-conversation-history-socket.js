/**
 * Test script for socket-based conversation history functionality
 * This script tests the WebSocket implementation for conversation history
 */

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';
const TEST_USER_ID = '68d3d06639d8fc6c51c933a3';
const TEST_CONVERSATION_ID = '68dabaa6130824c60bc2a77c';

async function testConversationHistorySocket() {
  try {
    console.log('🧪 Testing Socket-based Conversation History Functionality...\n');

    // Connect to the server
    const socket = io(SERVER_URL, { transports: ['websocket'] });

    // Wait for connection
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('✅ Connected to server');
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error.message);
        reject(error);
      });
      
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });

    // Test 1: Get user conversations
    console.log('\n1. Testing getUserConversations...');
    socket.emit('getUserConversations', { userId: TEST_USER_ID });
    
    socket.on('userConversations', (data) => {
      console.log('✅ User conversations received:', {
        userId: data.userId,
        conversationsCount: data.conversations?.length || 0,
        conversations: data.conversations?.map(c => ({
          id: c._id,
          agent: c.agent_id?.title,
          unreadCount: c.unread_messages_count,
          lastMessage: c.last_message_text
        }))
      });
    });

    // Test 2: Get conversation history
    console.log('\n2. Testing getConversationHistory...');
    socket.emit('getConversationHistory', {
      conversationId: TEST_CONVERSATION_ID,
      userId: TEST_USER_ID,
      page: 1,
      limit: 20
    });
    
    socket.on('conversationHistory', (data) => {
      console.log('✅ Conversation history received:', {
        conversationId: data.conversationId,
        messagesCount: data.messages?.length || 0,
        pagination: data.pagination,
        messages: data.messages?.slice(0, 3).map(m => ({
          id: m._id,
          sender: m.sender,
          content: m.content?.substring(0, 50) + '...',
          status: m.status,
          createdAt: m.createdAt
        }))
      });
    });

    // Test 3: Get conversation details
    console.log('\n3. Testing getConversationDetails...');
    socket.emit('getConversationDetails', {
      conversationId: TEST_CONVERSATION_ID,
      userId: TEST_USER_ID
    });
    
    socket.on('conversationDetails', (data) => {
      console.log('✅ Conversation details received:', {
        conversationId: data.conversationId,
        agent: data.conversation?.agent_id?.title,
        unreadCount: data.conversation?.unread_messages_count,
        lastMessage: data.conversation?.last_message_text,
        status: data.conversation?.status
      });
    });

    // Test 4: Join conversation room
    console.log('\n4. Testing joinConversation...');
    socket.emit('joinConversation', {
      conversationId: TEST_CONVERSATION_ID,
      userId: TEST_USER_ID
    });
    
    socket.on('joinedConversation', (data) => {
      console.log('✅ Joined conversation:', data);
    });

    // Test 5: Error handling
    console.log('\n5. Testing error handling...');
    socket.emit('getConversationHistory', {
      conversationId: 'invalid-conversation-id',
      userId: TEST_USER_ID
    });

    socket.on('error', (data) => {
      console.log('✅ Error received (expected):', data);
    });

    // Keep connection alive for testing
    console.log('\n⏳ Keeping connection alive for 10 seconds to test real-time updates...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Disconnect
    socket.disconnect();
    console.log('\n✅ Disconnected from server');

    console.log('\n🎉 Socket-based conversation history tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Socket Event Documentation
function printConversationHistoryDocumentation() {
  console.log('\n📋 Conversation History Socket Events:');
  console.log('=====================================');
  
  console.log('\n📤 Client Events (emit):');
  console.log('1. getUserConversations');
  console.log('   Data: { userId: string }');
  console.log('   Purpose: Get user\'s conversation list with agent details');
  
  console.log('\n2. getConversationHistory');
  console.log('   Data: { conversationId: string, userId: string, page?: number, limit?: number }');
  console.log('   Purpose: Get conversation message history with pagination');
  
  console.log('\n3. getConversationDetails');
  console.log('   Data: { conversationId: string, userId: string }');
  console.log('   Purpose: Get detailed conversation information');
  
  console.log('\n4. joinConversation');
  console.log('   Data: { conversationId: string, userId: string }');
  console.log('   Purpose: Join conversation room for real-time updates');
  
  console.log('\n5. leaveConversation');
  console.log('   Data: { conversationId: string, userId: string }');
  console.log('   Purpose: Leave conversation room');
  
  console.log('\n📥 Server Events (listen):');
  console.log('1. userConversations');
  console.log('   Data: { userId: string, conversations: Array, timestamp: string }');
  console.log('   Purpose: Receive user\'s conversation list');
  
  console.log('\n2. conversationHistory');
  console.log('   Data: { conversationId: string, messages: Array, pagination: Object, timestamp: string }');
  console.log('   Purpose: Receive conversation message history');
  
  console.log('\n3. conversationDetails');
  console.log('   Data: { conversationId: string, conversation: Object, timestamp: string }');
  console.log('   Purpose: Receive detailed conversation information');
  
  console.log('\n4. joinedConversation');
  console.log('   Data: { conversationId: string, status: string, timestamp: string }');
  console.log('   Purpose: Confirmation of joining conversation room');
  
  console.log('\n5. leftConversation');
  console.log('   Data: { conversationId: string, status: string, timestamp: string }');
  console.log('   Purpose: Confirmation of leaving conversation room');
  
  console.log('\n6. error');
  console.log('   Data: { message: string }');
  console.log('   Purpose: Error notifications');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConversationHistorySocket()
    .then(() => {
      printConversationHistoryDocumentation();
      console.log('\n✅ Socket-based conversation history functionality test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testConversationHistorySocket, printConversationHistoryDocumentation };

