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

    pinned: { type: Boolean, default: false }
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Conversation', conversationSchema);
