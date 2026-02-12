import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onMentionClick?: (username: string) => void;
  readBy?: string[];
  notSeenBy?: string[];
}

/**
 * MessageBubble - Chatwoot-inspired message component
 * 
 * Design principles:
 * - Distinct visual styles for own vs. received messages
 * - Rounded corners with "bubble tail" effect (rounded-br-md for own, rounded-bl-md for others)
 * - Sender name shown for non-own messages when needed (group chats)
 * - Timestamps in small, muted text
 * - Mentions (@username) highlighted
 */
export function MessageBubble({ 
  message, 
  isOwn, 
  showSender = false,
  onReply,
  onEdit,
  onDelete,
  onMentionClick,
  readBy,
  notSeenBy,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only close if clicking outside the menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      // Delay adding listener to avoid immediate trigger
      const timer = setTimeout(() => {
        window.addEventListener('click', handleClickOutside);
      }, 10);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle: if menu is already open, close it
    if (showMenu) {
      setShowMenu(false);
      return;
    }
    
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }
  
  const renderContent = (content: string) => {
    // Highlight mentions (@username)
    const parts = content.split(/(@\w+)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const username = part.slice(1); // Remove @ prefix
        return (
          <button 
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMentionClick?.(username);
            }}
            className={cn(
              'font-semibold px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity',
              isOwn 
                ? 'bg-white/20 text-white' 
                : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            )}
            title={`Clique para ver ${username} ou iniciar conversa`}
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const replyMatch = message.content.startsWith('↩︎ ')
    ? message.content.split('\n')
    : null;
  const replyPreview = replyMatch ? replyMatch[0].replace('↩︎ ', '').trim() : null;
  const mainContent = replyMatch ? replyMatch.slice(1).join('\n') : message.content;

  return (
    <div 
      id={`message-${message.id}`}
      className={cn(
        'flex mb-3 px-6 animate-fade-in-up',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        onContextMenu={handleContextMenu}
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5 transition-all chatwoot-bubble relative',
          message.message_type === 'private'
            ? 'bg-amber-100 text-amber-900 border border-amber-200'
            : isOwn
              ? 'chatwoot-bubble--own'
              : 'chatwoot-bubble--peer'
        )}
      >
        {/* Sender name (only for non-own messages in group chats) */}
        {showSender && !isOwn && message.sender && (
          <p className="text-xs font-semibold mb-1 opacity-75">
            {message.sender.name}
          </p>
        )}
        
        {message.message_type === 'private' && (
          <div className="mb-1">
            <span className="text-[10px] uppercase tracking-wide bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              Nota privada
            </span>
          </div>
        )}

        {replyPreview && (
          <div className="mb-2 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
            {replyPreview}
          </div>
        )}

        {/* Message content with mention highlighting */}
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {renderContent(mainContent)}
        </div>
        
        {/* Timestamp */}
        <p className={cn(
          'text-[10px] mt-1 leading-none chatwoot-meta flex items-center gap-1',
          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          <span>{formatTime(message.created_at)}</span>
          {message.edited_at && (
            <span className="italic">(editada)</span>
          )}
          {isOwn && message.message_type !== 'private' && (
            <span className={cn('chatwoot-delivery', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              ✓✓
            </span>
          )}
        </p>

        {isOwn && (
          <>
            {readBy && readBy.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Visto por {readBy.join(', ')}
              </p>
            )}
            {notSeenBy && notSeenBy.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Não visto por {notSeenBy.join(', ')}
              </p>
            )}
          </>
        )}

        {showMenu && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 bg-white dark:bg-zinc-900 text-foreground border border-border rounded-lg shadow-2xl py-1.5 text-sm min-w-[10rem]"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            <button
              className="block w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => { onReply?.(message); setShowMenu(false); }}
            >
              Responder
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => { onEdit?.(message); setShowMenu(false); }}
            >
              Editar
            </button>
            <div className="border-t border-border my-1" />
            <button
              className="block w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors"
              onClick={() => { onDelete?.(message); setShowMenu(false); }}
            >
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
