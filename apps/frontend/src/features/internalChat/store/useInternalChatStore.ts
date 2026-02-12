/**
 * Internal Chat Store - Zustand State Management
 * 
 * Core state management for the Internal Team Chat feature.
 * Handles rooms, messages, drafts, pending messages, typing, and presence.
 * 
 * @see docs/internal-chat/spec.md
 */

import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { devtools, persist } from 'zustand/middleware';
import type {
  ID,
  Room,
  Message,
  RoomMemberPrefs,
  AccountChatSettings,
  WSServerEvent,
  QuotePayload,
  NotificationLevel,
  DraftState,
  PendingMessage,
  PresenceStatus,
} from '../contracts';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface InternalChatState {
  // Feature/Settings
  settings: AccountChatSettings | null;
  featureEnabled: boolean;

  // Rooms
  roomsById: Record<ID, Room>;
  roomOrder: ID[];
  activeRoomId: ID | null;
  roomFilter: 'all' | 'open' | 'resolved' | 'archived';

  // Messages cache
  messagesByRoom: Record<ID, ID[]>;
  messagesById: Record<ID, Message>;
  roomSeq: Record<ID, number>;

  // Drafts & pending
  draftsByRoom: Record<ID, DraftState>;
  pending: Record<ID, PendingMessage>;

  // Typing & presence
  typingByRoom: Record<ID, Record<ID, boolean>>;
  presenceByUser: Record<ID, PresenceStatus>;

  // Prefs
  prefsByRoom: Record<ID, RoomMemberPrefs>;

  // Loading states
  isLoadingRooms: boolean;
  isLoadingMessages: Record<ID, boolean>;

  // Actions
  setSettings: (s: AccountChatSettings) => void;
  setFeatureEnabled: (v: boolean) => void;

  upsertRooms: (rooms: Room[]) => void;
  upsertRoom: (room: Room) => void;
  removeRoom: (roomId: ID) => void;
  setActiveRoom: (roomId: ID | null) => void;
  setRoomFilter: (filter: 'all' | 'open' | 'resolved' | 'archived') => void;

  upsertMessages: (roomId: ID, msgs: Message[], mode?: 'append' | 'prepend') => void;
  upsertMessage: (msg: Message) => void;
  deleteMessage: (roomId: ID, messageId: ID, deletedAt: string, deletedBy: ID) => void;
  clearMessages: (roomId: ID) => void;

  setDraftText: (roomId: ID, text: string) => void;
  setDraftQuote: (roomId: ID, quote: QuotePayload | null) => void;
  setDraftReply: (roomId: ID, replyTo: ID | null) => void;
  addDraftAttachment: (roomId: ID, attachment: DraftState['attachments'][0]) => void;
  removeDraftAttachment: (roomId: ID, objectKey: string) => void;
  resetDraft: (roomId: ID) => void;

  markPending: (p: PendingMessage) => void;
  resolvePending: (clientMsgId: ID) => void;
  failPending: (clientMsgId: ID, error: string) => void;

  setTyping: (roomId: ID, userId: ID, isTyping: boolean) => void;
  clearTyping: (roomId: ID) => void;
  setPresence: (userId: ID, status: PresenceStatus) => void;

  applyWSEvent: (evt: WSServerEvent) => { needsResync?: boolean; roomId?: ID };

  setPrefs: (roomId: ID, prefs: RoomMemberPrefs) => void;
  setNotificationLevel: (roomId: ID, level: NotificationLevel) => void;

  setLoadingRooms: (loading: boolean) => void;
  setLoadingMessages: (roomId: ID, loading: boolean) => void;

  // Reset
  reset: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const emptyDraft = (): DraftState => ({
  text: '',
  quote: null,
  reply_to_message_id: null,
  attachments: [],
});

const sortRoomsByActivity = (roomsById: Record<ID, Room>): ID[] => {
  return Object.values(roomsById)
    .sort((a, b) => +new Date(b.last_activity_at) - +new Date(a.last_activity_at))
    .map((r) => r.id);
};

const areIdsEqual = (a: ID[], b: ID[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

const isSameRoom = (a: Room | undefined, b: Room) => {
  if (!a) return false;
  return (
    a.id === b.id &&
    a.account_id === b.account_id &&
    a.type === b.type &&
    a.name === b.name &&
    a.status === b.status &&
    a.created_by === b.created_by &&
    a.created_at === b.created_at &&
    a.updated_at === b.updated_at &&
    a.last_activity_at === b.last_activity_at &&
    a.seq === b.seq &&
    a.resolved_at === b.resolved_at &&
    a.resolved_by === b.resolved_by &&
    (a.unread_count ?? 0) === (b.unread_count ?? 0) &&
    (a.last_message_preview ?? null) === (b.last_message_preview ?? null)
  );
};

const isSameMessage = (a: Message | undefined, b: Message) => {
  if (!a) return false;
  return (
    a.id === b.id &&
    a.room_id === b.room_id &&
    a.account_id === b.account_id &&
    a.client_msg_id === b.client_msg_id &&
    a.author_id === b.author_id &&
    a.type === b.type &&
    a.visibility === b.visibility &&
    JSON.stringify(a.visibility_meta ?? null) === JSON.stringify(b.visibility_meta ?? null) &&
    a.content === b.content &&
    (a.reply_to_message_id ?? null) === (b.reply_to_message_id ?? null) &&
    a.created_at === b.created_at &&
    (a.edited_at ?? null) === (b.edited_at ?? null) &&
    (a.deleted_at ?? null) === (b.deleted_at ?? null)
  );
};

const areSettingsEqual = (a: AccountChatSettings | null, b: AccountChatSettings | null) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.account_id === b.account_id &&
    a.internal_chat_enabled === b.internal_chat_enabled &&
    a.retention_days === b.retention_days &&
    a.resolve_policy === b.resolve_policy &&
    a.notification_style === b.notification_style &&
    a.updated_at === b.updated_at
  );
};

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  settings: null,
  featureEnabled: false,

  roomsById: {},
  roomOrder: [],
  activeRoomId: null,
  roomFilter: 'all' as const,

  messagesByRoom: {},
  messagesById: {},
  roomSeq: {},

  draftsByRoom: {},
  pending: {},

  typingByRoom: {},
  presenceByUser: {},

  prefsByRoom: {},

  isLoadingRooms: false,
  isLoadingMessages: {},
};

// =============================================================================
// STORE
// =============================================================================

export const useInternalChatStore = createWithEqualityFn<InternalChatState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ---------------------------------------------------------------------
        // SETTINGS
        // ---------------------------------------------------------------------

        setSettings: (s) => {
          const st = get();
          if (areSettingsEqual(st.settings, s) && st.featureEnabled === s.internal_chat_enabled) return;
          set({ settings: s, featureEnabled: s.internal_chat_enabled }, false, 'setSettings');
        },

        setFeatureEnabled: (v) => {
          const st = get();
          if (st.featureEnabled === v) return;
          set({ featureEnabled: v }, false, 'setFeatureEnabled');
        },

        // ---------------------------------------------------------------------
        // ROOMS
        // ---------------------------------------------------------------------

        upsertRooms: (rooms) => {
          const st = get();
          let changed = false;
          const roomsById = { ...st.roomsById };
          for (const r of rooms) {
            if (!isSameRoom(roomsById[r.id], r)) {
              roomsById[r.id] = r;
              changed = true;
            }
          }
          if (!changed) return;
          const roomOrder = sortRoomsByActivity(roomsById);
          if (areIdsEqual(roomOrder, st.roomOrder)) {
            set({ roomsById }, false, 'upsertRooms');
            return;
          }
          set({ roomsById, roomOrder }, false, 'upsertRooms');
        },

        upsertRoom: (room) => {
          const st = get();
          if (isSameRoom(st.roomsById[room.id], room)) return;
          const roomsById = { ...st.roomsById, [room.id]: room };
          const roomOrder = sortRoomsByActivity(roomsById);
          if (areIdsEqual(roomOrder, st.roomOrder)) {
            set({ roomsById }, false, 'upsertRoom');
            return;
          }
          set({ roomsById, roomOrder }, false, 'upsertRoom');
        },

        removeRoom: (roomId) =>
          set((st) => {
            const roomsById = { ...st.roomsById };
            delete roomsById[roomId];
            return {
              roomsById,
              roomOrder: sortRoomsByActivity(roomsById),
              activeRoomId: st.activeRoomId === roomId ? null : st.activeRoomId,
            };
          }, false, 'removeRoom'),

        setActiveRoom: (roomId) => {
          const st = get();
          const hasDraft = roomId ? !!st.draftsByRoom[roomId] : true;
          if (st.activeRoomId === roomId && hasDraft) return;
          const draftsByRoom = { ...st.draftsByRoom };
          if (roomId && !draftsByRoom[roomId]) draftsByRoom[roomId] = emptyDraft();
          set({ activeRoomId: roomId, draftsByRoom }, false, 'setActiveRoom');
        },

        setRoomFilter: (filter) => {
          const st = get();
          if (st.roomFilter === filter) return;
          set({ roomFilter: filter }, false, 'setRoomFilter');
        },

        // ---------------------------------------------------------------------
        // MESSAGES
        // ---------------------------------------------------------------------

        upsertMessages: (roomId, msgs, mode = 'append') => {
          const st = get();
          const existing = st.messagesByRoom[roomId] ?? [];
          const newIds = msgs.map((m) => m.id);
          const merged = mode === 'prepend' ? [...newIds, ...existing] : [...existing, ...newIds];

          const seen = new Set<ID>();
          const deduped: ID[] = [];
          for (const id of merged) {
            if (!seen.has(id)) {
              seen.add(id);
              deduped.push(id);
            }
          }

          const messagesById = { ...st.messagesById };
          let messageChanged = false;
          for (const m of msgs) {
            if (!isSameMessage(st.messagesById[m.id], m)) {
              messagesById[m.id] = m;
              messageChanged = true;
            }
          }

          const idsChanged = !areIdsEqual(deduped, existing);
          if (!idsChanged && !messageChanged) return;

          set(
            {
              messagesById,
              messagesByRoom: idsChanged ? { ...st.messagesByRoom, [roomId]: deduped } : st.messagesByRoom,
            },
            false,
            'upsertMessages'
          );
        },

        upsertMessage: (msg) => {
          const st = get();
          const roomId = msg.room_id;
          const ids = st.messagesByRoom[roomId] ?? [];
          const exists = ids.includes(msg.id);
          if (isSameMessage(st.messagesById[msg.id], msg) && exists) return;
          set(
            {
              messagesById: { ...st.messagesById, [msg.id]: msg },
              messagesByRoom: {
                ...st.messagesByRoom,
                [roomId]: exists ? ids : [...ids, msg.id],
              },
            },
            false,
            'upsertMessage'
          );
        },

        deleteMessage: (_roomId, messageId, deletedAt, deletedBy) => {
          const st = get();
          const msg = st.messagesById[messageId];
          if (!msg) return;
          if (msg.deleted_at === deletedAt && msg.deleted_by === deletedBy) return;
          set(
            {
              messagesById: {
                ...st.messagesById,
                [messageId]: { ...msg, deleted_at: deletedAt, deleted_by: deletedBy },
              },
            },
            false,
            'deleteMessage'
          );
        },

        clearMessages: (roomId) => {
          const st = get();
          if (!st.messagesByRoom[roomId]?.length) return;
          set({ messagesByRoom: { ...st.messagesByRoom, [roomId]: [] } }, false, 'clearMessages');
        },

        // ---------------------------------------------------------------------
        // DRAFTS
        // ---------------------------------------------------------------------

        setDraftText: (roomId, text) => {
          const st = get();
          if ((st.draftsByRoom[roomId]?.text ?? emptyDraft().text) === text) return;
          set(
            {
              draftsByRoom: {
                ...st.draftsByRoom,
                [roomId]: { ...(st.draftsByRoom[roomId] ?? emptyDraft()), text },
              },
            },
            false,
            'setDraftText'
          );
        },

        setDraftQuote: (roomId, quote) => {
          const st = get();
          if ((st.draftsByRoom[roomId]?.quote ?? null) === (quote ?? null)) return;
          set(
            {
              draftsByRoom: {
                ...st.draftsByRoom,
                [roomId]: { ...(st.draftsByRoom[roomId] ?? emptyDraft()), quote },
              },
            },
            false,
            'setDraftQuote'
          );
        },

        setDraftReply: (roomId, reply_to_message_id) => {
          const st = get();
          if ((st.draftsByRoom[roomId]?.reply_to_message_id ?? null) === (reply_to_message_id ?? null)) return;
          set(
            {
              draftsByRoom: {
                ...st.draftsByRoom,
                [roomId]: { ...(st.draftsByRoom[roomId] ?? emptyDraft()), reply_to_message_id },
              },
            },
            false,
            'setDraftReply'
          );
        },

        addDraftAttachment: (roomId, attachment) => {
          const st = get();
          const draft = st.draftsByRoom[roomId] ?? emptyDraft();
          if (draft.attachments.some((a) => a.object_key === attachment.object_key)) return;
          set(
            {
              draftsByRoom: {
                ...st.draftsByRoom,
                [roomId]: {
                  ...draft,
                  attachments: [...draft.attachments, attachment],
                },
              },
            },
            false,
            'addDraftAttachment'
          );
        },

        removeDraftAttachment: (roomId, objectKey) => {
          const st = get();
          const draft = st.draftsByRoom[roomId] ?? emptyDraft();
          if (!draft.attachments.some((a: DraftState['attachments'][0]) => a.object_key === objectKey)) return;
          set(
            {
              draftsByRoom: {
                ...st.draftsByRoom,
                [roomId]: {
                  ...draft,
                  attachments: draft.attachments.filter((a: DraftState['attachments'][0]) => a.object_key !== objectKey),
                },
              },
            },
            false,
            'removeDraftAttachment'
          );
        },

        resetDraft: (roomId) => {
          const st = get();
          const current = st.draftsByRoom[roomId];
          if (
            current &&
            current.text === '' &&
            !current.quote &&
            !current.reply_to_message_id &&
            current.attachments.length === 0
          ) {
            return;
          }
          set({ draftsByRoom: { ...st.draftsByRoom, [roomId]: emptyDraft() } }, false, 'resetDraft');
        },

        // ---------------------------------------------------------------------
        // PENDING
        // ---------------------------------------------------------------------

        markPending: (p) => {
          const st = get();
          const existing = st.pending[p.client_msg_id];
          if (
            existing &&
            existing.status === p.status &&
            existing.room_id === p.room_id &&
            existing.created_at === p.created_at
          ) {
            return;
          }
          set({ pending: { ...st.pending, [p.client_msg_id]: p } }, false, 'markPending');
        },

        resolvePending: (clientMsgId) => {
          const st = get();
          if (!st.pending[clientMsgId]) return;
          const pending = { ...st.pending };
          delete pending[clientMsgId];
          set({ pending }, false, 'resolvePending');
        },

        failPending: (clientMsgId, error) => {
          const st = get();
          if (st.pending[clientMsgId]?.status === 'failed' && st.pending[clientMsgId]?.error === error) return;
          set(
            {
              pending: {
                ...st.pending,
                [clientMsgId]: { ...st.pending[clientMsgId]!, status: 'failed', error },
              },
            },
            false,
            'failPending'
          );
        },

        // ---------------------------------------------------------------------
        // TYPING & PRESENCE
        // ---------------------------------------------------------------------

        setTyping: (roomId, userId, isTyping) => {
          const st = get();
          if (st.typingByRoom[roomId]?.[userId] === isTyping) return;
          set(
            {
              typingByRoom: {
                ...st.typingByRoom,
                [roomId]: { ...(st.typingByRoom[roomId] ?? {}), [userId]: isTyping },
              },
            },
            false,
            'setTyping'
          );
        },

        clearTyping: (roomId) => {
          const st = get();
          if (st.typingByRoom[roomId] && Object.keys(st.typingByRoom[roomId]).length === 0) return;
          set({ typingByRoom: { ...st.typingByRoom, [roomId]: {} } }, false, 'clearTyping');
        },

        setPresence: (userId, status) => {
          const st = get();
          if (st.presenceByUser[userId] === status) return;
          set({ presenceByUser: { ...st.presenceByUser, [userId]: status } }, false, 'setPresence');
        },

        // ---------------------------------------------------------------------
        // PREFS
        // ---------------------------------------------------------------------

        setPrefs: (roomId, prefs) => {
          const st = get();
          const existing = st.prefsByRoom[roomId];
          if (existing && JSON.stringify(existing) === JSON.stringify(prefs)) return;
          set({ prefsByRoom: { ...st.prefsByRoom, [roomId]: prefs } }, false, 'setPrefs');
        },

        setNotificationLevel: (roomId, level) => {
          const st = get();
          const existing = st.prefsByRoom[roomId];
          if (!existing || existing.notification_level === level) return;
          set(
            { prefsByRoom: { ...st.prefsByRoom, [roomId]: { ...existing, notification_level: level } } },
            false,
            'setNotificationLevel'
          );
        },

        // ---------------------------------------------------------------------
        // LOADING
        // ---------------------------------------------------------------------

        setLoadingRooms: (loading) => {
          const st = get();
          if (st.isLoadingRooms === loading) return;
          set({ isLoadingRooms: loading }, false, 'setLoadingRooms');
        },

        setLoadingMessages: (roomId, loading) => {
          const st = get();
          if (st.isLoadingMessages[roomId] === loading) return;
          set(
            { isLoadingMessages: { ...st.isLoadingMessages, [roomId]: loading } },
            false,
            'setLoadingMessages'
          );
        },

        // ---------------------------------------------------------------------
        // WEBSOCKET EVENT HANDLER
        // ---------------------------------------------------------------------

        applyWSEvent: (evt) => {
          const st = get();

          // Feature disable at runtime
          if (evt.event === 'account.feature.updated') {
            st.setFeatureEnabled(evt.internal_chat_enabled);
            return {};
          }

          // Room seq gap detection
          const roomId = (evt as { room_id?: ID }).room_id;
          if (roomId) {
            const last = st.roomSeq[roomId] ?? 0;
            const seq = (evt as { seq?: number }).seq ?? last;
            if (seq > last + 1) {
              // Gap detected - need resync
              set({ roomSeq: { ...st.roomSeq, [roomId]: seq } }, false, 'ws:seq.gap');
              return { needsResync: true, roomId };
            }
            if (seq > last) {
              set({ roomSeq: { ...st.roomSeq, [roomId]: seq } }, false, 'ws:seq.update');
            }
          }

          // Apply events
          switch (evt.event) {
            case 'message.ack':
              st.resolvePending(evt.client_msg_id);
              return {};

            case 'message.created':
            case 'message.updated':
              st.upsertMessage(evt.message);
              return {};

            case 'message.deleted':
              st.deleteMessage(evt.room_id, evt.message_id, evt.deleted_at, evt.deleted_by);
              return {};

            case 'room.read':
              // Could update unread counts here
              return {};

            case 'room.resolved':
            case 'room.reopened': {
              const room = st.roomsById[evt.room_id];
              if (room) {
                st.upsertRoom({
                  ...room,
                  status: evt.event === 'room.resolved' ? 'resolved' : 'open',
                  resolved_at: evt.event === 'room.resolved' ? evt.resolved_at : null,
                  resolved_by: evt.event === 'room.resolved' ? evt.resolved_by : null,
                });
              }
              return {};
            }

            case 'room.updated':
              st.upsertRoom(evt.room);
              return {};

            case 'typing.on':
            case 'typing.off':
              st.setTyping(evt.room_id, evt.user_id, evt.event === 'typing.on');
              return {};

            case 'presence.update':
              st.setPresence(evt.user_id, evt.status);
              return {};

            default:
              return {};
          }
        },

        // ---------------------------------------------------------------------
        // RESET
        // ---------------------------------------------------------------------

        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'internal-chat-store',
        partialize: (st) => ({
          // Only persist drafts
          draftsByRoom: st.draftsByRoom,
        }),
      }
    ),
    { name: 'InternalChatStore' }
  ),
  shallow
);

// =============================================================================
// SELECTORS (deprecated: use memoized hooks instead)
// =============================================================================
