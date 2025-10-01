import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: 'user' | 'agent' | 'system';
  senderId: string;
  senderRef: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  _id: string;
  user_id: string;
  agent_id: string;
  status: string;
  last_message_text: string;
  last_message_send_by: 'User' | 'System';
  unread_messages_count: number;
  last_message_timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';
  private authToken: string | null = null;

  constructor(private http: HttpClient) {
    // Get auth token from localStorage or sessionStorage
    this.authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (this.authToken) {
      headers = headers.set('Authorization', `Bearer ${this.authToken}`);
    }
    return headers;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }

  getUserConnectionId(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/connection-id`);
  }

  // Chat and Conversation APIs
  getChats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/chats`, { headers: this.getHeaders() });
  }

  getChat(chatId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/chats/${chatId}`, { headers: this.getHeaders() });
  }

  createChat(agentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/chats`, { agentId }, { headers: this.getHeaders() });
  }

  getConversationHistory(conversationId: string, page: number = 1, limit: number = 50): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/chats/${conversationId}/history?page=${page}&limit=${limit}`, { headers: this.getHeaders() });
  }

}

