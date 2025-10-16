/**
 * Conversation domain types
 */

export type ConversationStatus = 'active' | 'completed' | 'abandoned';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'voice' | 'text' | 'system';

export interface Conversation {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  status: ConversationStatus;
  emotionalTags: string[];
  primaryTopic: string;
  satisfactionRating?: number;
  sessionId: string;
  summary?: string;
}

export interface ConversationResponse {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  status: ConversationStatus;
  emotionalTags: string[];
  primaryTopic: string;
  satisfactionRating?: number;
  sessionId: string;
  summary?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  messageType: MessageType;
  textContent: string;
  audioUrl?: string;
  timestamp: Date;
  emotionalTone?: string;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  sttConfidence?: number;
  ttsLatency?: number;
  gptTokens?: number;
  processingTimeMs?: number;
}

export interface ConversationMessageResponse {
  id: string;
  conversationId: string;
  role: MessageRole;
  messageType: MessageType;
  textContent: string;
  audioUrl?: string;
  timestamp: string;
  emotionalTone?: string;
  metadata: MessageMetadata;
}

export interface CreateConversationResponse {
  id: string;
  userId: string;
  startedAt: string;
  status: ConversationStatus;
  sessionId: string;
}

export interface UpdateConversationRequest {
  status?: ConversationStatus;
  satisfactionRating?: number;
}
