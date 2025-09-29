const { Conversation, Message } = require('../models');
const messageService = require('../services/message.service');
const createError = require('http-errors');

async function listChats(req, res, next) {
	try {
		const items = await Conversation.find({ userId: req.user.id }).sort({ updatedAt: -1 }).lean().exec();
		return res.json({ success: true, data: items });
	} catch (err) { return next(err); }
}

async function getChat(req, res, next) {
	try {
		const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user.id }).lean().exec();
		if (!conv) return res.status(404).json({ message: 'Not found' });
		const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean().exec();
		return res.json({ success: true, data: { conversation: conv, messages } });
	} catch (err) { return next(err); }
}

async function createChat(req, res, next) {
	try {
		const { agentId, title } = req.body;
		
		// Initialize message credits for this agent if not already done
		await messageService.initializeAgentCredits(req.user.id, agentId);
		
		const conv = await Conversation.create({ userId: req.user.id, agentId, title });
		return res.status(201).json({ success: true, data: conv });
	} catch (err) { return next(err); }
}

async function postMessage(req, res, next) {
	try {
		const { content, sender } = req.body;
		const conversationId = req.params.id;
		const conv = await Conversation.findOne({ _id: conversationId, userId: req.user.id }).exec();
		if (!conv) return res.status(404).json({ message: 'Not found' });

		// Check and deduct message credits only for user messages
		if (sender === 'user' || !sender) {
			const creditCheck = await messageService.checkUserMessageCredits(req.user.id, conv.agentId);
			if (!creditCheck.hasCredits) {
				return res.status(402).json({ 
					success: false, 
					message: 'Insufficient message credits. Please purchase more messages.',
					remaining: creditCheck.remaining
				});
			}

			// Deduct message credit
			await messageService.deductMessageCredit(req.user.id, conv.agentId);
		}

		const msg = await Message.create({ conversationId, sender: sender || 'user', senderId: req.user.id, content });
		await Conversation.findByIdAndUpdate(conversationId, { lastMessage: content, $inc: { unreadCount: 0 } }).exec();
		
		// Get updated credit info
		const updatedCredits = await messageService.checkUserMessageCredits(req.user.id, conv.agentId);
		
		return res.status(201).json({ 
			success: true, 
			data: msg,
			credits: {
				remaining: updatedCredits.remaining,
				hasCredits: updatedCredits.hasCredits
			}
		});
	} catch (err) { return next(err); }
}

async function pinChat(req, res, next) {
	try {
		const conversationId = req.params.id;
		const conv = await Conversation.findOne({ _id: conversationId, userId: req.user.id }).exec();
		if (!conv) return res.status(404).json({ message: 'Not found' });
		conv.pinned = !conv.pinned;
		await conv.save();
		return res.json({ success: true, data: { pinned: conv.pinned } });
	} catch (err) { return next(err); }
}

async function deleteChat(req, res, next) {
	try {
		const conversationId = req.params.id;
		await Message.deleteMany({ conversationId }).exec();
		await Conversation.deleteOne({ _id: conversationId, userId: req.user.id }).exec();
		return res.status(204).send();
	} catch (err) { return next(err); }
}

module.exports = { listChats, getChat, createChat, postMessage, pinChat, deleteChat };


