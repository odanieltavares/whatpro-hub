// Chat API hooks for WhatPro Hub Internal Chat

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ChatRoom,
  ChatMessage,
  CreateRoomRequest,
  SendMessageRequest,
  ChatRoomsResponse,
  ChatMessagesResponse,
  ChatRoomResponse,
  ChatMessageResponse,
  AccountUsersResponse,
  AccountUser,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
const MOCK_ENABLED =
  (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mock') === '1') ||
  import.meta.env.VITE_CHAT_MOCK === '1';

// Helper to get account ID from localStorage (or auth context)
const getAccountId = (): number => {
  const accountId = localStorage.getItem('account_id');
  return accountId ? parseInt(accountId, 10) : 1;
};

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const accountId = getAccountId();

  const response = await fetch(`${API_BASE}/accounts/${accountId}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
  }

  return response.json();
}

const normalizeUserName = (user: AccountUser): string => {
  if (user.name && user.name.trim()) return user.name.trim();
  if (user.email && user.email.trim()) return user.email.trim();
  return `Usuario ${user.id}`;
};

// ============================================================================
// ROOMS HOOKS
// ============================================================================

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchRooms = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      const response = await apiCall<ChatRoomsResponse>('/chat/rooms');
      setRooms(response.data);
      setError(null);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (MOCK_ENABLED) {
      setRooms([]);
      setLoading(false);
      return;
    }
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (MOCK_ENABLED) return;
    const interval = setInterval(() => {
      fetchRooms();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  return { rooms, loading, error, refetch: fetchRooms };
}

export function useChatRoom(roomId: string | null) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }

    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await apiCall<ChatRoomResponse>(`/chat/rooms/${roomId}`);
        setRoom(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  return { room, loading, error };
}

// ============================================================================
// USERS HOOKS
// ============================================================================

export function useAccountUsers() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall<{ data: AccountUsersResponse }>('/users');
      const currentUserId = parseInt(localStorage.getItem('user_id') || '0', 10);
      const filtered = response.data.users
        .filter((user) => user.id !== currentUserId)
        .map((user) => ({ ...user, name: normalizeUserName(user) }));
      setUsers(filtered);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (MOCK_ENABLED) {
      setUsers([]);
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}

export function useCreateRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async (request: CreateRoomRequest): Promise<ChatRoom | null> => {
    if (MOCK_ENABLED) {
      return {
        id: `mock-${Date.now()}`,
        account_id: getAccountId(),
        type: request.type,
        name: request.name || 'Direct Message',
        created_by: parseInt(localStorage.getItem('user_id') || '0', 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    try {
      setLoading(true);
      const response = await apiCall<ChatRoomResponse>('/chat/rooms', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      setError(null);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createRoom, loading, error };
}

// ============================================================================
// MESSAGES HOOKS
// ============================================================================

export function useChatMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const currentRoomRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async (reset = false) => {
    if (!roomId || MOCK_ENABLED) return;

    try {
      const isNewRoom = currentRoomRef.current !== roomId;
      const shouldSetLoading = !hasLoadedRef.current || isNewRoom;
      if (shouldSetLoading) setLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (!reset && cursor) {
        params.append('cursor', cursor);
      }

      const response = await apiCall<ChatMessagesResponse>(
        `/chat/rooms/${roomId}/messages?${params}`
      );

      if (reset) {
        setMessages(response.data);
      } else {
        setMessages(prev => [...prev, ...response.data]);
      }

      setCursor(response.next_cursor || null);
      setHasMore(!!response.next_cursor);
      setError(null);
      hasLoadedRef.current = true;
      currentRoomRef.current = roomId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [roomId, cursor]);

  useEffect(() => {
    if (MOCK_ENABLED) {
      setMessages([]);
      setCursor(null);
      setHasMore(false);
      hasLoadedRef.current = false;
      currentRoomRef.current = null;
      return;
    }
    if (roomId) {
      fetchMessages(true);
    } else {
      setMessages([]);
      setCursor(null);
      setHasMore(true);
      hasLoadedRef.current = false;
      currentRoomRef.current = null;
    }
  }, [roomId, fetchMessages]);

  useEffect(() => {
    if (!roomId || MOCK_ENABLED) return;
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, fetchMessages]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchMessages(false);
    }
  }, [hasMore, loading, fetchMessages]);

  return { messages, loading, error, hasMore, loadMore, refetch: () => fetchMessages(true) };
}

export function useSendMessage(roomId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<ChatMessage | null> => {
    if (!roomId) return null;
    if (MOCK_ENABLED) {
      setError(null);
      return {
        id: `mock-${Date.now()}`,
        room_id: roomId,
        account_id: getAccountId(),
        sender_id: parseInt(localStorage.getItem('user_id') || '0', 10),
        content: request.content,
        message_type: request.message_type || 'text',
        created_at: new Date().toISOString(),
      };
    }

    try {
      setLoading(true);
      const response = await apiCall<ChatMessageResponse>(`/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      setError(null);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  return { sendMessage, loading, error };
}

// ============================================================================
// MEMBER HOOKS
// ============================================================================

export function useAddMember(roomId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = useCallback(async (userId: number): Promise<boolean> => {
    if (!roomId) return false;

    try {
      setLoading(true);
      await apiCall(`/chat/rooms/${roomId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  return { addMember, loading, error };
}

export function useRemoveMember(roomId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeMember = useCallback(async (userId: number): Promise<boolean> => {
    if (!roomId) return false;

    try {
      setLoading(true);
      await apiCall(`/chat/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE',
      });
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      return false;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  return { removeMember, loading, error };
}

// ============================================================================
// READ STATUS HOOKS
// ============================================================================

export function useMarkAsRead(roomId: string | null) {
  const markAsRead = useCallback(async (): Promise<boolean> => {
    if (!roomId) return false;
    if (MOCK_ENABLED) return true;

    try {
      await apiCall(`/chat/rooms/${roomId}/read`, {
        method: 'POST',
      });
      return true;
    } catch {
      return false;
    }
  }, [roomId]);

  return { markAsRead };
}










