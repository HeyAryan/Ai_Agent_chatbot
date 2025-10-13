import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ChatMessage as ApiChatMessage } from '../api.service';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  from: 'me' | 'server';
  payload: any;
  structuredResponse?: { answer: string; suggestions: string[] };
  agentId: string;
  timestamp: Date;
  messageId?: string;
  status?: 'sent' | 'delivered' | 'read';
  conversationId?: string;
}

@Component({
  selector: 'app-dual-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dual-chat.component.html',
  styleUrls: ['./dual-chat.component.css']
})
export class DualChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // WebSocket connection
  socket: Socket | null = null;
  isConnected = false;
  connectionId: string | null = null;
  
  // ViewChild for message containers
  @ViewChild('astrologerMessages') astrologerMessages!: ElementRef;
  @ViewChild('contentWriterMessages') contentWriterMessages!: ElementRef;
  
  // Separate thread IDs for each agent
  threadIds: {
    astrologer: string | null;
    contentWriter: string | null;
  } = {
    astrologer: null,
    contentWriter: null
  };

  // Conversation IDs for each agent
  conversationIds: {
    astrologer: string | null;
    contentWriter: string | null;
  } = {
    astrologer: null,
    contentWriter: null
  };

  // Unread message counts
  unreadCounts: {
    astrologer: number;
    contentWriter: number;
  } = {
    astrologer: 0,
    contentWriter: 0
  };
  
  // Chat states for both agents
  astrologerChat: {
    input: string;
    history: ChatMessage[];
    isLoading: boolean;
  } = {
    input: '',
    history: [],
    isLoading: false
  };
  
  contentWriterChat: {
    input: string;
    history: ChatMessage[];
    isLoading: boolean;
  } = {
    input: '',
    history: [],
    isLoading: false
  };
  
  // Agent IDs
  readonly ASTROLOGER_ID = '68d6c436d6b8a27c9fd2506f';
  readonly FORMAL_CONTENT_WRITER_ID = '68cd9c7860ca25527ff42e33';
  
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.initializeConnection();
    this.loadConversations();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  ngAfterViewChecked() {
    // Auto-scroll to bottom when new messages arrive
    this.scrollToBottom();
  }

  async initializeConnection() {
    try {
      // Get connection ID
      this.apiService.getUserConnectionId().subscribe({
        next: (response) => {
          this.connectionId = response?.data?.connectionId || response?.connectionId;
          if (this.connectionId) {
            this.connectWebSocket();
          } else {
            this.error = 'Failed to get connection ID';
          }
        },
        error: (error) => {
          this.error = error.message || 'Failed to get connection ID';
        }
      });
    } catch (e: any) {
      this.error = e?.message || 'Failed to initialize connection';
    }
  }

  connectWebSocket() {
    if (!this.connectionId) {
      this.error = 'No connection ID available';
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io('http://localhost:3000', { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.error = null;
      this.socket?.emit('register', this.connectionId);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('messageResponse', (data: any) => {
      console.log('messageResponse:', data);
      
      // Update thread ID for the specific agent
      const agentId = data.agentId || data.agent_id;
      if (agentId === this.ASTROLOGER_ID) {
        this.threadIds.astrologer = data.threadId;
        this.conversationIds.astrologer = data.conversationId;
      } else if (agentId === this.FORMAL_CONTENT_WRITER_ID) {
        this.threadIds.contentWriter = data.threadId;
        this.conversationIds.contentWriter = data.conversationId;
      }
      
      // Parse structured response if it's a JSON string
      let structuredResponse = null;
      let displayData = data;
      
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.answer && parsed.suggestions) {
            structuredResponse = parsed;
            displayData = parsed;
          }
        } catch (e) {
          // Not JSON, use as is
        }
      } else if (data.answer && data.suggestions) {
        structuredResponse = data;
      }
      
      // Determine which chat to update based on agentId
      const message: ChatMessage = {
        from: 'server',
        payload: displayData,
        structuredResponse: structuredResponse,
        agentId: agentId,
        timestamp: new Date(),
        messageId: data.messageId || data.message_id,
        status: 'sent', // AI messages start as 'sent'
        conversationId: data.conversationId || data.conversation_id
      };

      if (agentId === this.ASTROLOGER_ID) {
        this.astrologerChat.history.push(message);
        this.astrologerChat.isLoading = false;
        // Increment unread count for AI messages
        this.unreadCounts.astrologer++;
        
        // Load conversation history if this is a new conversation
        if (data.conversationId && !this.conversationIds.astrologer) {
          this.conversationIds.astrologer = data.conversationId;
          this.loadConversationHistory(data.conversationId, 'astrologer');
        }
      } else if (agentId === this.FORMAL_CONTENT_WRITER_ID) {
        this.contentWriterChat.history.push(message);
        this.contentWriterChat.isLoading = false;
        // Increment unread count for AI messages
        this.unreadCounts.contentWriter++;
        
        // Load conversation history if this is a new conversation
        if (data.conversationId && !this.conversationIds.contentWriter) {
          this.conversationIds.contentWriter = data.conversationId;
          this.loadConversationHistory(data.conversationId, 'contentWriter');
        }
      }
    });

    this.socket.on('connect_error', (err: any) => {
      this.error = err?.message || 'WebSocket connection error';
      this.isConnected = false;
    });

    // Read message socket event listeners
    this.socket.on('messageMarkedAsRead', (data: any) => {
      console.log('Message marked as read:', data);
      // Update local message status
      const agentType = this.conversationIds.astrologer === data.conversationId ? 'astrologer' : 'contentWriter';
      const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
      const message = chat.history.find(msg => msg.messageId === data.messageId);
      if (message) {
        message.status = 'read';
      }
    });

    this.socket.on('allMessagesMarkedAsRead', (data: any) => {
      console.log('All messages marked as read:', data);
      // Update all messages in local history to read
      const agentType = this.conversationIds.astrologer === data.conversationId ? 'astrologer' : 'contentWriter';
      const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
      chat.history.forEach(msg => {
        if (msg.from === 'server') {
          msg.status = 'read';
        }
      });
      
      // Reset unread count
      this.unreadCounts[agentType] = 0;
    });

    this.socket.on('unreadCount', (data: any) => {
      console.log('Unread count received:', data);
      // Update unread counts (this would need to be mapped to specific agents)
      // For now, we'll handle this in the messageResponse handler
    });

    this.socket.on('messageStatusUpdate', (data: any) => {
      console.log('Message status update:', data);
      // Update message status in real-time
      const agentType = this.conversationIds.astrologer === data.conversationId ? 'astrologer' : 'contentWriter';
      const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
      const message = chat.history.find(msg => msg.messageId === data.messageId);
      if (message) {
        message.status = data.status;
      }
    });

    this.socket.on('conversationMarkedAsRead', (data: any) => {
      console.log('Conversation marked as read:', data);
      // Update unread count for the conversation
      const agentType = this.conversationIds.astrologer === data.conversationId ? 'astrologer' : 'contentWriter';
      this.unreadCounts[agentType] = 0;
    });

    // Conversation history and management socket event listeners
    this.socket.on('userConversations', (data: any) => {
      console.log('User conversations received:', data);
      // Update conversation IDs and unread counts
      if (data.conversations) {
        data.conversations.forEach((conversation: any) => {
          if (conversation.agent_id._id === this.ASTROLOGER_ID) {
            this.conversationIds.astrologer = conversation._id;
            this.unreadCounts.astrologer = conversation.unread_messages_count || 0;
          } else if (conversation.agent_id._id === this.FORMAL_CONTENT_WRITER_ID) {
            this.conversationIds.contentWriter = conversation._id;
            this.unreadCounts.contentWriter = conversation.unread_messages_count || 0;
          }
        });
        
        // Automatically load conversation history for both agents
        setTimeout(() => {
          this.loadAllConversationHistory();
        }, 1000); // Small delay to ensure conversation IDs are set
      }
    });

    this.socket.on('conversationHistory', (data: any) => {
      console.log('Conversation history received:', data);
      // Load conversation history into chat
      if (data.messages && data.messages.length > 0) {
        const agentType = this.conversationIds.astrologer === data.conversationId ? 'astrologer' : 'contentWriter';
        const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
        
        // Clear existing history
        chat.history = [];
        
        // Add messages to history in chronological order
        data.messages.forEach((msg: any) => {
          const chatMessage: ChatMessage = {
            from: msg.sender === 'user' ? 'me' : 'server',
            payload: msg.sender === 'user' ? { message: msg.content } : msg.content,
            structuredResponse: msg.sender === 'agent' && typeof msg.content === 'object' ? msg.content : null,
            agentId: msg.senderId,
            timestamp: new Date(msg.createdAt),
            messageId: msg._id,
            status: msg.status,
            conversationId: msg.conversationId
          };
          
          chat.history.push(chatMessage);
        });
        
        // Auto-scroll to bottom after loading history
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
        
        console.log(`✅ Loaded ${data.messages.length} messages for ${agentType} chat`);
      } else {
        console.log(`ℹ️ No conversation history found for conversation ${data.conversationId}`);
      }
    });

    this.socket.on('conversationDetails', (data: any) => {
      console.log('Conversation details received:', data);
      // Update conversation details if needed
      if (data.conversation) {
        const agentType = this.conversationIds.astrologer === data.conversationId ? 'astrologer' : 'contentWriter';
        if (agentType === 'astrologer') {
          this.unreadCounts.astrologer = data.conversation.unread_messages_count || 0;
        } else {
          this.unreadCounts.contentWriter = data.conversation.unread_messages_count || 0;
        }
      }
    });
  }


  sendSuggestion(suggestion: string, agentType: 'astrologer' | 'contentWriter') {
    const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
    chat.input = suggestion;
    this.sendMessage(agentType);
  }

  clearChat(agentType: 'astrologer' | 'contentWriter') {
    const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
    chat.history = [];
  }

  // Refresh conversation history for a specific agent
  refreshConversationHistory(agentType: 'astrologer' | 'contentWriter') {
    const conversationId = agentType === 'astrologer' 
      ? this.conversationIds.astrologer 
      : this.conversationIds.contentWriter;

    if (conversationId) {
      this.loadConversationHistory(conversationId, agentType);
    } else {
      console.log(`No conversation found for ${agentType}`);
    }
  }

  // Refresh all conversation history
  refreshAllConversationHistory() {
    this.loadAllConversationHistory();
  }

  getAgentDisplayName(agentId: string): string {
    switch (agentId) {
      case this.ASTROLOGER_ID:
        return 'Astrologer';
      case this.FORMAL_CONTENT_WRITER_ID:
        return 'Content Writer';
      default:
        return 'AI Assistant';
    }
  }

  // Read Message Functionality - Socket-based
  async loadConversations() {
    // Get user conversations via socket
    this.socket?.emit('getUserConversations', { userId: '68d3d06639d8fc6c51c933a3' });
    // Get unread count via socket
    this.socket?.emit('getUnreadCount', { userId: '68d3d06639d8fc6c51c933a3' });
  }

  // Load conversation history for both agents when component initializes
  async loadAllConversationHistory() {
    // Load history for astrologer if conversation exists
    if (this.conversationIds.astrologer) {
      await this.loadConversationHistory(this.conversationIds.astrologer, 'astrologer');
    }
    
    // Load history for content writer if conversation exists
    if (this.conversationIds.contentWriter) {
      await this.loadConversationHistory(this.conversationIds.contentWriter, 'contentWriter');
    }
  }

  async loadConversationHistory(conversationId: string, agentType: 'astrologer' | 'contentWriter') {
    if (!this.socket || !conversationId) return;

    // Get conversation history via socket
    this.socket.emit('getConversationHistory', {
      conversationId,
      userId: '68d3d06639d8fc6c51c933a3',
      page: 1,
      limit: 50
    });
  }

  async markMessageAsRead(messageId: string, agentType: 'astrologer' | 'contentWriter') {
    if (!messageId || !this.socket) return;

    const conversationId = agentType === 'astrologer' 
      ? this.conversationIds.astrologer 
      : this.conversationIds.contentWriter;

    if (!conversationId) return;

    // Emit socket event to mark message as read
    this.socket.emit('markMessageAsRead', {
      messageId,
      userId: '68d3d06639d8fc6c51c933a3',
      conversationId
    });
  }

  async markAllMessagesAsRead(agentType: 'astrologer' | 'contentWriter') {
    const conversationId = agentType === 'astrologer' 
      ? this.conversationIds.astrologer 
      : this.conversationIds.contentWriter;

    if (!conversationId || !this.socket) return;

    // Emit socket event to mark all messages as read
    this.socket.emit('markAllMessagesAsRead', {
      conversationId,
      userId: '68d3d06639d8fc6c51c933a3'
    });
  }

  onMessageView(message: ChatMessage, agentType: 'astrologer' | 'contentWriter') {
    // Mark server messages as read when viewed
    if (message.from === 'server' && message.messageId && message.status !== 'read') {
      this.markMessageAsRead(message.messageId, agentType);
    }
  }

  scrollToBottom() {
    // Auto-scroll to bottom for both chat panels
    setTimeout(() => {
      if (this.astrologerMessages) {
        const element = this.astrologerMessages.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
      if (this.contentWriterMessages) {
        const element = this.contentWriterMessages.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  getMessageStatusIcon(status?: string): string {
    switch (status) {
      case 'sent': return '📤';
      case 'delivered': return '📨';
      case 'read': return '✅';
      default: return '❓';
    }
  }

  getMessageStatusText(status?: string): string {
    switch (status) {
      case 'sent': return 'Sent';
      case 'delivered': return 'Delivered';
      case 'read': return 'Read';
      default: return 'Unknown';
    }
  }

  // Enhanced send message to include conversation tracking
  async sendMessage(agentType: 'astrologer' | 'contentWriter') {
    if (!this.socket || !this.isConnected) {
      this.error = 'WebSocket is not connected.';
      return;
    }

    const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
    const agentId = agentType === 'astrologer' ? this.ASTROLOGER_ID : this.FORMAL_CONTENT_WRITER_ID;
    const threadId = agentType === 'astrologer' ? this.threadIds.astrologer : this.threadIds.contentWriter;
    const conversationId = agentType === 'astrologer' ? this.conversationIds.astrologer : this.conversationIds.contentWriter;
    
    const trimmed = (chat.input || '').trim();
    if (!trimmed) return;

    const payload = {
      message: trimmed,
      agentId: agentId,
      userId: '68d3d06639d8fc6c51c933a3',
      threadId: threadId,
      conversationId: conversationId
    };

    this.socket.emit('message', payload);
    
    // Add user message to chat history
    const userMessage: ChatMessage = {
      from: 'me',
      payload: payload,
      agentId: agentId,
      timestamp: new Date(),
      status: 'delivered' // User messages are immediately delivered
    };
    
    chat.history.push(userMessage);
    chat.isLoading = true;
    chat.input = '';
  }
}
