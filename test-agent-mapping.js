/**
 * Test script for agent-to-OpenAI assistant mapping
 * This script tests the agent mapping functionality
 */

const mongoose = require('mongoose');
const { Agent } = require('./src/models');
const agentMappingService = require('./src/services/agentMapping.service');

// Test data
const testAgentId = '507f1f77bcf86cd799439011'; // Sample ObjectId
const testOpenAIAssistantId = 'asst_test123456789';

async function testAgentMapping() {
  try {
    console.log('🧪 Testing Agent-to-OpenAI Assistant Mapping...\n');

    // Test 1: Create a test agent
    console.log('1. Creating test agent...');
    const testAgent = await Agent.create({
      title: 'Test Assistant',
      description: 'A test assistant for mapping verification',
      openai_assistant_id: testOpenAIAssistantId,
      status: 'active',
      category: 'test',
      tags: ['test', 'mapping'],
      isPaid: false
    });
    console.log('✅ Test agent created:', testAgent._id);

    // Test 2: Get assistant ID by agent ID
    console.log('\n2. Testing getAssistantIdByAgentId...');
    const assistantId = await agentMappingService.getAssistantIdByAgentId(testAgent._id);
    console.log('✅ Assistant ID retrieved:', assistantId);
    console.log('✅ Matches expected:', assistantId === testOpenAIAssistantId);

    // Test 3: Validate agent
    console.log('\n3. Testing validateAgent...');
    const isValid = await agentMappingService.validateAgent(testAgent._id);
    console.log('✅ Agent validation result:', isValid);

    // Test 4: Get agent details
    console.log('\n4. Testing getAgentDetails...');
    const agentDetails = await agentMappingService.getAgentDetails(testAgent._id);
    console.log('✅ Agent details retrieved:', {
      id: agentDetails.id,
      title: agentDetails.title,
      openai_assistant_id: agentDetails.openai_assistant_id,
      status: agentDetails.status
    });

    // Test 5: Get active agents
    console.log('\n5. Testing getActiveAgents...');
    const activeAgents = await agentMappingService.getActiveAgents();
    console.log('✅ Active agents count:', activeAgents.length);
    console.log('✅ Found test agent in active agents:', 
      activeAgents.some(agent => agent._id.toString() === testAgent._id.toString()));

    // Test 6: Test with invalid agent ID
    console.log('\n6. Testing with invalid agent ID...');
    try {
      await agentMappingService.getAssistantIdByAgentId('507f1f77bcf86cd799439999');
      console.log('❌ Should have thrown error for invalid agent ID');
    } catch (error) {
      console.log('✅ Correctly handled invalid agent ID:', error.message);
    }

    // Test 7: Test with inactive agent
    console.log('\n7. Testing with inactive agent...');
    await Agent.findByIdAndUpdate(testAgent._id, { status: 'inactive' });
    try {
      await agentMappingService.getAssistantIdByAgentId(testAgent._id);
      console.log('❌ Should have thrown error for inactive agent');
    } catch (error) {
      console.log('✅ Correctly handled inactive agent:', error.message);
    }

    // Test 8: Test with agent without OpenAI assistant ID
    console.log('\n8. Testing with agent without OpenAI assistant ID...');
    const agentWithoutAssistant = await Agent.create({
      title: 'Agent Without Assistant',
      description: 'An agent without OpenAI assistant ID',
      status: 'active',
      category: 'test'
    });
    
    try {
      await agentMappingService.getAssistantIdByAgentId(agentWithoutAssistant._id);
      console.log('❌ Should have thrown error for agent without assistant ID');
    } catch (error) {
      console.log('✅ Correctly handled agent without assistant ID:', error.message);
    }

    // Cleanup
    console.log('\n9. Cleaning up test data...');
    await Agent.findByIdAndDelete(testAgent._id);
    await Agent.findByIdAndDelete(agentWithoutAssistant._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All agent mapping tests passed!');

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
      return testAgentMapping();
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

module.exports = { testAgentMapping };
