import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  from: 'me' | 'server';
  payload: any;
  structuredResponse?: { answer: string; suggestions: string[] };
  agentId: string;
  timestamp: Date;
}

@Component({
  selector: 'app-dual-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dual-chat.component.html',
  styleUrls: ['./dual-chat.component.css']
})
export class DualChatComponent implements OnInit, OnDestroy {
  // WebSocket connection
  socket: Socket | null = null;
  isConnected = false;
  connectionId: string | null = null;
  
  // Separate thread IDs for each agent
  threadIds: {
    astrologer: string | null;
    contentWriter: string | null;
  } = {
    astrologer: null,
    contentWriter: null
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
  readonly ASTROLOGER_ID = 'ASTROLOGER_01';
  readonly FORMAL_CONTENT_WRITER_ID = 'FORMAL_CONTENT_WRITER';
  
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.initializeConnection();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
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
      } else if (agentId === this.FORMAL_CONTENT_WRITER_ID) {
        this.threadIds.contentWriter = data.threadId;
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
        timestamp: new Date()
      };

      if (agentId === this.ASTROLOGER_ID) {
        this.astrologerChat.history.push(message);
        this.astrologerChat.isLoading = false;
      } else if (agentId === this.FORMAL_CONTENT_WRITER_ID) {
        this.contentWriterChat.history.push(message);
        this.contentWriterChat.isLoading = false;
      }
    });

    this.socket.on('connect_error', (err: any) => {
      this.error = err?.message || 'WebSocket connection error';
      this.isConnected = false;
    });
  }

  sendMessage(agentType: 'astrologer' | 'contentWriter') {
    if (!this.socket || !this.isConnected) {
      this.error = 'WebSocket is not connected.';
      return;
    }

    const chat = agentType === 'astrologer' ? this.astrologerChat : this.contentWriterChat;
    const agentId = agentType === 'astrologer' ? this.ASTROLOGER_ID : this.FORMAL_CONTENT_WRITER_ID;
    const threadId = agentType === 'astrologer' ? this.threadIds.astrologer : this.threadIds.contentWriter;
    
    const trimmed = (chat.input || '').trim();
    if (!trimmed) return;

    const payload = {
      message: trimmed,
      agentId: agentId,
      userId: 'user-demo-456',
      threadId: threadId
    };

    this.socket.emit('message', payload);
    
    // Add user message to chat history
    const userMessage: ChatMessage = {
      from: 'me',
      payload: payload,
      agentId: agentId,
      timestamp: new Date()
    };
    
    chat.history.push(userMessage);
    chat.isLoading = true;
    chat.input = '';
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
}
