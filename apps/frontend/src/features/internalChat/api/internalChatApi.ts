/**
 * Internal Chat REST API Client
 * 
 * Type-safe API client for Internal Team Chat endpoints.
 * Follows frontend-specialist patterns: strict TypeScript, proper error handling.
 * 
 * @see docs/internal-chat/spec.md
 */

import type {
  ID,
  Room,
  Message,
  RoomMemberPrefs,
  AccountChatSettings,
  Paginated,
  CreateRoomRequest,
  UpdateRoomRequest,
  UpdateRoomStatusRequest,
  CreateMessageRequest,
  UpdateMessageRequest,
  MarkRoomReadRequest,
  UpdateRoomPrefsRequest,
  AddReactionRequest,
  PresignUploadRequest,
  PresignUploadResponse,
  Mention,
  Pin,
  Bookmark,
} from '../contracts';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// BASE FETCH
// =============================================================================

import { tokenStorage } from '@/utils/tokenStorage';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = { code: 'UNKNOWN_ERROR', message: response.statusText };
    }
    throw new ApiError(
      response.status,
      errorData.code,
      errorData.message,
      errorData.details
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// =============================================================================
// SETTINGS API
// =============================================================================

export const settingsApi = {
  get: (accountId: ID): Promise<AccountChatSettings> =>
    apiFetch(`/accounts/${accountId}/internal-chat/settings`),

  update: (
    accountId: ID,
    data: Partial<AccountChatSettings>
  ): Promise<AccountChatSettings> =>
    apiFetch(`/accounts/${accountId}/internal-chat/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// ROOMS API
// =============================================================================

export interface ListRoomsParams {
  archived?: boolean;
  pinned?: boolean;
  status?: 'open' | 'resolved';
  q?: string;
  cursor?: ID;
  limit?: number;
}

export const roomsApi = {
  list: (accountId: ID, params?: ListRoomsParams): Promise<Paginated<Room>> => {
    const searchParams = new URLSearchParams();
    if (params?.archived !== undefined) searchParams.set('archived', String(params.archived));
    if (params?.pinned !== undefined) searchParams.set('pinned', String(params.pinned));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return apiFetch(`/accounts/${accountId}/internal-chat/rooms${query ? `?${query}` : ''}`);
  },

  get: (accountId: ID, roomId: ID): Promise<Room> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}`),

  create: (accountId: ID, data: CreateRoomRequest): Promise<Room> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (accountId: ID, roomId: ID, data: UpdateRoomRequest): Promise<Room> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStatus: (
    accountId: ID,
    roomId: ID,
    data: UpdateRoomStatusRequest
  ): Promise<Room> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  addMember: (accountId: ID, roomId: ID, userId: ID): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  removeMember: (accountId: ID, roomId: ID, userId: ID): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/members/${userId}`, {
      method: 'DELETE',
    }),

  updatePrefs: (
    accountId: ID,
    roomId: ID,
    data: UpdateRoomPrefsRequest
  ): Promise<RoomMemberPrefs> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/prefs`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  markRead: (accountId: ID, roomId: ID, data: MarkRoomReadRequest): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/read`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// MESSAGES API
// =============================================================================

export interface ListMessagesParams {
  cursor?: ID;
  limit?: number;
  dir?: 'back' | 'forward';
}

export const messagesApi = {
  list: (
    accountId: ID,
    roomId: ID,
    params?: ListMessagesParams
  ): Promise<Paginated<Message>> => {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.dir) searchParams.set('dir', params.dir);

    const query = searchParams.toString();
    return apiFetch(
      `/accounts/${accountId}/internal-chat/rooms/${roomId}/messages${query ? `?${query}` : ''}`
    );
  },

  create: (
    accountId: ID,
    roomId: ID,
    data: CreateMessageRequest,
    idempotencyKey: ID
  ): Promise<Message> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(data),
    }),

  update: (
    accountId: ID,
    roomId: ID,
    messageId: ID,
    data: UpdateMessageRequest
  ): Promise<Message> =>
    apiFetch(
      `/accounts/${accountId}/internal-chat/rooms/${roomId}/messages/${messageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  delete: (accountId: ID, roomId: ID, messageId: ID): Promise<void> =>
    apiFetch(
      `/accounts/${accountId}/internal-chat/rooms/${roomId}/messages/${messageId}`,
      { method: 'DELETE' }
    ),
};

// =============================================================================
// REACTIONS API
// =============================================================================

export const reactionsApi = {
  add: (accountId: ID, messageId: ID, data: AddReactionRequest): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (accountId: ID, messageId: ID, emoji: string): Promise<void> =>
    apiFetch(
      `/accounts/${accountId}/internal-chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      { method: 'DELETE' }
    ),
};

// =============================================================================
// BOOKMARKS API
// =============================================================================

export const bookmarksApi = {
  list: (accountId: ID): Promise<Paginated<Bookmark & { message: Message }>> =>
    apiFetch(`/accounts/${accountId}/internal-chat/bookmarks`),

  add: (accountId: ID, messageId: ID): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/messages/${messageId}/bookmark`, {
      method: 'POST',
    }),

  remove: (accountId: ID, messageId: ID): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/messages/${messageId}/bookmark`, {
      method: 'DELETE',
    }),
};

// =============================================================================
// PINS API
// =============================================================================

export const pinsApi = {
  list: (accountId: ID, roomId: ID): Promise<Paginated<Pin & { message: Message }>> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/pins`),

  add: (accountId: ID, roomId: ID, messageId: ID): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/pins`, {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId }),
    }),

  remove: (accountId: ID, roomId: ID, messageId: ID): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/rooms/${roomId}/pins/${messageId}`, {
      method: 'DELETE',
    }),
};

// =============================================================================
// MENTIONS API
// =============================================================================

export const mentionsApi = {
  list: (accountId: ID, unread?: boolean): Promise<Paginated<Mention & { message: Message }>> => {
    const query = unread !== undefined ? `?unread=${unread}` : '';
    return apiFetch(`/accounts/${accountId}/internal-chat/mentions${query}`);
  },

  markRead: (accountId: ID, mentionId: ID): Promise<void> =>
    apiFetch(`/accounts/${accountId}/internal-chat/mentions/${mentionId}/read`, {
      method: 'POST',
    }),
};

// =============================================================================
// UPLOADS API
// =============================================================================

export const uploadsApi = {
  presign: (accountId: ID, data: PresignUploadRequest): Promise<PresignUploadResponse> =>
    apiFetch(`/accounts/${accountId}/internal-chat/uploads/presign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// CHATWOOT CONTEXT API
// =============================================================================

export interface ChatwootSnapshot {
  conversation_id: number;
  inbox_id?: number;
  contact_id?: number;
  subject?: string;
  preview?: string;
  tags?: string[];
  assignee_name?: string;
  link: string;
  captured_at: string;
}

export const chatwootApi = {
  getConversationSnapshot: (
    accountId: ID,
    conversationId: number
  ): Promise<ChatwootSnapshot> =>
    apiFetch(`/accounts/${accountId}/chatwoot/conversations/${conversationId}/snapshot`),
};

// =============================================================================
// COMBINED API EXPORT
// =============================================================================

export const internalChatApi = {
  settings: settingsApi,
  rooms: roomsApi,
  messages: messagesApi,
  reactions: reactionsApi,
  bookmarks: bookmarksApi,
  pins: pinsApi,
  mentions: mentionsApi,
  uploads: uploadsApi,
  chatwoot: chatwootApi,
};
