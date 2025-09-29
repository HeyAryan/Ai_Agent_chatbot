const { Agent } = require('../models');

/**
 * Service for managing agent-to-OpenAI assistant mapping
 */
class AgentMappingService {
  /**
   * Get OpenAI assistant ID by agent ID
   * @param {string} agentId - Agent ID
   * @returns {Promise<string>} OpenAI assistant ID
   */
  async getAssistantIdByAgentId(agentId) {
    try {
      const agent = await Agent.findById(agentId).exec();
      
      if (!agent) {
        throw new Error(`Agent not found with ID: ${agentId}`);
      }
      
      if (!agent.openai_assistant_id) {
        throw new Error(`Agent ${agent.title} does not have OpenAI assistant ID configured`);
      }
      
      if (agent.status !== 'active') {
        throw new Error(`Agent ${agent.title} is not active`);
      }
      
      return agent.openai_assistant_id;
    } catch (error) {
      console.error('Error getting assistant ID:', error);
      throw error;
    }
  }

  /**
   * Validate agent exists and is properly configured
   * @param {string} agentId - Agent ID
   * @returns {Promise<boolean>} Whether agent is valid
   */
  async validateAgent(agentId) {
    try {
      const agent = await Agent.findById(agentId).exec();
      
      if (!agent) {
        return false;
      }
      
      if (!agent.openai_assistant_id) {
        return false;
      }
      
      if (agent.status !== 'active') {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating agent:', error);
      return false;
    }
  }

  /**
   * Get agent details by ID
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Agent details
   */
  async getAgentDetails(agentId) {
    try {
      const agent = await Agent.findById(agentId).exec();
      
      if (!agent) {
        throw new Error(`Agent not found with ID: ${agentId}`);
      }
      
      return {
        id: agent._id,
        title: agent.title,
        description: agent.description,
        openai_assistant_id: agent.openai_assistant_id,
        status: agent.status,
        isPaid: agent.isPaid,
        category: agent.category,
        tags: agent.tags
      };
    } catch (error) {
      console.error('Error getting agent details:', error);
      throw error;
    }
  }

  /**
   * Get all active agents
   * @returns {Promise<Array>} List of active agents
   */
  async getActiveAgents() {
    try {
      const agents = await Agent.find({ 
        status: 'active',
        openai_assistant_id: { $exists: true, $ne: null }
      }).select('title description openai_assistant_id category tags isPaid').exec();
      
      return agents;
    } catch (error) {
      console.error('Error getting active agents:', error);
      throw error;
    }
  }
}

module.exports = new AgentMappingService();
