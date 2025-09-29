const createError = require('http-errors');
const { MessagePack, User, Payment } = require('../models');
const paymentService = require('../services/payment.service');
const config = require('../config');

/**
 * Get all available message packs
 * GET /message-packs
 */
async function getMessagePacks(req, res, next) {
	try {
		const { active = true } = req.query;
		
		const query = {};
		if (active !== undefined) {
			query.isActive = active === 'true';
		}

		const messagePacks = await MessagePack.find(query)
			.sort({ displayOrder: 1, price: 1 })
			.select('-__v');

		return res.status(200).json({
			success: true,
			data: messagePacks
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Get a specific message pack by ID
 * GET /message-packs/:packId
 */
async function getMessagePack(req, res, next) {
	try {
		const { packId } = req.params;

		const messagePack = await MessagePack.findById(packId);
		if (!messagePack) {
			throw createError(404, 'Message pack not found');
		}

		return res.status(200).json({
			success: true,
			data: messagePack
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Purchase a message pack
 * POST /message-packs/:packId/purchase
 */
async function purchaseMessagePack(req, res, next) {
	try {
		const { packId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			throw createError(401, 'User authentication required');
		}

		// Find the message pack
		const messagePack = await MessagePack.findById(packId);
		if (!messagePack) {
			throw createError(404, 'Message pack not found');
		}

		if (!messagePack.isActive) {
			throw createError(400, 'This message pack is not available for purchase');
		}

		// Create payment order
		const result = await paymentService.createMessagePackOrder({
			userId,
			messagePackId: messagePack._id,
			amount: messagePack.discountedPrice * 100, // Convert to paise
			currency: messagePack.currency
		});

		return res.status(201).json({
			success: true,
			message: 'Order created successfully',
			data: {
				orderId: result.order.id,
				amount: result.order.amount,
				currency: result.order.currency,
				receipt: result.order.receipt,
				paymentId: result.payment._id,
				checkoutUrl: result.checkoutUrl,
				messagePack: {
					id: messagePack._id,
					name: messagePack.name,
					messageCount: messagePack.messageCount,
					price: messagePack.discountedPrice
				}
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Verify message pack purchase
 * POST /message-packs/verify-purchase
 */
async function verifyMessagePackPurchase(req, res, next) {
	try {
		const { orderId, paymentId, signature } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			throw createError(401, 'User authentication required');
		}

		if (!orderId || !paymentId || !signature) {
			throw createError(400, 'Order ID, Payment ID, and Signature are required');
		}

		const result = await paymentService.verifyMessagePackPayment(orderId, paymentId, signature);
		const { payment, updatedUser } = result;

		return res.status(200).json({
			success: true,
			message: 'Message pack purchase verified successfully',
			data: {
				paymentId: payment._id,
				status: payment.status,
				amount: payment.amount,
				currency: payment.currency,
				messagePackId: payment.messagePackId,
				user: {
					id: updatedUser._id,
					email: updatedUser.email,
					name: updatedUser.name,
					messageCredits: updatedUser.messageCredits,
					purchasedMessagePacks: updatedUser.purchasedMessagePacks
				}
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Get user's message credits for a specific agent
 * GET /message-packs/credits/:agentId
 */
async function getUserMessageCredits(req, res, next) {
	try {
		const { agentId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			throw createError(401, 'User authentication required');
		}

		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		// Get credits for specific agent or initialize if not exists
		const agentCredits = user.messageCredits.get(agentId) || {
			freeMessages: config.messages.freeMessagesPerAgent,
			purchasedMessages: 0,
			usedMessages: 0
		};

		const totalAvailable = agentCredits.freeMessages + agentCredits.purchasedMessages;
		const remaining = totalAvailable - agentCredits.usedMessages;

		return res.status(200).json({
			success: true,
			data: {
				agentId,
				freeMessages: agentCredits.freeMessages,
				purchasedMessages: agentCredits.purchasedMessages,
				usedMessages: agentCredits.usedMessages,
				totalAvailable,
				remaining: Math.max(0, remaining)
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Get user's all message credits
 * GET /message-packs/credits
 */
async function getAllUserMessageCredits(req, res, next) {
	try {
		const userId = req.user?.id;

		if (!userId) {
			throw createError(401, 'User authentication required');
		}

		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, 'User not found');
		}

		const credits = {};
		for (const [agentId, agentCredits] of user.messageCredits) {
			const totalAvailable = agentCredits.freeMessages + agentCredits.purchasedMessages;
			const remaining = totalAvailable - agentCredits.usedMessages;

			credits[agentId] = {
				freeMessages: agentCredits.freeMessages,
				purchasedMessages: agentCredits.purchasedMessages,
				usedMessages: agentCredits.usedMessages,
				totalAvailable,
				remaining: Math.max(0, remaining)
			};
		}

		return res.status(200).json({
			success: true,
			data: {
				credits,
				purchasedMessagePacks: user.purchasedMessagePacks
			}
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Create a new message pack (Admin only)
 * POST /message-packs
 */
async function createMessagePack(req, res, next) {
	try {
		const {
			name,
			description,
			messageCount,
			price,
			currency = 'INR',
			validityDays,
			displayOrder = 0,
			discount,
			features = [],
			tags = []
		} = req.body;

		if (!name || !messageCount || !price) {
			throw createError(400, 'Name, message count, and price are required');
		}

		const messagePack = new MessagePack({
			name,
			description,
			messageCount,
			price,
			currency,
			validityDays,
			displayOrder,
			discount,
			features,
			tags
		});

		await messagePack.save();

		return res.status(201).json({
			success: true,
			message: 'Message pack created successfully',
			data: messagePack
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Update a message pack (Admin only)
 * PUT /message-packs/:packId
 */
async function updateMessagePack(req, res, next) {
	try {
		const { packId } = req.params;
		const updateData = req.body;

		const messagePack = await MessagePack.findByIdAndUpdate(
			packId,
			updateData,
			{ new: true, runValidators: true }
		);

		if (!messagePack) {
			throw createError(404, 'Message pack not found');
		}

		return res.status(200).json({
			success: true,
			message: 'Message pack updated successfully',
			data: messagePack
		});
	} catch (err) {
		return next(err);
	}
}

/**
 * Delete a message pack (Admin only)
 * DELETE /message-packs/:packId
 */
async function deleteMessagePack(req, res, next) {
	try {
		const { packId } = req.params;

		const messagePack = await MessagePack.findByIdAndDelete(packId);

		if (!messagePack) {
			throw createError(404, 'Message pack not found');
		}

		return res.status(200).json({
			success: true,
			message: 'Message pack deleted successfully'
		});
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	getMessagePacks,
	getMessagePack,
	purchaseMessagePack,
	verifyMessagePackPurchase,
	getUserMessageCredits,
	getAllUserMessageCredits,
	createMessagePack,
	updateMessagePack,
	deleteMessagePack
};
