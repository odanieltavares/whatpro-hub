// Chat API types for WhatPro Hub Internal Chat

export type ChatRoomType = 'dm' | 'room';
export type ChatMemberRole = 'owner' | 'moderator' | 'member';
export type ChatMessageType = 'text' | 'system' | 'mention' | 'alert' | 'private';

export interface ChatRoom {
  id: string;
  account_id: number;
  type: ChatRoomType;
  name: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  members?: ChatMember[];
}

export interface ChatMember {
  id: string;
  room_id: string;
  user_id: number;
  role: ChatMemberRole;
  last_read_at?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ChatMessage {
  id: string;
  room_id: string;
  account_id: number;
  sender_id: number;
  content: string;
  message_type: ChatMessageType;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  status?: 'sending' | 'sent' | 'failed';  // Message delivery status
  reply_to?: ChatMessage;  // Structured reply (no parsing needed)
  quote?: {
    conversation_id: number;
    chatwoot_message_id: number;
    chatwoot_account_id: number;
  };
  sender?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateRoomRequest {
  type: ChatRoomType;
  name?: string;
  member_ids: number[];
}

export interface SendMessageRequest {
  content: string;
  message_type?: ChatMessageType;
  quote?: {
    chatwoot_account_id: number;
    conversation_id: number;
    chatwoot_message_id: number;
  };
}

export interface AddMemberRequest {
  user_id: number;
}

export interface ChatRoomsResponse {
  data: ChatRoom[];
  count: number;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  count: number;
  next_cursor?: string;
}

export interface ChatRoomResponse {
  data: ChatRoom;
}

export interface ChatMessageResponse {
  data: ChatMessage;
}

export interface AccountUser {
  id: number;
  name?: string;
  email?: string;
  avatar_url?: string;
  whatpro_role?: string;
}

export interface AccountUsersResponse {
  users: AccountUser[];
  total: number;
}
