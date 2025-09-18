import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  messages: { role: 'user' | 'teacher'; text: string }[] = [
    { role: 'teacher', text: 'Hello! I am your Teacher AI. How can I help you learn today?' }
  ];

  inputText: string = '';
  thinking: boolean = false;
  private socket?: Socket;
  private conversationId?: string;
  private currentAssistantMessage?: { role: 'teacher'; text: string };

  ngOnInit(): void {
    const backendUrl = (window as any).__API_URL__ || 'http://localhost:3000';
    this.socket = io(backendUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: false,
      auth: {}
    });

    this.socket.on('connect', () => {
      this.socket?.emit('start', { title: 'Teacher Chat' });
    });

    this.socket.on('started', (payload: { conversationId: string }) => {
      this.conversationId = payload.conversationId;
    });

    this.socket.on('message', (payload: { conversationId: string, sender: 'user'|'assistant', content: string }) => {
      if (!this.conversationId || payload.conversationId !== this.conversationId) return;
      if (payload.sender === 'assistant') {
        this.stopThinking();
        this.messages.push({ role: 'teacher', text: payload.content });
      } else {
        this.messages.push({ role: 'user', text: payload.content });
      }
      this.scrollToBottom();
    });

    // Handle streaming chunks
    this.socket.on('assistant_chunk', (payload: { conversationId: string, chunk: string, fullText: string, isComplete: boolean }) => {
      if (!this.conversationId || payload.conversationId !== this.conversationId) return;
      
      if (!payload.isComplete) {
        // First chunk - create new assistant message
        if (!this.currentAssistantMessage) {
          this.stopThinking();
          this.currentAssistantMessage = { role: 'teacher', text: payload.fullText };
          this.messages.push(this.currentAssistantMessage);
        } else {
          // Update existing message
          this.currentAssistantMessage.text = payload.fullText;
        }
        this.scrollToBottom();
      } else {
        // Complete - finalize the message
        if (this.currentAssistantMessage) {
          this.currentAssistantMessage.text = payload.fullText;
          this.currentAssistantMessage = undefined;
        }
        this.scrollToBottom();
      }
    });

    this.socket.on('error', (e: any) => {
      this.stopThinking();
      this.messages.push({ role: 'teacher', text: 'I had trouble responding. Please try again.' });
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('socket connect_error', err);
    });
    this.socket.on('reconnect_error', (err: any) => {
      console.error('socket reconnect_error', err);
    });
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
  }

  async sendMessage() {
    const text = this.inputText?.trim();
    if (!text || this.thinking) return;

    this.messages.push({ role: 'user', text });
    this.inputText = '';
    this.startThinking();
    if (this.socket && this.conversationId) {
      this.socket.emit('message', { conversationId: this.conversationId, content: text });
    } else {
      // Fallback if socket not ready
      const reply = await this.simulateTeacherReply(text);
      this.stopThinking();
      this.messages.push({ role: 'teacher', text: reply });
      this.scrollToBottom();
    }
  }

  private startThinking() {
    this.thinking = true;
    this.scrollToBottom();
  }

  private stopThinking() {
    this.thinking = false;
  }

  private async simulateTeacherReply(question: string): Promise<string> {
    await new Promise(r => setTimeout(r, 1200));
    return `Let’s break this down step by step. ${question} — here is how you can approach it...`;
  }

  private scrollToBottom() {
    // queued to run after view updates
    setTimeout(() => {
      const container = document.querySelector('.chat-scroll');
      if (container) container.scrollTop = container.scrollHeight;
    }, 0);
  }
}
