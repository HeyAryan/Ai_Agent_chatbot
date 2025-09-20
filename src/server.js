const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectToDatabase, disconnectFromDatabase } = require('./db/mongoose');
const { authenticateSocket, addConnection, removeConnection } = require('./services/socket.service');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
	cors: {
		origin: "*", // Configure this properly for production
		methods: ["GET", "POST"]
	}
});

// Store io instance globally for use in services
global.io = io;

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
	console.log(`[SOCKET] [${socket.id}] New connection established`, {
		userId: socket.userId,
		email: socket.userEmail,
		role: socket.userRole
	});

	// Add user to active connections
	addConnection(socket.userId, socket.id);

	// Join user to their personal room
	socket.join(`user:${socket.userId}`);

	// Handle notification:get → notification:receive
	socket.on('notification:get', async (data) => {
		console.log(`[SOCKET] [${socket.id}] notification:get received`, { userId: socket.userId });
		
		try {
			// Fetch notifications for the user
			const { Notification } = require('./models');
			const notifications = await Notification.find({ userId: socket.userId })
				.sort({ createdAt: -1 })
				.limit(50)
				.lean()
				.exec();

			socket.emit('notification:receive', {
				success: true,
				data: notifications,
				timestamp: new Date().toISOString()
			});

			console.log(`[SOCKET] [${socket.id}] notification:receive sent`, {
				userId: socket.userId,
				notificationCount: notifications.length
			});
		} catch (error) {
			console.error(`[SOCKET] [${socket.id}] Error fetching notifications:`, error);
			socket.emit('notification:receive', {
				success: false,
				error: 'Failed to fetch notifications',
				timestamp: new Date().toISOString()
			});
		}
	});

	// Handle connection:get → connection:receive
	socket.on('connection:get', (data) => {
		console.log(`[SOCKET] [${socket.id}] connection:get received`, { userId: socket.userId });
		
		const { getActiveConnections } = require('./services/socket.service');
		const connections = getActiveConnections();

		socket.emit('connection:receive', {
			success: true,
			data: connections,
			totalConnections: connections.length,
			timestamp: new Date().toISOString()
		});

		console.log(`[SOCKET] [${socket.id}] connection:receive sent`, {
			userId: socket.userId,
			totalConnections: connections.length
		});
	});

	// Handle conversation:get → conversation:receive
	socket.on('conversation:get', async (data) => {
		console.log(`[SOCKET] [${socket.id}] conversation:get received`, { userId: socket.userId });
		
		try {
			const { Conversation } = require('./models');
			const conversations = await Conversation.find({ userId: socket.userId })
				.sort({ updatedAt: -1 })
				.lean()
				.exec();

			socket.emit('conversation:receive', {
				success: true,
				data: conversations,
				timestamp: new Date().toISOString()
			});

			console.log(`[SOCKET] [${socket.id}] conversation:receive sent`, {
				userId: socket.userId,
				conversationCount: conversations.length
			});
		} catch (error) {
			console.error(`[SOCKET] [${socket.id}] Error fetching conversations:`, error);
			socket.emit('conversation:receive', {
				success: false,
				error: 'Failed to fetch conversations',
				timestamp: new Date().toISOString()
			});
		}
	});

	// Handle message:send → message:receive
	socket.on('message:send', async (data) => {
		console.log(`[SOCKET] [${socket.id}] message:send received`, {
			userId: socket.userId,
			targetUserId: data.targetUserId,
			conversationId: data.conversationId
		});

		try {
			const { Message, Conversation } = require('./models');
			const { sendToUser } = require('./services/socket.service');

			// Create message in database
			const message = await Message.create({
				conversationId: data.conversationId,
				sender: 'user',
				senderId: socket.userId,
				content: data.content,
				attachments: data.attachments || []
			});

			// Update conversation with last message
			await Conversation.findByIdAndUpdate(data.conversationId, {
				lastMessage: data.content,
				$inc: { unreadCount: 1 }
			}).exec();

			// Prepare message data for response
			const messageData = {
				success: true,
				data: {
					...message.toObject(),
					senderInfo: {
						userId: socket.userId,
						email: socket.userEmail,
						role: socket.userRole
					}
				},
				timestamp: new Date().toISOString()
			};

			// Send to sender
			socket.emit('message:receive', messageData);

			// Send to target user if they're connected
			if (data.targetUserId && data.targetUserId !== socket.userId) {
				const sent = sendToUser(data.targetUserId, 'message:receive', messageData);
				
				if (!sent) {
					console.log(`[SOCKET] [${socket.id}] Target user ${data.targetUserId} not connected, message stored in database`);
				}
			}

			console.log(`[SOCKET] [${socket.id}] message:receive sent`, {
				userId: socket.userId,
				targetUserId: data.targetUserId,
				messageId: message._id
			});

		} catch (error) {
			console.error(`[SOCKET] [${socket.id}] Error sending message:`, error);
			socket.emit('message:receive', {
				success: false,
				error: 'Failed to send message',
				timestamp: new Date().toISOString()
			});
		}
	});

	// Handle disconnect
	socket.on('disconnect', (reason) => {
		console.log(`[SOCKET] [${socket.id}] Disconnected`, {
			userId: socket.userId,
			reason
		});

		// Remove from active connections
		removeConnection(socket.id);
	});

	// Handle errors
	socket.on('error', (error) => {
		console.error(`[SOCKET] [${socket.id}] Socket error:`, error);
	});
});

// Export getIO function for use in other modules
function getIO() {
	return io;
}

async function start() {
	try {
		await connectToDatabase();
		server.listen(PORT, () => {
			console.log(`[server] listening on port ${PORT}`);
		});
	} catch (err) {
		console.error('[server] failed to start:', err);
		process.exit(1);
	}
}

// graceful shutdown
async function shutdown(signal) {
	console.log(`[server] received ${signal}. shutting down...`);
	server.close(async () => {
		try {
			await disconnectFromDatabase();
			console.log('[server] db disconnected');
			process.exit(0);
		} catch (err) {
			console.error('[server] error during shutdown', err);
			process.exit(1);
		}
	});
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

module.exports = { server, getIO };


