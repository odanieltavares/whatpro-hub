/**
 * Internal Chat Hooks
 * 
 * React hooks for Internal Chat using TanStack Query + Zustand store.
 * Follows frontend-specialist patterns: proper error handling, loading states.
 * 
 * @see docs/internal-chat/spec.md
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { useInternalChatStore } from '../store';
import { internalChatApi, ApiError } from '../api';
import { getInternalChatSocket } from '../ws';
import type {
  ID,
  Message,
  DraftState,
  CreateRoomRequest,
  CreateMessageRequest,
  UpdateRoomPrefsRequest,
} from '../contracts';

const EMPTY_IDS: ID[] = [];
const EMPTY_MESSAGES: Message[] = [];
const EMPTY_DRAFT: DraftState = {
  text: '',
  quote: null,
  reply_to_message_id: null,
  attachments: [],
};
const EMPTY_TYPING: Record<ID, boolean> = {};

// =============================================================================
// QUERY KEYS
// =============================================================================

export const chatKeys = {
  all: ['internal-chat'] as const,
  settings: (accountId: ID) => [...chatKeys.all, 'settings', accountId] as const,
  rooms: (accountId: ID) => [...chatKeys.all, 'rooms', accountId] as const,
  room: (accountId: ID, roomId: ID) => [...chatKeys.rooms(accountId), roomId] as const,
  messages: (accountId: ID, roomId: ID) => [...chatKeys.room(accountId, roomId), 'messages'] as const,
  mentions: (accountId: ID) => [...chatKeys.all, 'mentions', accountId] as const,
  bookmarks: (accountId: ID) => [...chatKeys.all, 'bookmarks', accountId] as const,
  pins: (accountId: ID, roomId: ID) => [...chatKeys.room(accountId, roomId), 'pins'] as const,
};

// =============================================================================
// ACCOUNT CONTEXT HOOK
// =============================================================================

export function useAccountId(): ID {
  // In production, retrieve from auth context
  const stored = localStorage.getItem('account_id');
  return stored || '1';
}

// =============================================================================
// SETTINGS HOOKS
// =============================================================================

export function useChatSettings() {
  const accountId = useAccountId();
  const setSettings = useInternalChatStore((s) => s.setSettings);
  const setFeatureEnabled = useInternalChatStore((s) => s.setFeatureEnabled);
  const lastSettingsRef = useRef<number>(0);

  const query = useQuery({
    queryKey: chatKeys.settings(accountId),
    queryFn: async () => {
      return internalChatApi.settings.get(accountId);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'FEATURE_DISABLED') {
        setFeatureEnabled(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) return false;
      return failureCount < 3;
    },
  });

  useEffect(() => {
    const data = query.data;
    if (!data) return;
    if (query.dataUpdatedAt === lastSettingsRef.current) return;
    lastSettingsRef.current = query.dataUpdatedAt;
    setSettings(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt, setSettings]);

  return query;
}

export function useFeatureEnabled() {
  return useInternalChatStore((s) => s.featureEnabled);
}

// =============================================================================
// ROOMS HOOKS
// =============================================================================

export function useRooms() {
  const accountId = useAccountId();
  const upsertRooms = useInternalChatStore((s) => s.upsertRooms);
  const setLoadingRooms = useInternalChatStore((s) => s.setLoadingRooms);
  const roomOrder = useInternalChatStore(useShallow((s) => s.roomOrder));
  const roomsById = useInternalChatStore(useShallow((s) => s.roomsById));
  const prefsByRoom = useInternalChatStore(useShallow((s) => s.prefsByRoom));
  const roomFilter = useInternalChatStore((s) => s.roomFilter);
  const rooms = useMemo(() => {
    const ordered = roomOrder.map((id) => roomsById[id]).filter(Boolean);
    switch (roomFilter) {
      case 'open':
        return ordered.filter((room) => room.status === 'open');
      case 'resolved':
        return ordered.filter((room) => room.status === 'resolved');
      case 'archived':
        return ordered.filter((room) => prefsByRoom[room.id]?.is_archived);
      default:
        return ordered.filter((room) => !prefsByRoom[room.id]?.is_archived);
    }
  }, [roomOrder, roomsById, prefsByRoom, roomFilter]);
  const lastRoomsRef = useRef<number>(0);

  const query = useQuery({
    queryKey: chatKeys.rooms(accountId),
    queryFn: async () => {
      const response = await internalChatApi.rooms.list(accountId);
      return response.items;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  useEffect(() => {
    const data = query.data;
    if (!data) return;
    if (query.dataUpdatedAt === lastRoomsRef.current) return;
    lastRoomsRef.current = query.dataUpdatedAt;
    upsertRooms(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt, upsertRooms]);

  useEffect(() => {
    setLoadingRooms(query.isFetching);
  }, [query.isFetching, setLoadingRooms]);

  return {
    ...query,
    rooms,
    isLoadingRooms: useInternalChatStore((s) => s.isLoadingRooms),
  };
}

export function useActiveRoom() {
  const activeRoomId = useInternalChatStore((s) => s.activeRoomId);
  const roomsById = useInternalChatStore(useShallow((s) => s.roomsById));
  return useMemo(() => (activeRoomId ? roomsById[activeRoomId] ?? null : null), [activeRoomId, roomsById]);
}

export function useActiveRoomId() {
  return useInternalChatStore((s) => s.activeRoomId);
}

export function useSetActiveRoom() {
  const setActiveRoom = useInternalChatStore((s) => s.setActiveRoom);
  const socket = getInternalChatSocket();
  const prevRoomId = useRef<ID | null>(null);

  return useCallback(
    (roomId: ID | null) => {
      // Unsubscribe from previous room
      if (prevRoomId.current) {
        socket.unsubscribe(prevRoomId.current);
      }
      // Subscribe to new room
      if (roomId) {
        socket.subscribe(roomId);
      }
      prevRoomId.current = roomId;
      setActiveRoom(roomId);
    },
    [setActiveRoom, socket]
  );
}

export function useRoomFilter() {
  const filter = useInternalChatStore((s) => s.roomFilter);
  const setFilter = useInternalChatStore((s) => s.setRoomFilter);
  return { filter, setFilter };
}

// =============================================================================
// ROOM MUTATIONS
// =============================================================================

export function useCreateRoom() {
  const accountId = useAccountId();
  const queryClient = useQueryClient();
  const upsertRoom = useInternalChatStore((s) => s.upsertRoom);

  return useMutation({
    mutationFn: (data: CreateRoomRequest) => internalChatApi.rooms.create(accountId, data),
    onSuccess: (room) => {
      upsertRoom(room);
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms(accountId) });
    },
  });
}

export function useUpdateRoomStatus() {
  const accountId = useAccountId();
  const upsertRoom = useInternalChatStore((s) => s.upsertRoom);

  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: ID; status: 'open' | 'resolved' }) =>
      internalChatApi.rooms.updateStatus(accountId, roomId, { status }),
    onSuccess: (room) => {
      upsertRoom(room);
    },
  });
}

export function useUpdateRoomPrefs() {
  const accountId = useAccountId();
  const setPrefs = useInternalChatStore((s) => s.setPrefs);

  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: ID; data: UpdateRoomPrefsRequest }) =>
      internalChatApi.rooms.updatePrefs(accountId, roomId, data),
    onSuccess: (prefs) => {
      setPrefs(prefs.room_id, prefs);
    },
  });
}

// =============================================================================
// MESSAGES HOOKS
// =============================================================================

export function useMessages(roomId: ID | null) {
  const accountId = useAccountId();
  const upsertMessages = useInternalChatStore((s) => s.upsertMessages);
  const setLoadingMessages = useInternalChatStore((s) => s.setLoadingMessages);
  const messagesById = useInternalChatStore(useShallow((s) => s.messagesById));
  const lastSyncRef = useRef<{ roomId: ID | null; count: number; lastId: ID | null; dataUpdatedAt: number; idsHash: string }>({
    roomId: null,
    count: 0,
    lastId: null,
    dataUpdatedAt: 0,
    idsHash: '',
  });

  const query = useInfiniteQuery({
    queryKey: roomId ? chatKeys.messages(accountId, roomId) : ['internal-chat', 'messages', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!roomId) throw new Error('No room selected');
      return internalChatApi.messages.list(accountId, roomId, {
        cursor: pageParam,
        limit: 50,
        dir: 'back',
      });
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled: !!roomId,
    staleTime: 30 * 1000,
    initialPageParam: undefined as ID | undefined,
  });

  useEffect(() => {
    if (!roomId) return;
    setLoadingMessages(roomId, query.isFetching);
  }, [query.isFetching, roomId, setLoadingMessages]);

  // Sync to store when data changes (guarded against ping-pong)
  useEffect(() => {
    if (!roomId || !query.data) return;
    const allMessages = query.data.pages.flatMap((p) => p.items);
    const count = allMessages.length;
    const lastId = count > 0 ? allMessages[count - 1].id : null;
    const idsHash = allMessages.map((m) => m.id).join('|');
    const lastSync = lastSyncRef.current;
    if (
      lastSync.roomId === roomId &&
      lastSync.count === count &&
      lastSync.lastId === lastId &&
      lastSync.dataUpdatedAt === query.dataUpdatedAt &&
      lastSync.idsHash === idsHash
    ) {
      return;
    }
    upsertMessages(roomId, allMessages);
    lastSyncRef.current = {
      roomId,
      count,
      lastId,
      dataUpdatedAt: query.dataUpdatedAt,
      idsHash,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt, roomId, upsertMessages]);

  const roomMessageIds = useInternalChatStore(
    useShallow((s) => (roomId ? s.messagesByRoom[roomId] ?? EMPTY_IDS : EMPTY_IDS))
  );
  const messages = useMemo(
    () => roomMessageIds.map((id) => messagesById[id]).filter(Boolean),
    [roomMessageIds, messagesById]
  );

  return {
    ...query,
    messages,
    isLoadingMessages: useInternalChatStore((s) => (roomId ? s.isLoadingMessages[roomId] : false)),
    loadMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
  };
}

export function useActiveMessages() {
  const activeRoomId = useInternalChatStore((s) => s.activeRoomId);
  const messagesByRoom = useInternalChatStore(useShallow((s) => s.messagesByRoom));
  const messagesById = useInternalChatStore(useShallow((s) => s.messagesById));
  return useMemo(() => {
    if (!activeRoomId) return EMPTY_MESSAGES;
    const ids = messagesByRoom[activeRoomId] ?? EMPTY_IDS;
    return ids.map((id) => messagesById[id]).filter(Boolean);
  }, [activeRoomId, messagesByRoom, messagesById]);
}

// =============================================================================
// MESSAGE MUTATIONS
// =============================================================================

export function useSendMessage() {
  const accountId = useAccountId();
  const activeRoomId = useActiveRoomId();
  const markPending = useInternalChatStore((s) => s.markPending);
  const failPending = useInternalChatStore((s) => s.failPending);
  const resetDraft = useInternalChatStore((s) => s.resetDraft);
  const socket = getInternalChatSocket();

  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId?: ID; data: CreateMessageRequest }) => {
      const targetRoom = roomId || activeRoomId;
      if (!targetRoom) throw new Error('No room selected');

      const clientMsgId = data.client_msg_id;

      // Mark as pending
      markPending({
        client_msg_id: clientMsgId,
        room_id: targetRoom,
        created_at: Date.now(),
        status: 'sending',
      });

      // Send via WebSocket if connected, else REST
      if (socket.isConnected) {
        socket.sendMessage(targetRoom, clientMsgId, data);
        // The ack will be handled via WS events
        return { client_msg_id: clientMsgId } as Message;
      }

      // Fallback to REST
      return internalChatApi.messages.create(accountId, targetRoom, data, clientMsgId);
    },
    onSuccess: (_, { roomId }) => {
      const targetRoom = roomId || activeRoomId;
      if (targetRoom) resetDraft(targetRoom);
    },
    onError: (error, { data }) => {
      failPending(data.client_msg_id, error instanceof Error ? error.message : 'Unknown error');
    },
  });
}

export function useEditMessage() {
  const accountId = useAccountId();
  const upsertMessage = useInternalChatStore((s) => s.upsertMessage);

  return useMutation({
    mutationFn: ({ roomId, messageId, content }: { roomId: ID; messageId: ID; content: string }) =>
      internalChatApi.messages.update(accountId, roomId, messageId, { content }),
    onSuccess: (message) => {
      upsertMessage(message);
    },
  });
}

export function useDeleteMessage() {
  const accountId = useAccountId();
  const deleteMessage = useInternalChatStore((s) => s.deleteMessage);

  return useMutation({
    mutationFn: ({ roomId, messageId }: { roomId: ID; messageId: ID }) =>
      internalChatApi.messages.delete(accountId, roomId, messageId),
    onSuccess: (_, { roomId, messageId }) => {
      deleteMessage(roomId, messageId, new Date().toISOString(), accountId);
    },
  });
}

// =============================================================================
// DRAFT HOOKS
// =============================================================================

export function useDraft() {
  const activeRoomId = useActiveRoomId();
  const draftsByRoom = useInternalChatStore(useShallow((s) => s.draftsByRoom));
  const draft = useMemo(() => {
    if (!activeRoomId) return EMPTY_DRAFT;
    return draftsByRoom[activeRoomId] ?? EMPTY_DRAFT;
  }, [activeRoomId, draftsByRoom]);
  const setDraftText = useInternalChatStore((s) => s.setDraftText);
  const setDraftQuote = useInternalChatStore((s) => s.setDraftQuote);
  const setDraftReply = useInternalChatStore((s) => s.setDraftReply);
  const resetDraft = useInternalChatStore((s) => s.resetDraft);

  return {
    draft,
    setText: useCallback(
      (text: string) => activeRoomId && setDraftText(activeRoomId, text),
      [activeRoomId, setDraftText]
    ),
    setQuote: useCallback(
      (quote: Message['quote']) => activeRoomId && setDraftQuote(activeRoomId, quote ?? null),
      [activeRoomId, setDraftQuote]
    ),
    setReply: useCallback(
      (replyTo: ID | null) => activeRoomId && setDraftReply(activeRoomId, replyTo),
      [activeRoomId, setDraftReply]
    ),
    reset: useCallback(
      () => activeRoomId && resetDraft(activeRoomId),
      [activeRoomId, resetDraft]
    ),
  };
}

// =============================================================================
// TYPING HOOKS
// =============================================================================

export function useTyping(roomId: ID | null) {
  const typingByRoom = useInternalChatStore(useShallow((s) => s.typingByRoom));
  const typingUsers = useMemo(() => {
    if (!roomId) return EMPTY_IDS;
    const typing = typingByRoom[roomId] ?? EMPTY_TYPING;
    return Object.entries(typing)
      .filter(([, isTyping]) => isTyping)
      .map(([userId]) => userId);
  }, [roomId, typingByRoom]);
  const socket = getInternalChatSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId) return;
      socket.sendTyping(roomId, isTyping);

      // Auto-clear typing after 5s
      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.sendTyping(roomId, false);
        }, 5000);
      }
    },
    [roomId, socket]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return { typingUsers, sendTyping };
}

// =============================================================================
// REACTIONS HOOKS
// =============================================================================

export function useReaction() {
  const accountId = useAccountId();

  const addReaction = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: ID; emoji: string }) =>
      internalChatApi.reactions.add(accountId, messageId, { emoji }),
  });

  const removeReaction = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: ID; emoji: string }) =>
      internalChatApi.reactions.remove(accountId, messageId, emoji),
  });

  return { addReaction, removeReaction };
}

// =============================================================================
// MARK AS READ
// =============================================================================

export function useMarkAsRead() {
  const accountId = useAccountId();
  const socket = getInternalChatSocket();

  return useCallback(
    (roomId: ID, lastMessageId: ID) => {
      // Prefer WebSocket for instant feedback
      if (socket.isConnected) {
        socket.markRead(roomId, lastMessageId);
      } else {
        internalChatApi.rooms.markRead(accountId, roomId, { last_read_message_id: lastMessageId });
      }
    },
    [accountId, socket]
  );
}

// =============================================================================
// WEBSOCKET CONNECTION HOOK
// =============================================================================

export function useChatConnection() {
  const socket = getInternalChatSocket();
  const queryClient = useQueryClient();
  const accountId = useAccountId();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    socket.connect(token);

    // Note: Resync is handled via applyWSEvent in store which returns needsResync flag
    // In production, we'd add event emitter to socket for resync callbacks

    return () => {
      socket.disconnect();
    };
  }, [socket, queryClient, accountId]);

  return { isConnected: socket.isConnected };
}
