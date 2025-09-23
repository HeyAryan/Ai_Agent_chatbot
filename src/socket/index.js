/**
 * Socket module exports
 * Centralized exports for socket-related functionality
 */

const socketManager = require('./socketManager');
const ChatEvents = require('./events/chatEvents');

module.exports = {
  socketManager,
  ChatEvents
};


