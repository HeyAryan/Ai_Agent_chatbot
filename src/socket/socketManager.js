const { Server } = require("socket.io");
const socketService = require('../services/socket.service');
const ChatEvents = require('./events/chatEvents');

/**
 * Socket Manager for handling WebSocket connections and events
 */
class SocketManager {
  constructor() {
    this.io = null;
    this.connections = {}; // Store mapping { connectionId -> socketId }
  }

  /**
   * Initialize socket.io with the HTTP server
   * @param {http.Server} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // TODO: Configure proper CORS for production
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    console.log('Socket.IO initialized');
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log("New WebSocket connected:", socket.id);

      // Handle client registration
      socket.on("register", (connectionId) => {
        this.handleRegister(socket, connectionId);
      });

      // Handle incoming messages
      socket.on("message", async (data) => {
        await this.handleMessage(socket, data);
      });

      // Handle read message events
      socket.on("markMessageAsRead", async (data) => {
        await ChatEvents.handleMarkMessageAsRead(socket, data);
      });

      socket.on("markAllMessagesAsRead", async (data) => {
        await ChatEvents.handleMarkAllMessagesAsRead(socket, data);
      });

      socket.on("getUnreadCount", async (data) => {
        await ChatEvents.handleGetUnreadCount(socket, data);
      });

      socket.on("joinConversation", (data) => {
        ChatEvents.handleJoinConversation(socket, data);
      });

      socket.on("leaveConversation", (data) => {
        ChatEvents.handleLeaveConversation(socket, data);
      });

      // Conversation history and management events
      socket.on("getConversationHistory", async (data) => {
        await ChatEvents.handleGetConversationHistory(socket, data);
      });

      socket.on("getUserConversations", async (data) => {
        await ChatEvents.handleGetUserConversations(socket, data);
      });

      socket.on("getConversationDetails", async (data) => {
        await ChatEvents.handleGetConversationDetails(socket, data);
      });

      // Handle typing indicators
      socket.on("typing", (data) => {
        ChatEvents.handleTyping(socket, data);
      });

      // Handle room management
      socket.on("joinRoom", (data) => {
        ChatEvents.handleJoinRoom(socket, data);
      });

      socket.on("leaveRoom", (data) => {
        ChatEvents.handleLeaveRoom(socket, data);
      });

      // Handle message reactions
      socket.on("reaction", (data) => {
        ChatEvents.handleReaction(socket, data);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    });
  }

  /**
   * Handle client registration
   * @param {Socket} socket - Socket instance
   * @param {string} connectionId - Client connection ID
   */
  handleRegister(socket, connectionId) {
    if (!connectionId) {
      socket.emit("error", { message: "Connection ID is required" });
      return;
    }

    this.connections[connectionId] = socket.id;
    console.log(`Mapped connectionId ${connectionId} -> socketId ${socket.id}`);
    
    socket.emit("registered", { 
      connectionId, 
      socketId: socket.id,
      status: "success" 
    });
  }

  /**
   * Handle incoming messages
   * @param {Socket} socket - Socket instance
   * @param {Object} data - Message data
   */
  async handleMessage(socket, data) {
    try {
      console.log("Message received:", data);

      // Validate message data
      if (!socketService.validateMessageData(data)) {
        socket.emit("messageResponse", {
          status: "error",
          message: "Invalid message data",
          serverTime: new Date().toISOString()
        });
        return;
      }

      // Process message through service
      // The service will handle agent validation and OpenAI assistant ID mapping
      console.log("Processing message for agent:", data.agentId);
      const response = await socketService.processMessage(data);
      console.log("Sending response:", response);

      // Send response back to client
      socket.emit("messageResponse", response);

    } catch (error) {
      console.error("Error handling message:", error);
      socket.emit("messageResponse", {
        status: "error",
        message: "Internal server error",
        serverTime: new Date().toISOString()
      });
    }
  }

  /**
   * Handle client disconnection
   * @param {Socket} socket - Socket instance
   */
  handleDisconnect(socket) {
    console.log("Socket disconnected:", socket.id);
    
    // Clean up connection mapping
    for (const [connectionId, socketId] of Object.entries(this.connections)) {
      if (socketId === socket.id) {
        delete this.connections[connectionId];
        console.log(`Cleaned up connectionId ${connectionId}`);
        break;
      }
    }
  }

  /**
   * Send message to specific connection
   * @param {string} connectionId - Target connection ID
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  sendToConnection(connectionId, event, data) {
    const socketId = this.connections[connectionId];
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Broadcast message to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Data to broadcast
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection stats
   */
  getStats() {
    return {
      totalConnections: Object.keys(this.connections).length,
      activeSockets: this.io ? this.io.sockets.sockets.size : 0
    };
  }
}

module.exports = new SocketManager();
