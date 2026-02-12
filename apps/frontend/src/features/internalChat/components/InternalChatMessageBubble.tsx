import React, { useEffect, useRef, useState } from 'react';
import { Reply, Edit2, Trash2, Pin, SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InternalAvatar } from './InternalAvatar';
import type { ChatMessage } from '../../chat/types';

interface InternalChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
  showAvatar?: boolean;
  senderName: string;
  senderAvatar?: string;
  statusIcon?: React.ReactNode;
  replyPreview?: string | null;
  replyToId?: string | null;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onJumpToReply?: (messageId: string) => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  reactions?: Record<string, number>;
  onAddReaction?: (emoji: string) => void;
}

const mentionRegex = /@[\w.-]+/g;
const REACTION_EMOJIS = [
  '\u{1F44D}',
  '\u{2764}\u{FE0F}',
  '\u{1F602}',
  '\u{1F62E}',
  '\u{1F622}',
  '\u{1F64F}',
];

function renderTextWithMentions(text: string, keyPrefix: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(mentionRegex);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={`${keyPrefix}-mention-${match.index}`} className="font-semibold text-blue-700 bg-blue-100/80 px-1 rounded-md">
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const hasList = lines.some((line) => /^(\s*[-*]\s+|\s*\d+\.\s+)/.test(line));
  if (hasList) {
    const nodes: React.ReactNode[] = [];
    let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;
    const flushList = () => {
      if (!currentList) return;
      if (currentList.type === 'ul') {
        nodes.push(<ul key={`ul-${nodes.length}`} className="list-disc pl-4 space-y-1">{currentList.items}</ul>);
      } else {
        nodes.push(<ol key={`ol-${nodes.length}`} className="list-decimal pl-4 space-y-1">{currentList.items}</ol>);
      }
      currentList = null;
    };
    lines.forEach((line, index) => {
      const ulMatch = line.match(/^\s*[-*]\s+(.*)/);
      const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
      if (ulMatch) {
        if (!currentList || currentList.type !== 'ul') {
          flushList();
          currentList = { type: 'ul', items: [] };
        }
        currentList.items.push(<li key={`li-${index}`}>{renderMarkdown(ulMatch[1])}</li>);
        return;
      }
      if (olMatch) {
        if (!currentList || currentList.type !== 'ol') {
          flushList();
          currentList = { type: 'ol', items: [] };
        }
        currentList.items.push(<li key={`li-${index}`}>{renderMarkdown(olMatch[1])}</li>);
        return;
      }
      flushList();
      if (line.trim().length > 0) {
        nodes.push(<p key={`p-${index}`} className="mb-1 last:mb-0">{renderMarkdown(line)}</p>);
      } else {
        nodes.push(<br key={`br-${index}`} />);
      }
    });
    flushList();
    return nodes;
  }

  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const pushText = (value: string) => {
    nodes.push(...renderTextWithMentions(value, `text-${key++}`));
  };

  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i + 1) {
        const code = text.slice(i + 1, end);
        nodes.push(
          <code key={`code-${key++}`} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[12px] font-mono">
            {code}
          </code>
        );
        i = end + 1;
        continue;
      }
    }

    if (text.slice(i, i + 2) === '**') {
      const end = text.indexOf('**', i + 2);
      if (end > i + 2) {
        const content = text.slice(i + 2, end);
        nodes.push(
          <strong key={`bold-${key++}`} className="font-semibold">
            {renderTextWithMentions(content, `bold-${key}`)}
          </strong>
        );
        i = end + 2;
        continue;
      }
    }

    if (text[i] === '_') {
      const end = text.indexOf('_', i + 1);
      if (end > i + 1) {
        const content = text.slice(i + 1, end);
        nodes.push(
          <em key={`italic-${key++}`} className="italic">
            {renderTextWithMentions(content, `italic-${key}`)}
          </em>
        );
        i = end + 1;
        continue;
      }
    }

    if (text[i] === '[') {
      const closeLabel = text.indexOf(']', i + 1);
      const openHref = text.indexOf('(', closeLabel + 1);
      const closeHref = text.indexOf(')', openHref + 1);
      if (closeLabel > i && openHref === closeLabel + 1 && closeHref > openHref + 1) {
        const label = text.slice(i + 1, closeLabel);
        const href = text.slice(openHref + 1, closeHref);
        nodes.push(
          <a
            key={`link-${key++}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline underline-offset-2"
          >
            {label}
          </a>
        );
        i = closeHref + 1;
        continue;
      }
    }

    if (text[i] === '\n') {
      nodes.push(<br key={`br-${key++}`} />);
      i += 1;
      continue;
    }

    let next = i + 1;
    while (
      next < text.length &&
      text[next] !== '`' &&
      text.slice(next, next + 2) !== '**' &&
      text[next] !== '_' &&
      text[next] !== '[' &&
      text[next] !== '\n'
    ) {
      next += 1;
    }
    pushText(text.slice(i, next));
    i = next;
  }

  return nodes;
}

export const InternalChatMessageBubble = React.memo(function InternalChatMessageBubble({
  message,
  isOwn,
  showSender,
  showAvatar = true,
  senderName,
  senderAvatar,
  statusIcon,
  replyPreview,
  replyToId,
  onReply,
  onEdit,
  onDelete,
  onJumpToReply,
  onTogglePin,
  isPinned,
  reactions,
  onAddReaction,
}: InternalChatMessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);
  const reactionButtonRef = useRef<HTMLButtonElement>(null);
  const isPrivate = message.message_type === 'private';
  const bubbleClassName = cn(
    'px-5 py-3 rounded-2xl shadow-sm border transition-all',
    isPrivate
      ? 'bg-amber-100 text-amber-900 border-amber-200'
      : isOwn
        ? 'bg-blue-600 text-white border-blue-700'
        : 'bg-white text-gray-800 border-gray-100',
    isOwn ? 'rounded-br-none' : 'rounded-bl-none'
  );

  useEffect(() => {
    if (!showReactions) return;
    const handleOutside = (event: Event) => {
      const target = event.target as Node;
      const path =
        typeof (event as Event & { composedPath?: () => EventTarget[] }).composedPath === 'function'
          ? (event as Event & { composedPath?: () => EventTarget[] }).composedPath()
          : undefined;
      const isInside = (node: Node | null) => {
        if (!node) return false;
        if (path) return path.includes(node);
        return node.contains(target);
      };

      if (isInside(reactionRef.current) || isInside(reactionButtonRef.current)) return;
      setShowReactions(false);
    };
    const handleWindowBlur = () => setShowReactions(false);
    document.addEventListener('pointerdown', handleOutside, true);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('pointerdown', handleOutside, true);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [showReactions]);

  const handleJump = () => {
    if (replyToId && onJumpToReply) {
      onJumpToReply(replyToId);
    }
  };

  return (
    <div id={`message-${message.id}`} className={cn('flex items-end space-x-3', isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row')}>
      {showAvatar ? (
        <div className="flex-shrink-0 self-end">
          <InternalAvatar src={senderAvatar} alt={senderName} size="sm" active={!isOwn} />
        </div>
      ) : null}

      <div className={cn('max-w-[80%] space-y-1 flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {replyPreview && (
          <button
            type="button"
            onClick={handleJump}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-500 shadow-sm hover:border-blue-200 hover:text-blue-500 transition-colors',
              isOwn ? 'self-end' : 'self-start'
            )}
          >
            <Reply className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex flex-col text-left min-w-0">
              <span className="uppercase tracking-wider text-[9px] font-semibold text-slate-400">
                Respondido
              </span>
              <span className="truncate max-w-[220px] italic">
                {replyPreview}
              </span>
            </div>
          </button>
        )}

        {showSender && !isOwn && (
          <p className="text-[11px] font-semibold text-gray-500">{senderName}</p>
        )}

        <div className="group relative">
          <div className={bubbleClassName}>
            {isPrivate && (
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
                Nota Privada
              </div>
            )}
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
              {renderMarkdown(message.content)}
              {message.edited_at && <span className="text-[10px] opacity-60 ml-2 italic">(editado)</span>}
            </div>
          </div>

          <div
            className={cn(
              'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1',
              isOwn ? 'right-full mr-2' : 'left-full ml-2'
            )}
          >
            {onTogglePin && (
              <button
                onClick={onTogglePin}
                title="Fixar"
                className="p-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 text-gray-400"
              >
                <Pin className={cn('w-3.5 h-3.5', isPinned ? 'text-blue-500' : '')} />
              </button>
            )}
            {onReply && (
              <button
                onClick={onReply}
                title="Responder"
                className="p-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 text-gray-400"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}
            {isOwn && onEdit && (
              <button
                onClick={onEdit}
                title="Editar"
                className="p-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 text-gray-400"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                title="Excluir"
                className="p-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-red-50 text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onAddReaction && (
              <div className="relative">
                <button
                  ref={reactionButtonRef}
                  onClick={() => setShowReactions((prev) => !prev)}
                  title="Reagir"
                  className="p-1.5 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 text-gray-400"
                >
                  <SmilePlus className="w-3.5 h-3.5" />
                </button>
                {showReactions && (
                  <div
                    ref={reactionRef}
                    className={cn(
                      'absolute top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg px-2 py-1 flex gap-1 z-20',
                      isOwn ? 'right-0' : 'left-0'
                    )}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={`${message.id}-${emoji}`}
                        type="button"
                        onClick={() => {
                          onAddReaction(emoji);
                          setShowReactions(false);
                        }}
                        className="text-base hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {reactions && Object.keys(reactions).length > 0 && (
          <div className={cn('flex items-center space-x-2 text-xs', isOwn ? 'justify-end' : 'justify-start')}>
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={`${message.id}-${emoji}`}
                type="button"
                onClick={() => onAddReaction?.(emoji)}
                className="px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        <div className={cn('flex items-center space-x-2', isOwn ? 'justify-end' : 'justify-start')}>
          <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && <div className="flex items-center ml-1">{statusIcon}</div>}
        </div>
      </div>
    </div>
  );
});


