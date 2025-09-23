/**
 * Chat-specific socket events
 * This file can be extended for more complex chat functionality
 */

const socketService = require('../../services/socket.service');

/**
 * Chat event handlers
 */
class ChatEvents {
  /**
   * Handle typing indicator
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Typing data
   */
  static handleTyping(socket, data) {
    // Broadcast typing indicator to other users in the same room/chat
    socket.broadcast.emit('userTyping', {
      user: data.user,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle user joining a chat room
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Join data
   */
  static handleJoinRoom(socket, data) {
    const { roomId, user } = data;
    
    if (!roomId || !user) {
      socket.emit('error', { message: 'Room ID and user are required' });
      return;
    }

    socket.join(roomId);
    socket.to(roomId).emit('userJoined', {
      user,
      roomId,
      timestamp: new Date().toISOString()
    });

    socket.emit('joinedRoom', {
      roomId,
      status: 'success',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle user leaving a chat room
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Leave data
   */
  static handleLeaveRoom(socket, data) {
    const { roomId, user } = data;
    
    if (!roomId || !user) {
      socket.emit('error', { message: 'Room ID and user are required' });
      return;
    }

    socket.leave(roomId);
    socket.to(roomId).emit('userLeft', {
      user,
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle message reactions
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Reaction data
   */
  static handleReaction(socket, data) {
    const { messageId, reaction, user } = data;
    
    if (!messageId || !reaction || !user) {
      socket.emit('error', { message: 'Message ID, reaction, and user are required' });
      return;
    }

    // Broadcast reaction to all users in the room
    socket.broadcast.emit('messageReaction', {
      messageId,
      reaction,
      user,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ChatEvents;


