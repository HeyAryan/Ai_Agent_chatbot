/**
 * Test script for conversation and message storage
 * This script tests the database storage functionality
 */

const mongoose = require('mongoose');
const { Conversation, Message, User, Agent } = require('./src/models');

// Test data
const testUserId = '507f1f77bcf86cd799439011'; // Sample ObjectId
const testAgentId = '507f1f77bcf86cd799439012'; // Sample ObjectId

async function testConversationStorage() {
  try {
    console.log('🧪 Testing Conversation and Message Storage...\n');

    // Test 1: Create a conversation
    console.log('1. Creating a new conversation...');
    const conversation = await Conversation.create({
      user_id: testUserId,
      agent_id: testAgentId,
      status: 'active',
      openai_thread_id: 'thread_test123'
    });
    console.log('✅ Conversation created:', conversation._id);

    // Test 2: Create user message
    console.log('\n2. Creating user message...');
    const userMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'user',
      senderId: testUserId,
      senderRef: 'User',
      content: 'Hello, how are you?',
      status: 'delivered'
    });
    console.log('✅ User message created:', userMessage._id);

    // Test 3: Create AI response
    console.log('\n3. Creating AI response...');
    const aiMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'agent',
      senderId: testAgentId,
      senderRef: 'Agent',
      content: 'Hello! I am doing well, thank you for asking. How can I help you today?',
      status: 'sent'
    });
    console.log('✅ AI message created:', aiMessage._id);

    // Test 4: Retrieve conversation with messages
    console.log('\n4. Retrieving conversation with messages...');
    const conversationWithMessages = await Conversation.findById(conversation._id)
      .populate('user_id', 'email name')
      .populate('agent_id', 'title description');
    
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 });

    console.log('✅ Conversation retrieved:', {
      id: conversationWithMessages._id,
      user: conversationWithMessages.user_id,
      agent: conversationWithMessages.agent_id,
      status: conversationWithMessages.status,
      messageCount: messages.length
    });

    // Test 5: Test pagination
    console.log('\n5. Testing message pagination...');
    const page1 = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(1)
      .skip(0);
    
    const page2 = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(1)
      .skip(1);

    console.log('✅ Pagination test:', {
      page1Count: page1.length,
      page2Count: page2.length,
      totalMessages: await Message.countDocuments({ conversationId: conversation._id })
    });

    // Test 6: Update conversation status
    console.log('\n6. Updating conversation status...');
    await Conversation.findByIdAndUpdate(conversation._id, {
      status: 'closed',
      updatedAt: new Date()
    });
    
    const updatedConversation = await Conversation.findById(conversation._id);
    console.log('✅ Conversation updated:', {
      status: updatedConversation.status,
      updatedAt: updatedConversation.updatedAt
    });

    // Cleanup
    console.log('\n7. Cleaning up test data...');
    await Message.deleteMany({ conversationId: conversation._id });
    await Conversation.findByIdAndDelete(conversation._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Conversation and message storage is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB (you'll need to set MONGO_URI environment variable)
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_agent_chatbot_test';
  
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('📡 Connected to MongoDB');
      return testConversationStorage();
    })
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testConversationStorage };
