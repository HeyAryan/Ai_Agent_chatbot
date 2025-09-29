const { User, Message, MessagePack } = require('../models');
const createError = require('http-errors');
const config = require('../config');

/**
 * Check if user has available message credits for an agent
 * @param {string} userId - User ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Credit information
 */
async function checkUserMessageCredits(userId, agentId) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		// Get or initialize credits for this agent
		let agentCredits = user.messageCredits.get(agentId);
		if (!agentCredits) {
			// Initialize with free messages from config
			agentCredits = {
				freeMessages: config.messages.freeMessagesPerAgent,
				purchasedMessages: 0,
				usedMessages: 0
			};
			user.messageCredits.set(agentId, agentCredits);
			await user.save();
		}

		const totalAvailable = agentCredits.freeMessages + agentCredits.purchasedMessages;
		const remaining = totalAvailable - agentCredits.usedMessages;

		return {
			hasCredits: remaining > 0,
			remaining: Math.max(0, remaining),
			credits: agentCredits
		};
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to check message credits: ${error.message}`);
	}
}

/**
 * Deduct message credit when user sends a message
 * @param {string} userId - User ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Updated credit information
 */
async function deductMessageCredit(userId, agentId) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		// Get or initialize credits for this agent
		let agentCredits = user.messageCredits.get(agentId);
		if (!agentCredits) {
			agentCredits = {
				freeMessages: config.messages.freeMessagesPerAgent,
				purchasedMessages: 0,
				usedMessages: 0
			};
		}

		const totalAvailable = agentCredits.freeMessages + agentCredits.purchasedMessages;
		const remaining = totalAvailable - agentCredits.usedMessages;

		if (remaining <= 0) {
			throw createError(402, 'Insufficient message credits. Please purchase more messages.');
		}

		// Deduct one message credit
		agentCredits.usedMessages += 1;
		user.messageCredits.set(agentId, agentCredits);
		await user.save();

		return {
			remaining: Math.max(0, totalAvailable - agentCredits.usedMessages),
			credits: agentCredits
		};
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to deduct message credit: ${error.message}`);
	}
}

/**
 * Add purchased messages to user's account
 * @param {string} userId - User ID
 * @param {string} messagePackId - Message Pack ID
 * @param {number} quantity - Number of packs purchased
 * @returns {Promise<Object>} Updated user information
 */
async function addPurchasedMessages(userId, messagePackId, quantity = 1) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		const messagePack = await MessagePack.findById(messagePackId);
		if (!messagePack) {
			throw createError(404, 'Message pack not found');
		}

		const totalMessages = messagePack.messageCount * quantity;

		// Add to user's purchased message packs
		const purchasedPack = {
			packId: messagePackId,
			quantity: quantity,
			purchaseDate: new Date(),
			expiryDate: messagePack.validityDays ? 
				new Date(Date.now() + messagePack.validityDays * 24 * 60 * 60 * 1000) : 
				null,
			used: 0
		};

		user.purchasedMessagePacks.push(purchasedPack);
		await user.save();

		return {
			user,
			addedMessages: totalMessages,
			messagePack: messagePack
		};
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to add purchased messages: ${error.message}`);
	}
}

/**
 * Get user's message usage statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Usage statistics
 */
async function getUserMessageStats(userId) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		const stats = {
			totalAgents: user.messageCredits.size,
			totalFreeMessages: 0,
			totalPurchasedMessages: 0,
			totalUsedMessages: 0,
			agentBreakdown: {}
		};

		// Calculate stats for each agent
		for (const [agentId, credits] of user.messageCredits) {
			stats.totalFreeMessages += credits.freeMessages;
			stats.totalPurchasedMessages += credits.purchasedMessages;
			stats.totalUsedMessages += credits.usedMessages;

			const totalAvailable = credits.freeMessages + credits.purchasedMessages;
			const remaining = totalAvailable - credits.usedMessages;

			stats.agentBreakdown[agentId] = {
				freeMessages: credits.freeMessages,
				purchasedMessages: credits.purchasedMessages,
				usedMessages: credits.usedMessages,
				totalAvailable,
				remaining: Math.max(0, remaining)
			};
		}

		// Add purchased packs info
		stats.purchasedPacks = user.purchasedMessagePacks;

		return stats;
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to get message stats: ${error.message}`);
	}
}

/**
 * Initialize message credits for a new agent interaction
 * @param {string} userId - User ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Initialized credits
 */
async function initializeAgentCredits(userId, agentId) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		// Check if credits already exist for this agent
		let agentCredits = user.messageCredits.get(agentId);
		if (!agentCredits) {
			// Initialize with free messages from config
			agentCredits = {
				freeMessages: config.messages.freeMessagesPerAgent,
				purchasedMessages: 0,
				usedMessages: 0
			};
			user.messageCredits.set(agentId, agentCredits);
			await user.save();
		}

		return agentCredits;
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to initialize agent credits: ${error.message}`);
	}
}

/**
 * Transfer purchased messages to agent-specific credits
 * @param {string} userId - User ID
 * @param {string} agentId - Agent ID
 * @param {number} messageCount - Number of messages to transfer
 * @returns {Promise<Object>} Updated credits
 */
async function transferMessagesToAgent(userId, agentId, messageCount) {
	try {
		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		// Get or initialize credits for this agent
		let agentCredits = user.messageCredits.get(agentId);
		if (!agentCredits) {
			agentCredits = {
				freeMessages: config.messages.freeMessagesPerAgent,
				purchasedMessages: 0,
				usedMessages: 0
			};
		}

		// Add purchased messages
		agentCredits.purchasedMessages += messageCount;
		user.messageCredits.set(agentId, agentCredits);
		await user.save();

		return agentCredits;
	} catch (error) {
		if (error.status) throw error;
		throw createError(500, `Failed to transfer messages to agent: ${error.message}`);
	}
}

module.exports = {
	checkUserMessageCredits,
	deductMessageCredit,
	addPurchasedMessages,
	getUserMessageStats,
	initializeAgentCredits,
	transferMessagesToAgent
};
