import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ChatMessage } from '../../chat/types';
import { InternalChatMessageBubble } from './InternalChatMessageBubble';

interface GroupedMessages {
  date: string;
  messages: ChatMessage[];
}

interface InternalChatMessageListProps {
  grouped: GroupedMessages[];
  scrollElementRef?: React.RefObject<HTMLDivElement>;
  virtualized?: boolean;
  isOwnMessage: (msg: ChatMessage) => boolean;
  shouldShowSender: (msg: ChatMessage, index: number, allMessages: ChatMessage[]) => boolean;
  shouldShowAvatar?: (msg: ChatMessage, index: number, allMessages: ChatMessage[]) => boolean;
  getSenderName: (msg: ChatMessage) => string;
  getSenderAvatar?: (msg: ChatMessage) => string | undefined;
  getStatusIcon?: (msg: ChatMessage) => React.ReactNode;
  getReplyPreview?: (msg: ChatMessage) => string | null;
  getReplyToId?: (msg: ChatMessage) => string | null;
  onReply?: (msg: ChatMessage) => void;
  onEdit?: (msg: ChatMessage) => void;
  onDelete?: (msg: ChatMessage) => void;
  onJumpToReply?: (messageId: string) => void;
  onTogglePin?: (msg: ChatMessage) => void;
  isPinned?: (msg: ChatMessage) => boolean;
  getReactions?: (msg: ChatMessage) => Record<string, number> | undefined;
  onAddReaction?: (msg: ChatMessage, emoji: string) => void;
}

function DaySeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold bg-gray-100 px-3 py-1 rounded-full">
        {date}
      </span>
    </div>
  );
}

function StaticMessageList({
  grouped,
  isOwnMessage,
  shouldShowSender,
  shouldShowAvatar,
  getSenderName,
  getSenderAvatar,
  getStatusIcon,
  getReplyPreview,
  getReplyToId,
  onReply,
  onEdit,
  onDelete,
  onJumpToReply,
  onTogglePin,
  isPinned,
  getReactions,
  onAddReaction,
}: InternalChatMessageListProps) {
  return (
    <div className="space-y-4">
      {grouped.map(({ date, messages }) => (
        <React.Fragment key={date}>
          <DaySeparator date={date} />
          {messages.map((msg, index) => (
            <InternalChatMessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwnMessage(msg)}
              showSender={shouldShowSender(msg, index, messages)}
              showAvatar={shouldShowAvatar ? shouldShowAvatar(msg, index, messages) : true}
              senderName={getSenderName(msg)}
              senderAvatar={getSenderAvatar ? getSenderAvatar(msg) : undefined}
              statusIcon={getStatusIcon ? getStatusIcon(msg) : null}
              replyPreview={getReplyPreview ? getReplyPreview(msg) : null}
              replyToId={getReplyToId ? getReplyToId(msg) : null}
              onReply={onReply ? () => onReply(msg) : undefined}
              onEdit={onEdit ? () => onEdit(msg) : undefined}
              onDelete={onDelete ? () => onDelete(msg) : undefined}
              onJumpToReply={onJumpToReply}
              onTogglePin={onTogglePin ? () => onTogglePin(msg) : undefined}
              isPinned={isPinned ? isPinned(msg) : false}
              reactions={getReactions ? getReactions(msg) : undefined}
              onAddReaction={onAddReaction ? (emoji) => onAddReaction(msg, emoji) : undefined}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function VirtualizedMessageList({
  grouped,
  scrollElementRef,
  isOwnMessage,
  shouldShowSender,
  shouldShowAvatar,
  getSenderName,
  getSenderAvatar,
  getStatusIcon,
  getReplyPreview,
  getReplyToId,
  onReply,
  onEdit,
  onDelete,
  onJumpToReply,
  onTogglePin,
  isPinned,
  getReactions,
  onAddReaction,
}: InternalChatMessageListProps) {
  const items = useMemo(() => {
    const next: Array<
      | { type: 'day'; key: string; date: string }
      | { type: 'message'; key: string; message: ChatMessage; index: number; messages: ChatMessage[] }
    > = [];
    grouped.forEach(({ date, messages }) => {
      next.push({ type: 'day', key: `day-${date}`, date });
      messages.forEach((msg, index) => {
        next.push({ type: 'message', key: `msg-${msg.id}`, message: msg, index, messages });
      });
    });
    return next;
  }, [grouped]);

  const messageIndexById = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item, index) => {
      if (item.type === 'message') {
        map.set(item.message.id, index);
      }
    });
    return map;
  }, [items]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef?.current ?? null,
    estimateSize: (index) => (items[index]?.type === 'day' ? 32 : 88),
    overscan: 10,
  });

  const handleJumpToReply = (messageId: string) => {
    const targetIndex = messageIndexById.get(messageId);
    if (targetIndex === undefined) {
      onJumpToReply?.(messageId);
      return;
    }
    rowVirtualizer.scrollToIndex(targetIndex, { align: 'center' });
  };

  return (
    <div className="relative" style={{ height: rowVirtualizer.getTotalSize() }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index];
        if (!item) return null;
        return (
          <div
            key={item.key}
            ref={rowVirtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            data-index={virtualRow.index}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <div className="py-2">
              {item.type === 'day' ? (
                <DaySeparator date={item.date} />
              ) : (
                <InternalChatMessageBubble
                  message={item.message}
                  isOwn={isOwnMessage(item.message)}
                  showSender={shouldShowSender(item.message, item.index, item.messages)}
                  showAvatar={shouldShowAvatar ? shouldShowAvatar(item.message, item.index, item.messages) : true}
                  senderName={getSenderName(item.message)}
                  senderAvatar={getSenderAvatar ? getSenderAvatar(item.message) : undefined}
                  statusIcon={getStatusIcon ? getStatusIcon(item.message) : null}
                  replyPreview={getReplyPreview ? getReplyPreview(item.message) : null}
                  replyToId={getReplyToId ? getReplyToId(item.message) : null}
                  onReply={onReply ? () => onReply(item.message) : undefined}
                  onEdit={onEdit ? () => onEdit(item.message) : undefined}
                  onDelete={onDelete ? () => onDelete(item.message) : undefined}
                  onJumpToReply={handleJumpToReply}
                  onTogglePin={onTogglePin ? () => onTogglePin(item.message) : undefined}
                  isPinned={isPinned ? isPinned(item.message) : false}
                  reactions={getReactions ? getReactions(item.message) : undefined}
                  onAddReaction={onAddReaction ? (emoji) => onAddReaction(item.message, emoji) : undefined}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function InternalChatMessageList(props: InternalChatMessageListProps) {
  const { virtualized } = props;
  const virtualEnabled = Boolean(virtualized);

  return virtualEnabled ? <VirtualizedMessageList {...props} /> : <StaticMessageList {...props} />;
}
