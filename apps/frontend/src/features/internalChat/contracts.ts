/**
 * Internal Chat Contracts - Production Types
 * 
 * Complete TypeScript contracts for the Internal Team Chat feature.
 * Based on Production Spec v1.1.0
 * 
 * @see docs/internal-chat/spec.md
 */

// =============================================================================
// BASE TYPES
// =============================================================================

export type ID = string;
export type ISODate = string;

// =============================================================================
// ENUMS / UNION TYPES
// =============================================================================

export type RoomType = 'dm' | 'group';
export type RoomStatus = 'open' | 'resolved';

export type MemberRole = 'owner' | 'moderator' | 'member' | 'viewer';

export type MessageType = 'text' | 'system' | 'note' | 'attachment' | 'event';
export type Visibility = 'all' | 'role' | 'users' | 'self';

export type NotificationLevel = 'all' | 'mentions' | 'none';
export type NotificationStyle = 'native' | 'chatwoot_like';

export type AttachmentStatus = 'pending' | 'ready' | 'failed';
export type PresenceStatus = 'online' | 'offline';

// =============================================================================
// ACCOUNT / SETTINGS
// =============================================================================

export interface AccountChatSettings {
  account_id: ID;
  internal_chat_enabled: boolean;
  retention_days: number;
  resolve_policy: 'mods_only' | 'all_members';
  notification_style: NotificationStyle;
  updated_at: ISODate;
}

// =============================================================================
// ROOMS
// =============================================================================

export interface Room {
  id: ID;
  account_id: ID;
  type: RoomType;
  name: string | null;
  status: RoomStatus;
  created_by: ID;
  created_at: ISODate;
  updated_at: ISODate;
  last_activity_at: ISODate;
  seq: number;

  resolved_at: ISODate | null;
  resolved_by: ID | null;

  // Derived (server-computed)
  unread_count?: number;
  last_message_preview?: string | null;
}

export interface RoomMember {
  room_id: ID;
  account_id: ID;
  user_id: ID;
  role: MemberRole;
  joined_at: ISODate;
  removed_at: ISODate | null;

  last_read_message_id: ID | null;
  last_seen_at: ISODate | null;

  user?: User;
}

export interface RoomMemberPrefs {
  room_id: ID;
  account_id: ID;
  user_id: ID;

  mute_until: ISODate | null;
  notification_level: NotificationLevel;
  is_archived: boolean;
  is_pinned: boolean;

  updated_at: ISODate;
}

// =============================================================================
// USERS
// =============================================================================

export interface User {
  id: ID;
  name: string;
  email: string;
  avatar_url?: string;
}

// =============================================================================
// MESSAGES
// =============================================================================

export interface VisibilityMeta {
  role?: 'owner' | 'moderator';
  user_ids?: ID[];
}

export interface Message {
  id: ID;
  account_id: ID;
  room_id: ID;

  client_msg_id: ID;
  author_id: ID;

  type: MessageType;
  visibility: Visibility;
  visibility_meta: VisibilityMeta | null;

  content: string;
  reply_to_message_id: ID | null;

  created_at: ISODate;
  edited_at: ISODate | null;
  edited_by: ID | null;

  deleted_at: ISODate | null;
  deleted_by: ID | null;

  quote?: QuotePayload | null;
  attachments?: Attachment[];
  reactions?: Reaction[];
  bookmarked_by_me?: boolean;

  // Derived
  author?: User;
}

// =============================================================================
// ATTACHMENTS
// =============================================================================

export interface Attachment {
  id: ID;
  account_id: ID;
  message_id: ID;
  object_key: string;
  mime: string;
  size: number;
  sha256?: string;
  status: AttachmentStatus;
  created_at: ISODate;

  // Derived (presigned URL)
  url?: string;
}

// =============================================================================
// REACTIONS / BOOKMARKS / PINS
// =============================================================================

export interface Reaction {
  message_id: ID;
  user_id: ID;
  emoji: string;
  created_at: ISODate;
}

export interface Bookmark {
  message_id: ID;
  user_id: ID;
  created_at: ISODate;
}

export interface Pin {
  room_id: ID;
  message_id: ID;
  pinned_by: ID;
  pinned_at: ISODate;
}

// =============================================================================
// MENTIONS
// =============================================================================

export interface Mention {
  id: ID;
  account_id: ID;
  room_id: ID;
  message_id: ID;
  mentioned_user_id: ID;
  created_at: ISODate;
  read_at: ISODate | null;
}

// =============================================================================
// CHATWOOT CONTEXT (QUOTE/CARD)
// =============================================================================

export interface ChatwootConversationSnapshot {
  conversation_id: number;
  inbox_id?: number;
  contact_id?: number;
  subject?: string;
  preview?: string;
  tags?: string[];
  assignee_name?: string;
  link: string;
  captured_at: ISODate;
}

export interface QuotePayload {
  source: 'chatwoot';
  snapshot: ChatwootConversationSnapshot;
}

// =============================================================================
// REST API: REQUESTS
// =============================================================================

export interface CreateRoomRequest {
  type: RoomType;
  member_ids: ID[];
  name?: string;
}

export interface UpdateRoomRequest {
  name?: string;
}

export interface UpdateRoomStatusRequest {
  status: RoomStatus;
}

export interface CreateMessageRequest {
  client_msg_id: ID;
  type: Extract<MessageType, 'text' | 'note' | 'attachment'>;
  visibility: Visibility;
  visibility_meta?: VisibilityMeta | null;
  content: string;
  reply_to_message_id?: ID | null;
  quote?: QuotePayload | null;
  attachments?: Array<Pick<Attachment, 'object_key' | 'mime' | 'size' | 'sha256'>>;
  mentions?: Array<{ user_id: ID }>;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface MarkRoomReadRequest {
  last_read_message_id: ID;
}

export interface UpdateRoomPrefsRequest {
  mute_until?: ISODate | null;
  notification_level?: NotificationLevel;
  is_archived?: boolean;
  is_pinned?: boolean;
}

export interface AddReactionRequest {
  emoji: string;
}

export interface PresignUploadRequest {
  mime: string;
  size: number;
  sha256: string;
}

// =============================================================================
// REST API: RESPONSES
// =============================================================================

export interface Paginated<T> {
  items: T[];
  next_cursor: ID | null;
}

export interface PresignUploadResponse {
  object_key: string;
  url: string;
  fields?: Record<string, string>;
  expires_at: ISODate;
}

// =============================================================================
// WEBSOCKET: CLIENT -> SERVER
// =============================================================================

export type WSClientOp =
  | { op: 'sub'; room_id: ID }
  | { op: 'unsub'; room_id: ID }
  | { op: 'typing'; room_id: ID; is_typing: boolean }
  | { op: 'msg_send'; room_id: ID; client_msg_id: ID; idempotency_key: ID; payload: CreateMessageRequest }
  | { op: 'room_read'; room_id: ID; last_read_message_id: ID }
  | { op: 'ping'; t: number };

// =============================================================================
// WEBSOCKET: SERVER -> CLIENT
// =============================================================================

export type WSServerEvent =
  | { event: 'message.ack'; room_id: ID; client_msg_id: ID; message_id: ID; seq: number; created_at: ISODate }
  | { event: 'message.created'; room_id: ID; seq: number; message: Message }
  | { event: 'message.updated'; room_id: ID; seq: number; message: Message }
  | { event: 'message.deleted'; room_id: ID; seq: number; message_id: ID; deleted_at: ISODate; deleted_by: ID }
  | { event: 'room.read'; room_id: ID; seq: number; user_id: ID; last_read_message_id: ID }
  | { event: 'room.resolved'; room_id: ID; seq: number; resolved_by: ID; resolved_at: ISODate }
  | { event: 'room.reopened'; room_id: ID; seq: number; reopened_by: ID; reopened_at: ISODate }
  | { event: 'room.updated'; room_id: ID; seq: number; room: Room }
  | { event: 'typing.on'; room_id: ID; user_id: ID }
  | { event: 'typing.off'; room_id: ID; user_id: ID }
  | { event: 'presence.update'; user_id: ID; status: PresenceStatus }
  | { event: 'account.feature.updated'; account_id: ID; internal_chat_enabled: boolean }
  | { event: 'error'; code: string; message: string }
  | { event: 'pong'; t: number };

// =============================================================================
// STORE TYPES
// =============================================================================

export interface DraftState {
  text: string;
  quote: QuotePayload | null;
  reply_to_message_id: ID | null;
  attachments: Array<{ object_key: string; mime: string; size: number; sha256?: string }>;
}

export interface PendingMessage {
  client_msg_id: ID;
  room_id: ID;
  created_at: number;
  status: 'sending' | 'failed';
  error?: string;
}
