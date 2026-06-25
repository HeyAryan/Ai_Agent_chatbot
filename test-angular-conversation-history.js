/**
 * Test script for Angular UI conversation history functionality
 * This script tests the complete Angular implementation with socket-based conversation history
 */

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';
const TEST_USER_ID = '68d3d06639d8fc6c51c933a3';
const ASTROLOGER_ID = '68d6c436d6b8a27c9fd2506f';
const CONTENT_WRITER_ID = '68cd9c7860ca25527ff42e33';

async function testAngularConversationHistory() {
  try {
    console.log('🧪 Testing Angular UI Conversation History Implementation...\n');

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

    // Test 1: Get user conversations (simulates Angular component initialization)
    console.log('\n1. Testing getUserConversations (Angular ngOnInit)...');
    socket.emit('getUserConversations', { userId: TEST_USER_ID });
    
    socket.on('userConversations', (data) => {
      console.log('✅ User conversations received:', {
        userId: data.userId,
        conversationsCount: data.conversations?.length || 0,
        astrologerConversation: data.conversations?.find(c => c.agent_id._id === ASTROLOGER_ID),
        contentWriterConversation: data.conversations?.find(c => c.agent_id._id === CONTENT_WRITER_ID)
      });
    });

    // Test 2: Get conversation history for astrologer (simulates Angular loadConversationHistory)
    console.log('\n2. Testing getConversationHistory for Astrologer...');
    socket.emit('getConversationHistory', {
      conversationId: '68dabaa6130824c60bc2a77c', // This would be the actual conversation ID
      userId: TEST_USER_ID,
      page: 1,
      limit: 50
    });
    
    socket.on('conversationHistory', (data) => {
      console.log('✅ Astrologer conversation history received:', {
        conversationId: data.conversationId,
        messagesCount: data.messages?.length || 0,
        pagination: data.pagination,
        sampleMessages: data.messages?.slice(0, 3).map(m => ({
          id: m._id,
          sender: m.sender,
          content: m.content?.substring(0, 50) + '...',
          status: m.status,
          createdAt: m.createdAt
        }))
      });
    });

    // Test 3: Get conversation history for content writer
    console.log('\n3. Testing getConversationHistory for Content Writer...');
    socket.emit('getConversationHistory', {
      conversationId: '68dabaa6130824c60bc2a78d', // This would be the actual conversation ID
      userId: TEST_USER_ID,
      page: 1,
      limit: 50
    });

    // Test 4: Test message status updates (simulates Angular message status tracking)
    console.log('\n4. Testing message status updates...');
    socket.on('messageStatusUpdate', (data) => {
      console.log('✅ Message status update received:', {
        messageId: data.messageId,
        status: data.status,
        userId: data.userId
      });
    });

    // Test 5: Test unread count updates
    console.log('\n5. Testing unread count updates...');
    socket.emit('getUnreadCount', { userId: TEST_USER_ID });
    
    socket.on('unreadCount', (data) => {
      console.log('✅ Unread count received:', {
        userId: data.userId,
        totalUnread: data.totalUnread
      });
    });

    // Test 6: Test conversation room management
    console.log('\n6. Testing conversation room management...');
    socket.emit('joinConversation', {
      conversationId: '68dabaa6130824c60bc2a77c',
      userId: TEST_USER_ID
    });
    
    socket.on('joinedConversation', (data) => {
      console.log('✅ Joined conversation room:', data);
    });

    // Test 7: Test error handling
    console.log('\n7. Testing error handling...');
    socket.emit('getConversationHistory', {
      conversationId: 'invalid-conversation-id',
      userId: TEST_USER_ID
    });

    socket.on('error', (data) => {
      console.log('✅ Error received (expected):', data);
    });

    // Keep connection alive for testing
    console.log('\n⏳ Keeping connection alive for 15 seconds to test Angular UI flow...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Disconnect
    socket.disconnect();
    console.log('\n✅ Disconnected from server');

    console.log('\n🎉 Angular UI conversation history tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Angular UI Implementation Guide
function printAngularImplementationGuide() {
  console.log('\n📋 Angular UI Implementation Guide:');
  console.log('==================================');
  
  console.log('\n🎯 Angular Component Features:');
  console.log('1. Automatic Conversation Loading');
  console.log('   - ngOnInit() calls loadConversations()');
  console.log('   - Socket emits getUserConversations');
  console.log('   - Component receives userConversations event');
  console.log('   - Automatically loads conversation history');
  
  console.log('\n2. Conversation History Management');
  console.log('   - loadConversationHistory() method for each agent');
  console.log('   - loadAllConversationHistory() for both agents');
  console.log('   - refreshConversationHistory() for manual refresh');
  console.log('   - refreshAllConversationHistory() for global refresh');
  
  console.log('\n3. UI Controls');
  console.log('   - "Refresh History" buttons for each agent');
  console.log('   - "🔄 Refresh All History" button in header');
  console.log('   - Automatic history loading on component init');
  console.log('   - Real-time message status updates');
  
  console.log('\n4. Socket Event Integration');
  console.log('   - getUserConversations → userConversations');
  console.log('   - getConversationHistory → conversationHistory');
  console.log('   - getUnreadCount → unreadCount');
  console.log('   - markMessageAsRead → messageMarkedAsRead');
  console.log('   - markAllMessagesAsRead → allMessagesMarkedAsRead');
  
  console.log('\n5. Real-time Features');
  console.log('   - Automatic conversation history loading');
  console.log('   - Real-time message status updates');
  console.log('   - Unread count tracking');
  console.log('   - Message read status indicators');
  console.log('   - Auto-scroll to bottom after loading history');
  
  console.log('\n6. Error Handling');
  console.log('   - Socket error handling');
  console.log('   - Connection status indicators');
  console.log('   - Graceful fallbacks for missing conversations');
  
  console.log('\n7. Performance Optimizations');
  console.log('   - Pagination support for large histories');
  console.log('   - Efficient message loading');
  console.log('   - Auto-scroll optimization');
  console.log('   - Memory management for chat history');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAngularConversationHistory()
    .then(() => {
      printAngularImplementationGuide();
      console.log('\n✅ Angular UI conversation history implementation test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAngularConversationHistory, printAngularImplementationGuide };
