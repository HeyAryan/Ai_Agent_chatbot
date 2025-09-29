const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },

    openai_thread_id: { type: String, required: false },

    status: { 
      type: String, 
      enum: ['active', 'closed', 'archived'], 
      default: 'active' 
    },

    pinned: { type: Boolean, default: false },

    // New conversation tracking fields
    last_message_text: { type: String, default: '' },
    last_message_send_by: { 
      type: String, 
      enum: ['User', 'System'], 
      default: 'User' 
    },
    unread_messages_count: { type: Number, default: 0 },
    last_message_timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Conversation', conversationSchema);
