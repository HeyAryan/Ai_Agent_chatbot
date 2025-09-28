const { Conversation, Message } = require('../models');

async function listChats(req, res, next) {
	try {
		const items = await Conversation.find({ user_id: req.user.id }).sort({ updatedAt: -1 }).lean().exec();
		return res.json({ success: true, data: items });
	} catch (err) { return next(err); }
}

async function getChat(req, res, next) {
	try {
		const conv = await Conversation.findOne({ _id: req.params.id, user_id: req.user.id }).lean().exec();
		if (!conv) return res.status(404).json({ message: 'Not found' });
		const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).lean().exec();
		return res.json({ success: true, data: { conversation: conv, messages } });
	} catch (err) { return next(err); }
}

async function createChat(req, res, next) {
	try {
		const { agentId, title } = req.body;
		const conv = await Conversation.create({ user_id: req.user.id, agent_id: agentId, title });
		return res.status(201).json({ success: true, data: conv });
	} catch (err) { return next(err); }
}

async function postMessage(req, res, next) {
	try {
		const { content, sender } = req.body;
		const conversationId = req.params.id;
		const conv = await Conversation.findOne({ _id: conversationId, user_id: req.user.id }).exec();
		if (!conv) return res.status(404).json({ message: 'Not found' });
		const msg = await Message.create({ 
			conversationId, 
			sender: sender || 'user', 
			senderId: req.user.id, 
			senderRef: 'User',
			content 
		});
		await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() }).exec();
		return res.status(201).json({ success: true, data: msg });
	} catch (err) { return next(err); }
}

async function pinChat(req, res, next) {
	try {
		const conversationId = req.params.id;
		const conv = await Conversation.findOne({ _id: conversationId, user_id: req.user.id }).exec();
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
		await Conversation.deleteOne({ _id: conversationId, user_id: req.user.id }).exec();
		return res.status(204).send();
	} catch (err) { return next(err); }
}

async function getConversationHistory(req, res, next) {
	try {
		const { conversationId } = req.params;
		const { page = 1, limit = 50 } = req.query;
		
		// Verify conversation belongs to user
		const conversation = await Conversation.findOne({ 
			_id: conversationId, 
			user_id: req.user.id 
		}).exec();
		
		if (!conversation) {
			return res.status(404).json({ message: 'Conversation not found' });
		}
		
		// Get messages with pagination
		const messages = await Message.find({ conversationId })
			.sort({ createdAt: 1 })
			.limit(parseInt(limit))
			.skip((parseInt(page) - 1) * parseInt(limit))
			.lean()
			.exec();
		
		const totalMessages = await Message.countDocuments({ conversationId });
		
		return res.json({
			success: true,
			data: {
				conversation,
				messages,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: totalMessages,
					pages: Math.ceil(totalMessages / parseInt(limit))
				}
			}
		});
	} catch (err) { 
		return next(err); 
	}
}

module.exports = { listChats, getChat, createChat, postMessage, pinChat, deleteChat, getConversationHistory };


