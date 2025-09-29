const { Message, Conversation, User, Agent } = require('../models');
const agentMappingService = require('./agentMapping.service');

/**
 * Socket service for handling chat-related business logic
 */
class SocketService {
  /**
   * Process incoming chat message
   * @param {Object} data - Message data from client
   * @param {string} data.userId - User identifier
   * @param {string} data.agentId - Agent identifier
   * @param {string} data.message - Message content
   * @returns {Object} Processed message response
   */
  async processMessage(data) {
    try {
      console.log("Processing message:", data.message);

      // Get OpenAI assistant ID from agent mapping service
      const assistantId = await agentMappingService.getAssistantIdByAgentId(data.agentId);
      console.log(`Using OpenAI assistant ID: ${assistantId} for agent: ${data.agentId}`);

      // Find or create conversation
      let conversation = await this.findOrCreateConversation(data.userId, data.agentId);
      
      // OpenAI task integration - simplified approach
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      console.log("Sending message to OpenAI...");
      let threadId = null;
      if(data.threadId){
        console.log("already have threadId:",data.threadId);
        threadId = data.threadId;
      } else if (conversation.openai_thread_id) {
        console.log("Using existing thread from conversation:", conversation.openai_thread_id);
        threadId = conversation.openai_thread_id;
      } else {
        // Create thread
        const thread = await client.beta.threads.create();
        threadId = thread.id;
        // Update conversation with thread ID
        await Conversation.findByIdAndUpdate(conversation._id, { 
          openai_thread_id: threadId 
        });
      }
      
      console.log("Thread created:", threadId);
      
      // Add message
      await client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: data.message
      });
      console.log("Message added to thread");
      
      // Create run using the OpenAI assistant ID from agent
      const run = await client.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      });
      console.log("Run created:", run.id);
      
      // Poll for completion
      let runStatus = run.status;
      while (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'cancelled') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedRun = await client.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
        runStatus = updatedRun.status;
        console.log("Run status:", runStatus);
      }
      
      // Get messages
      const messages = await client.beta.threads.messages.list(threadId);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      
      let aiResponse = "Sorry, I couldn't generate a response.";
      if (assistantMessage && assistantMessage.content && assistantMessage.content.length > 0) {
        const textContent = assistantMessage.content.find(c => c.type === 'text');
        if (textContent && textContent.text) {
          aiResponse = textContent.text.value;
        }
      }
      
      console.log("OpenAI response received:", aiResponse);

      // Save both user message and AI response to database
      await this.saveMessages(conversation._id, data.userId, data.agentId, data.message, aiResponse);

      const chatMessage = {
        status: "ok",
        message: aiResponse, // ✅ Now using actual AI response
        userId: data.userId,
        agentId: data.agentId,
        threadId: threadId,
        conversationId: conversation._id,
        serverTime: new Date().toISOString()
      };

      return chatMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Handle agent-related errors
      if (error.message.includes('Agent not found') || error.message.includes('OpenAI assistant ID')) {
        console.error('Agent Error:', error.message);
        return {
          status: "error",
          message: "Selected agent is not available or not properly configured.",
          userId: data.userId,
          agentId: data.agentId,
          serverTime: new Date().toISOString()
        };
      }
      
      // Handle specific OpenAI errors
      if (error.name === 'OpenAIError') {
        console.error('OpenAI API Error:', error.message);
        return {
          status: "error",
          message: "AI service is temporarily unavailable. Please try again in a moment.",
          userId: data.userId,
          agentId: data.agentId,
          serverTime: new Date().toISOString()
        };
      }
      
      // Handle network/timeout errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error('Network Error:', error.message);
        return {
          status: "error",
          message: "Unable to connect to AI service. Please check your connection and try again.",
          userId: data.userId,
          agentId: data.agentId,
          serverTime: new Date().toISOString()
        };
      }
      
      // Generic error fallback
      return {
        status: "error",
        message: "Sorry, something went wrong. Please try again.",
        userId: data.userId,
        agentId: data.agentId,
        serverTime: new Date().toISOString()
      };
    }
  }

  /**
   * Find or create conversation for user and agent
   * @param {string} userId - User ID
   * @param {string} agentId - Agent ID
   * @returns {Object} Conversation object
   */
  async findOrCreateConversation(userId, agentId) {
    try {
      // Validate agent exists and is properly configured
      const isValidAgent = await agentMappingService.validateAgent(agentId);
      if (!isValidAgent) {
        throw new Error(`Invalid agent ID: ${agentId}`);
      }

      // Try to find existing active conversation
      let conversation = await Conversation.findOne({
        user_id: userId,
        agent_id: agentId,
        status: 'active'
      }).exec();

      if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
          user_id: userId,
          agent_id: agentId,
          status: 'active'
        });
        console.log('Created new conversation:', conversation._id);
      } else {
        console.log('Found existing conversation:', conversation._id);
      }

      return conversation;
    } catch (error) {
      console.error('Error finding/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Save both user message and AI response to database
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {string} agentId - Agent ID
   * @param {string} userMessage - User's message
   * @param {string} aiResponse - AI's response
   */
  async saveMessages(conversationId, userId, agentId, userMessage, aiResponse) {
    try {
      const now = new Date();
      
      // Save user message
      const userMsg = await Message.create({
        conversationId: conversationId,
        sender: 'user',
        senderId: userId,
        senderRef: 'User',
        content: userMessage,
        status: 'delivered' // User messages are delivered immediately
      });

      // Update conversation with user message details
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          last_message_text: userMessage,
          last_message_send_by: 'User',
          last_message_timestamp: now,
          updatedAt: now
        }
        // No $inc for user messages - unread count only increases for system messages
      });

      // Save AI response
      const aiMsg = await Message.create({
        conversationId: conversationId,
        sender: 'agent',
        senderId: agentId,
        senderRef: 'Agent',
        content: aiResponse,
        status: 'sent' // AI messages start as 'sent' and need to be marked as 'read'
      });

      // Update conversation with AI response details
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          last_message_text: aiResponse,
          last_message_send_by: 'System',
          last_message_timestamp: now,
          updatedAt: now
        },
        $inc: { unread_messages_count: 1 } // Increment unread count
      });

      console.log('Messages saved:', { userMsg: userMsg._id, aiMsg: aiMsg._id });
      console.log('Conversation updated with new message details');
      return { userMsg, aiMsg };
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }

  /**
   * Update conversation with single message (for cases where only user message is sent)
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @param {string} userMessage - User's message
   */
  async updateConversationWithUserMessage(conversationId, userId, userMessage) {
    try {
      const now = new Date();
      
      // Update conversation with user message details
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          last_message_text: userMessage,
          last_message_send_by: 'User',
          last_message_timestamp: now,
          updatedAt: now
        }
        // No $inc for user messages - unread count only increases for system messages
      });

      console.log('Conversation updated with user message');
    } catch (error) {
      console.error('Error updating conversation with user message:', error);
      throw error;
    }
  }

  /**
   * Update conversation with AI response
   * @param {string} conversationId - Conversation ID
   * @param {string} aiResponse - AI's response
   */
  async updateConversationWithAIResponse(conversationId, aiResponse) {
    try {
      const now = new Date();
      
      // Update conversation with AI response details
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          last_message_text: aiResponse,
          last_message_send_by: 'System',
          last_message_timestamp: now,
          updatedAt: now
        },
        $inc: { unread_messages_count: 1 } // Increment unread count
      });

      console.log('Conversation updated with AI response');
    } catch (error) {
      console.error('Error updating conversation with AI response:', error);
      throw error;
    }
  }

  /**
   * Validate incoming message data
   * @param {Object} data - Message data to validate
   * @returns {boolean} Whether data is valid
   */
  validateMessageData(data) {
    return data && 
           typeof data.userId === 'string' && 
           data.userId.trim().length > 0 &&
           typeof data.message === 'string' && 
           data.message.trim().length > 0 &&
           typeof data.agentId === 'string' && 
           data.agentId.trim().length > 0;
  }
}

module.exports = new SocketService();
