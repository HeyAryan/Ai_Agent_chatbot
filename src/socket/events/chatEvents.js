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

  /**
   * Handle marking a message as read
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Read data
   */
  static async handleMarkMessageAsRead(socket, data) {
    const { messageId, userId, conversationId } = data;
    
    if (!messageId || !userId) {
      socket.emit('error', { message: 'Message ID and user ID are required' });
      return;
    }

    try {
      // Update message status in database
      const { Message } = require('../../models');
      const message = await Message.findById(messageId);
      
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Verify the message belongs to the user's conversation
      if (message.conversationId.toString() !== conversationId) {
        socket.emit('error', { message: 'Unauthorized to read this message' });
        return;
      }

      // Update message status to read
      await Message.findByIdAndUpdate(messageId, {
        status: 'read',
        updatedAt: new Date()
      });

      // Emit success response
      socket.emit('messageMarkedAsRead', {
        messageId,
        status: 'read',
        timestamp: new Date().toISOString()
      });

      // Broadcast to other users in the conversation (if any)
      socket.to(`conversation_${conversationId}`).emit('messageStatusUpdate', {
        messageId,
        status: 'read',
        userId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  /**
   * Handle marking all messages in a conversation as read
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Read all data
   */
  static async handleMarkAllMessagesAsRead(socket, data) {
    const { conversationId, userId } = data;
    
    if (!conversationId || !userId) {
      socket.emit('error', { message: 'Conversation ID and user ID are required' });
      return;
    }

    try {
      const { Message, Conversation } = require('../../models');
      
      // Verify conversation belongs to user
      const conversation = await Conversation.findOne({ 
        _id: conversationId, 
        user_id: userId 
      });
      
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or unauthorized' });
        return;
      }

      // Mark all unread messages in the conversation as read
      const result = await Message.updateMany(
        { 
          conversationId: conversationId,
          status: { $in: ['sent', 'delivered'] }
        },
        { 
          status: 'read',
          updatedAt: new Date()
        }
      );

      // Reset conversation unread count to 0
      await Conversation.findByIdAndUpdate(conversationId, {
        unread_messages_count: 0,
        updatedAt: new Date()
      });

      // Emit success response
      socket.emit('allMessagesMarkedAsRead', {
        conversationId,
        messagesUpdated: result.modifiedCount,
        unread_messages_count: 0,
        timestamp: new Date().toISOString()
      });

      // Broadcast to other users in the conversation (if any)
      socket.to(`conversation_${conversationId}`).emit('conversationMarkedAsRead', {
        conversationId,
        userId,
        unread_messages_count: 0,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error marking all messages as read:', error);
      socket.emit('error', { message: 'Failed to mark all messages as read' });
    }
  }

  /**
   * Handle getting unread count for a user
   * @param {Socket} socket - Socket instance
   * @param {Object} data - User data
   */
  static async handleGetUnreadCount(socket, data) {
    const { userId } = data;
    
    if (!userId) {
      socket.emit('error', { message: 'User ID is required' });
      return;
    }

    try {
      const { Conversation } = require('../../models');
      
      // Get total unread count for user
      const result = await Conversation.aggregate([
        { $match: { user_id: userId } },
        { $group: { _id: null, totalUnread: { $sum: '$unread_messages_count' } } }
      ]);
      
      const totalUnread = result.length > 0 ? result[0].totalUnread : 0;
      
      // Emit unread count
      socket.emit('unreadCount', {
        userId,
        totalUnread,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting unread count:', error);
      socket.emit('error', { message: 'Failed to get unread count' });
    }
  }

  /**
   * Handle joining a conversation room for real-time updates
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Join conversation data
   */
  static handleJoinConversation(socket, data) {
    const { conversationId, userId } = data;
    
    if (!conversationId || !userId) {
      socket.emit('error', { message: 'Conversation ID and user ID are required' });
      return;
    }

    // Join the conversation room
    socket.join(`conversation_${conversationId}`);
    
    socket.emit('joinedConversation', {
      conversationId,
      status: 'success',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle leaving a conversation room
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Leave conversation data
   */
  static handleLeaveConversation(socket, data) {
    const { conversationId, userId } = data;
    
    if (!conversationId || !userId) {
      socket.emit('error', { message: 'Conversation ID and user ID are required' });
      return;
    }

    // Leave the conversation room
    socket.leave(`conversation_${conversationId}`);
    
    socket.emit('leftConversation', {
      conversationId,
      status: 'success',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ChatEvents;


