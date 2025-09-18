const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const config = require('../config');
const { Conversation, Message } = require('../models');

function setupRealtime(server) {
	const io = new Server(server, {
		cors: { origin: '*', methods: ['GET', 'POST'] }
	});

	io.use((socket, next) => {
		try {
			const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.replace('Bearer ', '');
			if (!token) return next(new Error('Unauthorized'));
			const payload = jwt.verify(token, config.jwt.secret);
			socket.user = { id: payload.userId, email: payload.email, role: payload.role };
			return next();
		} catch (err) {
			return next(new Error('Unauthorized'));
		}
	});

	io.on('connection', (socket) => {
		// join a conversation room
		socket.on('join', async ({ conversationId }) => {
			try {
				const conv = await Conversation.findOne({ _id: conversationId, userId: socket.user.id }).lean().exec();
				if (!conv) return socket.emit('error', { message: 'Conversation not found' });
				socket.join(`conv:${conversationId}`);
				socket.emit('joined', { conversationId });
			} catch (err) {
				socket.emit('error', { message: 'Failed to join' });
			}
		});

		// send message
		socket.on('message', async ({ conversationId, content }) => {
			try {
				const conv = await Conversation.findOne({ _id: conversationId, userId: socket.user.id }).exec();
				if (!conv) return socket.emit('error', { message: 'Conversation not found' });
				const msg = await Message.create({ conversationId, sender: 'user', senderId: socket.user.id, content });
				await Conversation.findByIdAndUpdate(conversationId, { lastMessage: content, updatedAt: new Date() }).exec();
				io.to(`conv:${conversationId}`).emit('message', { _id: msg._id, conversationId, sender: 'user', content, createdAt: msg.createdAt });
			} catch (err) {
				socket.emit('error', { message: 'Failed to send' });
			}
		});
	});

	return io;
}

module.exports = { setupRealtime };



