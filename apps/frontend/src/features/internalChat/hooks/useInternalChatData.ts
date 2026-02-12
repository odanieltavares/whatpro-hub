import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import type { ChatMessage, ChatRoom } from '../../chat/types';
import type { AccountUser } from '../../chat/types';
import type { Message as InternalMessage, Room } from '../contracts';
import { internalChatApi } from '../api';
import { useInternalChatStore } from '../store';
import {
  useAccountId,
  useRooms,
  useActiveRoom,
  useActiveRoomId,
  useSetActiveRoom,
  useRoomFilter,
  useMessages,
  useSendMessage,
  useEditMessage,
  useDraft,
  useTyping,
  useMarkAsRead,
  useUpdateRoomPrefs,
} from './useChatHooks';

const CURRENT_USER_ID = '1';

function toLegacyRoom(room: Room): ChatRoom {
  return {
    id: room.id,
    account_id: Number(room.account_id),
    type: room.type === 'dm' ? 'dm' : 'room',
    name: room.name || 'Conversa',
    created_by: Number(room.created_by),
    last_message: room.last_message_preview || undefined,
    last_message_at: room.last_activity_at,
    unread_count: room.unread_count,
    created_at: room.created_at,
    updated_at: room.updated_at,
  };
}

function toLegacyMessage(msg: InternalMessage): ChatMessage {
  const legacy: ChatMessage & { reply_to_message_id?: string } = {
    id: msg.id,
    room_id: msg.room_id,
    account_id: Number(msg.account_id),
    sender_id: Number(msg.author_id),
    content: msg.content,
    message_type: msg.type === 'note' ? 'private' : 'text',
    reply_to_message_id: msg.reply_to_message_id || undefined,
    created_at: msg.created_at,
    edited_at: msg.edited_at || undefined,
    deleted_at: msg.deleted_at || undefined,
    sender: msg.author
      ? {
          id: Number(msg.author.id),
          name: msg.author.name,
          email: msg.author.email,
          avatar_url: msg.author.avatar_url,
        }
      : undefined,
  };

  return legacy;
}

const groupAvatar = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Grupo')}&background=1e3a8a&color=ffffff&bold=true`;
const dmAvatar = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Contato')}&background=e2e8f0&color=0f172a&bold=true`;

export function useInternalChatData() {
  const accountId = useAccountId();
  const queryClient = useQueryClient();
  const { rooms } = useRooms();
  const activeRoom = useActiveRoom();
  const activeRoomId = useActiveRoomId();
  const setActiveRoom = useSetActiveRoom();
  const { filter, setFilter } = useRoomFilter();

  const { messages, isLoadingMessages, loadMore, hasMore } = useMessages(activeRoomId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: editMessage } = useEditMessage();
  const { draft, reset: resetDraft } = useDraft();
  const { typingUsers } = useTyping(activeRoomId);
  const markAsRead = useMarkAsRead();
  const { mutate: updateRoomPrefs } = useUpdateRoomPrefs();

  const legacyRooms = useMemo(() => rooms.map(toLegacyRoom), [rooms]);
  const legacyMessages = useMemo(() => messages.map(toLegacyMessage), [messages]);
  const legacyActiveRoom = useMemo(() => (activeRoom ? toLegacyRoom(activeRoom) : null), [activeRoom]);

  const lastMessageId = useMemo(() => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1].id;
  }, [messages]);
  const lastReadRef = useRef<{ roomId: string | null; lastId: string | null }>({ roomId: null, lastId: null });

  useEffect(() => {
    if (!activeRoomId || !lastMessageId) return;
    const lastRead = lastReadRef.current;
    if (lastRead.roomId === activeRoomId && lastRead.lastId === lastMessageId) return;
    lastReadRef.current = { roomId: activeRoomId, lastId: lastMessageId };
      markAsRead(activeRoomId, lastMessageId);
  }, [activeRoomId, lastMessageId, markAsRead]);

  const getRoomAvatar = useCallback((room: ChatRoom | null) => {
    if (!room) return undefined;
    if (room.type === 'room') return groupAvatar(room.name || undefined);
    return (room as { avatar_url?: string })?.avatar_url || dmAvatar(room.name || undefined);
  }, []);

  const pending = useInternalChatStore(useShallow((s) => s.pending));
  const messagesByRoom = useInternalChatStore(useShallow((s) => s.messagesByRoom));
  const messagesById = useInternalChatStore(useShallow((s) => s.messagesById));
  const prefsByRoom = useInternalChatStore(useShallow((s) => s.prefsByRoom));

  const pendingByRoom = useMemo(() => {
    const map = new Map<string, { status: string; created_at: number }>();
    Object.values(pending).forEach((p) => {
      const existing = map.get(p.room_id);
      if (!existing || p.created_at > existing.created_at) {
        map.set(p.room_id, { status: p.status, created_at: p.created_at });
      }
    });
    return map;
  }, [pending]);

  const getLastMessageStatus = useCallback(
    (roomId: string) => {
      const pendingInfo = pendingByRoom.get(roomId);
      if (pendingInfo?.status === 'sending') return 'pending';

      const ids = messagesByRoom[roomId];
      const lastId = ids && ids.length > 0 ? ids[ids.length - 1] : null;
      const lastMsg = lastId ? messagesById[lastId] : null;
      if (!lastMsg) return null;
      if (String(lastMsg.author_id) !== CURRENT_USER_ID) return null;

      const room = rooms.find((r) => r.id === roomId);
      if (!room) return null;
      return room.unread_count === 0 ? 'read' : 'sent';
    },
    [messagesByRoom, messagesById, pendingByRoom, rooms]
  );

  const roomDetails = useQuery({
    queryKey: ['internal-chat', 'room-details', accountId, activeRoomId],
    queryFn: () => internalChatApi.rooms.get(accountId, activeRoomId as string),
    enabled: !!activeRoomId && activeRoom?.type === 'group',
    staleTime: 30 * 1000,
  });

  const pinsQuery = useQuery({
    queryKey: ['internal-chat', 'pins', accountId, activeRoomId],
    queryFn: () => internalChatApi.pins.list(accountId, activeRoomId as string),
    enabled: !!activeRoomId,
    staleTime: 30 * 1000,
  });

  const addPin = useMutation({
    mutationFn: ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      internalChatApi.pins.add(accountId, roomId, messageId),
    onMutate: async ({ roomId, messageId }) => {
      const key = ['internal-chat', 'pins', accountId, roomId] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: typeof previous) => {
        if (!current || typeof current !== 'object' || !('items' in current)) return current;
        const data = current as { items: Array<{ message_id: string; room_id: string; pinned_by: string; pinned_at: string; message: InternalMessage }> };
        if (data.items.some((pin) => pin.message_id === messageId)) return current;
        const message = messages.find((msg) => msg.id === messageId);
        if (!message) return current;
        const nextPin = {
          room_id: roomId,
          message_id: messageId,
          pinned_by: CURRENT_USER_ID,
          pinned_at: new Date().toISOString(),
          message,
        };
        return { ...data, items: [nextPin, ...data.items] };
      });
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.key) queryClient.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['internal-chat', 'pins', accountId, vars.roomId] });
    },
  });

  const removePin = useMutation({
    mutationFn: ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      internalChatApi.pins.remove(accountId, roomId, messageId),
    onMutate: async ({ roomId, messageId }) => {
      const key = ['internal-chat', 'pins', accountId, roomId] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: typeof previous) => {
        if (!current || typeof current !== 'object' || !('items' in current)) return current;
        const data = current as { items: Array<{ message_id: string }> };
        const nextItems = data.items.filter((pin) => pin.message_id !== messageId);
        return { ...data, items: nextItems };
      });
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.key) queryClient.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['internal-chat', 'pins', accountId, vars.roomId] });
    },
  });

  const pinnedMessages = useMemo(() => {
    const items = pinsQuery.data?.items ?? [];
    const mapped = items.map((pin) => {
      const existing = messages.find((msg) => msg.id === pin.message_id);
      if (existing) return toLegacyMessage(existing);
      const pinMessage = (pin as { message?: InternalMessage }).message;
      return pinMessage ? toLegacyMessage(pinMessage) : null;
    });
    return mapped.filter(Boolean) as ChatMessage[];
  }, [pinsQuery.data, messages]);

  const pinnedMessageIds = useMemo(() => new Set(pinnedMessages.map((msg) => msg.id)), [pinnedMessages]);

  const members = useMemo(() => {
    const data = roomDetails.data as Room & {
      members?: Array<{ role?: string; user?: { id: string; name: string; email: string; avatar_url?: string } }>;
    };
    const raw = data?.members ?? [];
    return raw
      .map((member) =>
        member.user
          ? { ...member.user, role: member.role || 'agent' }
          : null
      )
      .filter(Boolean) as Array<{ id: string; name: string; email: string; avatar_url?: string; role?: string }>;
  }, [roomDetails.data]);

  const users = useMemo(
    () => members.map((m) => ({ id: Number(m.id), name: m.name, email: m.email, avatar_url: m.avatar_url })),
    [members]
  );

  const currentUserRole = useMemo(() => {
    const match = members.find((m) => String(m.id) === CURRENT_USER_ID);
    return match?.role || 'agent';
  }, [members]);

  const isRoomPinned = useCallback(
    (room: ChatRoom) => !!prefsByRoom[room.id]?.is_pinned,
    [prefsByRoom]
  );

  const onTogglePinRoom = useCallback(
    (room: ChatRoom) => {
      const current = prefsByRoom[room.id]?.is_pinned ?? false;
      updateRoomPrefs({ roomId: room.id, data: { is_pinned: !current } });
    },
    [prefsByRoom, updateRoomPrefs]
  );

  const updateRoomInfo = useMutation({
    mutationFn: ({ roomId, name }: { roomId: string; name: string }) =>
      internalChatApi.rooms.update(accountId, roomId, { name }),
  });

  const addMember = useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) =>
      internalChatApi.rooms.addMember(accountId, roomId, userId),
    onSuccess: () => {
      roomDetails.refetch();
    },
  });

  const removeMember = useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) =>
      internalChatApi.rooms.removeMember(accountId, roomId, userId),
    onSuccess: () => {
      roomDetails.refetch();
    },
  });

  const handleSendMessage = useCallback(
    (content: string, mode: 'reply' | 'private', replyTo: ChatMessage | null) => {
      if (!activeRoomId || !content.trim()) return;
      sendMessage({
        roomId: activeRoomId,
        data: {
          client_msg_id: crypto.randomUUID(),
          type: mode === 'private' ? 'note' : 'text',
          visibility: mode === 'private' ? 'self' : 'all',
          content: content.trim(),
          reply_to_message_id: replyTo?.id || null,
        },
      });
    },
    [activeRoomId, sendMessage]
  );

  const handleEditMessage = useCallback(
    (messageId: string, content: string) => {
      if (!activeRoomId || !content.trim()) return;
      editMessage({ roomId: activeRoomId, messageId, content: content.trim() });
    },
    [activeRoomId, editMessage]
  );

  const handleTogglePinMessage = useCallback(
    (message: ChatMessage) => {
      if (!activeRoomId) return;
      const isPinned = pinnedMessageIds.has(message.id);
      if (isPinned) {
        removePin.mutate({ roomId: activeRoomId, messageId: message.id });
      } else {
        addPin.mutate({ roomId: activeRoomId, messageId: message.id });
      }
    },
    [activeRoomId, pinnedMessageIds, addPin, removePin]
  );

  return {
    rooms: legacyRooms,
    activeRoom: legacyActiveRoom,
    activeRoomId,
    onSelectRoom: (room: ChatRoom) => setActiveRoom(room.id),
    filter,
    onFilterChange: setFilter,
    messages: legacyMessages,
    isLoadingMessages,
    loadMore,
    hasMore: !!hasMore,
    isSending,
    onSendMessage: handleSendMessage,
    onEditMessage: handleEditMessage,
    typingUsers,
    draftText: draft.text,
    resetDraft,
    users: users as AccountUser[],
    members,
    getLastMessageStatus,
    getRoomAvatar,
    currentUserId: CURRENT_USER_ID,
    currentUserRole,
    onTogglePinRoom,
    isRoomPinned,
    pinnedMessageIds,
    pinnedMessages,
    onTogglePinMessage: handleTogglePinMessage,
    onUpdateRoomInfo: (roomId: string, name: string) => updateRoomInfo.mutate({ roomId, name }),
    onAddMember: (roomId: string, userId: string) => addMember.mutate({ roomId, userId }),
    onRemoveMember: (roomId: string, userId: string) => removeMember.mutate({ roomId, userId }),
    availableUsers: users as AccountUser[],
  };
}
