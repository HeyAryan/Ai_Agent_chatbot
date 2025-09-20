const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

// Map to store active connections: userId -> socketId
const activeConnections = new Map();
// Map to store socketId -> userId for quick lookup
const socketToUser = new Map();

/**
 * JWT Middleware for Socket.IO authentication
 */
function authenticateSocket(socket, next) {
	const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
	
	if (!token) {
		console.log(`[SOCKET] [${socket.id}] Authentication failed: No token provided`);
		return next(new Error('Authentication error: No token provided'));
	}

	try {
		const payload = jwt.verify(token, config.jwt.secret);
		socket.userId = payload.userId;
		socket.userEmail = payload.email;
		socket.userRole = payload.role;
		
		console.log(`[SOCKET] [${socket.id}] Authentication successful`, {
			userId: payload.userId,
			email: payload.email,
			role: payload.role
		});
		
		next();
	} catch (err) {
		console.error(`[SOCKET] [${socket.id}] Authentication failed:`, {
			error: err.name,
			message: err.message
		});
		next(new Error('Authentication error: Invalid token'));
	}
}

/**
 * Add user to active connections
 */
function addConnection(userId, socketId) {
	activeConnections.set(userId, socketId);
	socketToUser.set(socketId, userId);
	
	console.log(`[SOCKET] [${socketId}] User connected`, {
		userId,
		totalConnections: activeConnections.size
	});
}

/**
 * Remove user from active connections
 */
function removeConnection(socketId) {
	const userId = socketToUser.get(socketId);
	
	if (userId) {
		activeConnections.delete(userId);
		socketToUser.delete(socketId);
		
		console.log(`[SOCKET] [${socketId}] User disconnected`, {
			userId,
			totalConnections: activeConnections.size
		});
	}
}

/**
 * Get active connections
 */
function getActiveConnections() {
	return Array.from(activeConnections.entries()).map(([userId, socketId]) => ({
		userId,
		socketId
	}));
}

/**
 * Check if user is connected
 */
function isUserConnected(userId) {
	return activeConnections.has(userId);
}

/**
 * Get socket ID for user
 */
function getSocketId(userId) {
	return activeConnections.get(userId);
}

/**
 * Send message to specific user if connected
 */
function sendToUser(userId, event, data) {
	const socketId = activeConnections.get(userId);
	
	if (socketId) {
		// Get the socket instance from the global io instance
		const io = global.io;
		if (io) {
			io.to(socketId).emit(event, data);
			console.log(`[SOCKET] [${socketId}] Message sent to user ${userId}`, {
				event,
				dataKeys: Object.keys(data || {})
			});
			return true;
		}
	}
	
	console.log(`[SOCKET] User ${userId} not connected, message not delivered`, {
		event,
		dataKeys: Object.keys(data || {})
	});
	return false;
}

/**
 * Broadcast to all connected users
 */
function broadcastToAll(event, data) {
	const io = global.io;
	if (io) {
		io.emit(event, data);
		console.log(`[SOCKET] Broadcast sent to all users`, {
			event,
			recipientCount: activeConnections.size,
			dataKeys: Object.keys(data || {})
		});
	}
}

/**
 * Broadcast to specific room
 */
function broadcastToRoom(room, event, data) {
	const io = global.io;
	if (io) {
		io.to(room).emit(event, data);
		console.log(`[SOCKET] Message sent to room ${room}`, {
			event,
			dataKeys: Object.keys(data || {})
		});
	}
}

module.exports = {
	authenticateSocket,
	addConnection,
	removeConnection,
	getActiveConnections,
	isUserConnected,
	getSocketId,
	sendToUser,
	broadcastToAll,
	broadcastToRoom
};
