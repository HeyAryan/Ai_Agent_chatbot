const { Message } = require('../models');
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

      // OpenAI task integration - simplified approach
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      console.log("Sending message to OpenAI...");
      let threadId = null;
      if(data.threadId){
        console.log("already have threadId:",data.threadId);
        threadId = data.threadId;
      }else{
        // Create thread
        const thread = await client.beta.threads.create();
        threadId = thread.id;
      }
      
      console.log("Thread created:", threadId);
      
      // Add message
      await client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: data.message
      });
      console.log("Message added to thread");
      
      // Create run
      const run = await client.beta.threads.runs.create(threadId, {
        assistant_id: process.env.ASTROLOGER_ASSISTANT_ID
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

      const chatMessage = {
        status: "ok",
        message: aiResponse, // ✅ Now using actual AI response
        userId: data.userId,
        agentId: data.agentId,
        threadId: threadId,
        serverTime: new Date().toISOString()
      };

      // TODO: Save message to database if needed
      // await this.saveMessage(data, chatMessage);

      return chatMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      
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
   * Save message to database
   * @param {Object} originalData - Original message data
   * @param {Object} responseData - Response message data
   */
  async saveMessage(originalData, responseData) {
    try {
      // TODO: Implement message saving logic
      // This could save both user message and AI response
      console.log('Saving message to database:', { originalData, responseData });
    } catch (error) {
      console.error('Error saving message:', error);
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
