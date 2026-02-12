import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCheck, MessageCircle, Pin } from 'lucide-react';

import type { ChatMessage, ChatRoom, AccountUser } from '../../chat/types';
import { groupMessagesByDay } from '../../chat/utils';

import { InternalChatLayout } from './InternalChatLayout';
import { InternalChatSidebar } from './InternalChatSidebar';
import { InternalChatHeader } from './InternalChatHeader';
import { InternalChatMessageList } from './InternalChatMessageList';
import { InternalChatComposer } from './InternalChatComposer';
import { InternalProfileSidebar } from './InternalProfileSidebar';

type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | null;

interface InternalChatScreenProps {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  activeRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  filter?: 'all' | 'open' | 'resolved';
  onFilterChange?: (next: 'all' | 'open' | 'resolved') => void;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  loadMore: () => void;
  hasMore: boolean;
  isSending?: boolean;
  onSendMessage: (content: string, mode: 'reply' | 'private', replyTo: ChatMessage | null) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  typingUsers?: string[];
  draftText?: string;
  resetDraft?: () => void;
  users?: AccountUser[];
  members?: Array<{ id: string; name: string; email: string; avatar_url?: string }>;
  getLastMessageStatus?: (roomId: string) => MessageStatus;
  getRoomAvatar?: (room: ChatRoom | null) => string | undefined;
  currentUserId: string;
  currentUserRole?: string;
  onTogglePinRoom?: (room: ChatRoom) => void;
  isRoomPinned?: (room: ChatRoom) => boolean;
  pinnedMessageIds?: Set<string>;
  pinnedMessages?: ChatMessage[];
  onTogglePinMessage?: (msg: ChatMessage) => void;
  onUpdateRoomInfo?: (roomId: string, name: string) => void;
  onAddMember?: (roomId: string, userId: string) => void;
  onRemoveMember?: (roomId: string, userId: string) => void;
  availableUsers?: AccountUser[];
}

export function InternalChatScreen({
  rooms,
  activeRoom,
  activeRoomId,
  onSelectRoom,
  filter,
  onFilterChange,
  messages,
  isLoadingMessages,
  loadMore,
  hasMore,
  isSending,
  onSendMessage,
  typingUsers = [],
  draftText,
  resetDraft,
  users = [],
  members = [],
  getLastMessageStatus,
  getRoomAvatar,
  currentUserId,
  currentUserRole,
  onTogglePinRoom,
  isRoomPinned,
  pinnedMessageIds: pinnedMessageIdsProp,
  pinnedMessages = [],
  onTogglePinMessage,
  onUpdateRoomInfo,
  onAddMember,
  onRemoveMember,
  availableUsers = [],
}: InternalChatScreenProps) {
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [composerMode, setComposerMode] = useState<'reply' | 'private'>('reply');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [reactionsByRoom, setReactionsByRoom] = useState<Record<string, Record<string, Record<string, number>>>>({});

  const isOwnMessage = useCallback(
    (msg: ChatMessage) => String(msg.sender_id) === currentUserId,
    [currentUserId]
  );

  const visibleMessages = useMemo(
    () => messages.filter((msg) => msg.message_type !== 'private' || isOwnMessage(msg)),
    [messages, isOwnMessage]
  );

  const groupedMessages = useMemo(
    () => groupMessagesByDay(visibleMessages),
    [visibleMessages]
  );

  const virtualized = visibleMessages.length > 80;

  const messageById = useMemo(
    () => new Map(visibleMessages.map((msg) => [msg.id, msg])),
    [visibleMessages]
  );

  const handleJumpToMessage = useCallback((messageId: string) => {
    const target = document.getElementById(`message-${messageId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceToBottom < 80;
  }, []);

  useLayoutEffect(() => {
    const el = scrollAreaRef.current;
    if (!el || !isAtBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleMessages.length]);

  const shouldShowSender = useCallback(
    (msg: ChatMessage, index: number, allMessages: ChatMessage[]) => {
      if (!activeRoom || activeRoom.type === 'dm') return false;
      if (String(msg.sender_id) === currentUserId) return false;
      if (index === 0) return true;
      const prevMsg = allMessages[index - 1];
      return prevMsg.sender_id !== msg.sender_id;
    },
    [activeRoom, currentUserId]
  );

  const shouldShowAvatar = useMemo(() => activeRoom?.type === 'room', [activeRoom?.type]);

  const pinnedMessageIds = useMemo(() => pinnedMessageIdsProp ?? new Set<string>(), [pinnedMessageIdsProp]);
  const pinnedMessageList = useMemo(() => pinnedMessages, [pinnedMessages]);

  const reactionsByMessage = useMemo(() => {
    if (!activeRoomId) return {};
    return reactionsByRoom[activeRoomId] ?? {};
  }, [activeRoomId, reactionsByRoom]);

  const togglePinMessage = useCallback(
    (msg: ChatMessage) => {
      if (!onTogglePinMessage) return;
      onTogglePinMessage(msg);
    },
    [onTogglePinMessage]
  );

  const addReaction = useCallback(
    (msg: ChatMessage, emoji: string) => {
      if (!activeRoomId) return;
      setReactionsByRoom((prev) => {
        const roomReactions = prev[activeRoomId] ? { ...prev[activeRoomId] } : {};
        const current = roomReactions[msg.id] ? { ...roomReactions[msg.id] } : {};
        current[emoji] = (current[emoji] || 0) + 1;
        roomReactions[msg.id] = current;
        return { ...prev, [activeRoomId]: roomReactions };
      });
    },
    [activeRoomId]
  );

  const handleSendMessage = (content: string) => {
    if (!activeRoomId || !content.trim()) return;
    if (editingMessage && onEditMessage) {
      onEditMessage(editingMessage.id, content);
      setEditingMessage(null);
      setReplyTo(null);
      setComposerMode('reply');
      return;
    }
    onSendMessage(content, composerMode, replyTo);
    setReplyTo(null);
    setComposerMode('reply');
  };

  const chatView = !activeRoom ? (
    <div className="flex-1 flex items-center justify-center text-muted-foreground bg-[#F3F6F9]">
      <div className="text-center">
        <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="mt-2 text-sm font-medium">Selecione uma conversa</p>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex flex-col bg-[#F3F6F9] relative h-full">
      <InternalChatHeader
        title={activeRoom.name}
        status={activeRoom.type === 'dm' ? 'Online' : 'Circulo Ativo'}
        avatar={getRoomAvatar ? getRoomAvatar(activeRoom) : undefined}
        isOnline={true}
        isProfileOpen={isProfileOpen}
        onToggleProfile={() => setIsProfileOpen(!isProfileOpen)}
      />

      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
      >
        {isLoadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg w-2/3" />
            ))}
          </div>
        ) : (
          <>
            {pinnedMessageIds.size > 0 && (
              <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3 bg-[#F3F6F9]">
                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Mensagens fixadas</span>
                    <span className="text-[10px] uppercase tracking-wider text-amber-700">
                      {pinnedMessageIds.size} item(ns)
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(pinnedMessageList.length > 0 ? pinnedMessageList : Array.from(pinnedMessageIds)
                      .map((id) => messageById.get(id))
                      .filter(Boolean) as ChatMessage[])
                      .map((msg) => (
                        <div
                          key={msg.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleJumpToMessage(msg.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleJumpToMessage(msg.id);
                            }
                          }}
                          className="w-full text-left rounded-lg bg-white/70 hover:bg-white px-2 py-1.5 border border-amber-100 flex items-start gap-2 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {msg.sender?.name || 'Usuario'}
                            </div>
                            <div className="text-[11px] text-amber-800 truncate">
                              {msg.content}
                            </div>
                          </div>
                          {onTogglePinMessage && (
                            <button
                              type="button"
                              title="Desfixar"
                              onClick={(event) => {
                                event.stopPropagation();
                                onTogglePinMessage(msg);
                              }}
                              className="p-1.5 rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
            {hasMore && (
              <div className="text-center">
                <button
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  onClick={() => loadMore()}
                >
                  Carregar mais
                </button>
              </div>
            )}
            <InternalChatMessageList
              grouped={groupedMessages}
              scrollElementRef={scrollAreaRef}
              virtualized={virtualized}
              isOwnMessage={isOwnMessage}
              shouldShowSender={shouldShowSender}
              shouldShowAvatar={() => shouldShowAvatar}
              getSenderName={(msg) => msg.sender?.name || 'Usuario'}
              getSenderAvatar={(msg) => msg.sender?.avatar_url}
              getStatusIcon={(msg) =>
                msg.status === 'sending' ? <Check className="w-3 h-3 text-gray-300" />
                : msg.status === 'sent' ? <Check className="w-3 h-3 text-gray-400" />
                : <CheckCheck className="w-3 h-3 text-blue-500" />
              }
              getReplyPreview={(msg) => {
                const replyId = (msg as ChatMessage & { reply_to_message_id?: string }).reply_to_message_id;
                if (!replyId) return null;
                const replyMsg = messageById.get(replyId);
                return replyMsg ? replyMsg.content : null;
              }}
              getReplyToId={(msg) =>
                (msg as ChatMessage & { reply_to_message_id?: string }).reply_to_message_id || null
              }
              onJumpToReply={handleJumpToMessage}
              onTogglePin={togglePinMessage}
              isPinned={(msg) => pinnedMessageIds.has(msg.id)}
              getReactions={(msg) => reactionsByMessage[msg.id]}
              onAddReaction={addReaction}
              onReply={(msg) => {
                setComposerMode('reply');
                setReplyTo(msg);
                setEditingMessage(null);
              }}
              onEdit={(msg) => {
                setEditingMessage(msg);
                setReplyTo(null);
                setComposerMode(msg.message_type === 'private' ? 'private' : 'reply');
              }}
            />
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 pl-2">
                <div className="w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-blue-400/80 rounded-full animate-bounce delay-150" />
              </div>
            )}
          </>
        )}
      </div>

      <InternalChatComposer
        placeholder={
          composerMode === 'private'
            ? 'Nota privada (so voce ve)...'
            : replyTo
              ? `Responder a ${replyTo.sender?.name || 'mensagem'}...`
              : editingMessage
                ? 'Editar mensagem...'
                : activeRoom.type === 'room'
                  ? 'Digite @ para mencionar...'
                  : `Escreva para ${activeRoom.name}...`
        }
        initialContent={editingMessage ? editingMessage.content : draftText}
        initialContentFormat={editingMessage ? 'markdown' : 'text'}
        replyTo={
          replyTo
            ? { id: replyTo.id, author: replyTo.sender?.name || 'Usuario', preview: replyTo.content.substring(0, 100) }
            : null
        }
        editingMessage={
          editingMessage
            ? {
                id: editingMessage.id,
                author: editingMessage.sender?.name || 'Usuario',
                isPrivate: editingMessage.message_type === 'private',
              }
            : null
        }
        mode={composerMode}
        onSendMessage={handleSendMessage}
        onModeChange={(mode) => setComposerMode(mode)}
        onClearReply={() => {
          setReplyTo(null);
          setComposerMode('reply');
          resetDraft?.();
        }}
        onCancelEdit={() => {
          setEditingMessage(null);
          setComposerMode('reply');
        }}
        users={users}
        disabled={isSending && !editingMessage}
      />
    </div>
  );

  return (
    <InternalChatLayout
      sidebar={
        <InternalChatSidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={(room) => {
            onSelectRoom(room);
            setReplyTo(null);
            setComposerMode('reply');
            isAtBottomRef.current = true;
          }}
          onCreateGroup={() => undefined}
          filter={filter}
          onFilterChange={onFilterChange}
          getLastMessageStatus={getLastMessageStatus}
          onTogglePinRoom={onTogglePinRoom}
          isRoomPinned={isRoomPinned}
        />
      }
      main={chatView}
      profile={
        <InternalProfileSidebar
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          name={activeRoom?.name || 'Chat'}
          avatar={getRoomAvatar ? getRoomAvatar(activeRoom) : undefined}
          role={activeRoom?.type === 'room' ? 'Grupo' : 'Contato'}
          isGroup={activeRoom?.type === 'room'}
          roomId={activeRoomId}
          currentUserRole={currentUserRole}
          members={activeRoom?.type === 'room' ? members : []}
          availableUsers={availableUsers}
          onUpdateRoomInfo={onUpdateRoomInfo}
          onAddMember={onAddMember}
          onRemoveMember={onRemoveMember}
        />
      }
    />
  );
}
