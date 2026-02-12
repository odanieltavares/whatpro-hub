import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import type { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onRetry?: (message: ChatMessage) => void; // For failed messages
  onMentionClick?: (username: string) => void;
  readBy?: string[];
  notSeenBy?: string[];
}

/**
 * MessageBubble - Premium chat message component with bubble layout
 * 
 * Design principles (following @frontend-specialist):
 * - Premium gradients for own messages (blue-600 to blue-700)
 * - Subtle shadows with hover depth effect
 * - Refined typography (14px content, 11px timestamp, 13px sender)
 * - Micro-animations (hover scale, pulse for sending)
 * - Blue @mentions with click to DM
 * 
 * Performance optimizations (following @performance-profiling):
 * - Memoized to prevent unnecessary re-renders
 * - Computed values outside render
 * - Efficient event handlers
 */
export const MessageBubble = React.memo(function MessageBubble({ 
  message, 
  isOwn, 
  showSender = true,
  onReply,
  onEdit,
  onDelete,
  onRetry,
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
    
    // Always close first, then reopen to prevent duplicates
    setShowMenu(false);
    
    // Small delay to ensure close completes before reopen
    setTimeout(() => {
      setMenuPos({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    }, 10);
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
              'font-semibold px-1.5 py-0.5 rounded-md cursor-pointer transition-all',
              isOwn 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70'
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
          'group max-w-[75%] px-4 py-3 transition-all duration-200 relative',
          'hover:scale-[1.01]',
          message.message_type === 'private'
            ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl shadow-sm'
            : isOwn
              ? cn(
                  'bg-gradient-to-br from-blue-600 to-blue-700 text-white',
                  'rounded-2xl rounded-br-md shadow-md hover:shadow-lg',
                  'chatwoot-bubble chatwoot-bubble--own'
                )
              : cn(
                  'bg-white text-gray-900 border border-gray-200',
                  'rounded-2xl rounded-bl-md shadow-sm hover:shadow-md',
                  'chatwoot-bubble chatwoot-bubble--peer'
                )
        )}
      >
        {/* Sender name (non-own messages) */}
        {!isOwn && showSender && message.sender && (
          <p className="font-semibold text-[13px] text-gray-700 mb-1 tracking-tight">
            {message.sender.name}
          </p>
        )}

        {/* Reply preview */}
        {replyPreview && (
          <div className={cn(
            'mb-2 pl-3 py-1.5 border-l-2 text-sm rounded-r',
            isOwn 
              ? 'border-white/30 bg-white/10' 
              : 'border-blue-300 bg-blue-50'
          )}>
            <div className={cn(
              'flex items-center gap-1 mb-0.5',
              isOwn ? 'text-white/70' : 'text-blue-700'
            )}>
              <span className="text-xs font-medium">↩ Respondendo</span>
            </div>
            <p className={cn(
              'text-xs line-clamp-2',
              isOwn ? 'text-white/90' : 'text-gray-700'
            )}>
              {replyPreview}
            </p>
          </div>
        )}

        {/* Private note badge */}
        {message.message_type === 'private' && (
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-medium">
              Nota privada
            </span>
          </div>
        )}

        {/* Message content with mention highlighting */}
        <div className="text-[14px] leading-relaxed break-words tracking-normal">
          {renderContent(mainContent)}
          
          {message.edited_at && (
            <span className={cn(
              'ml-2 text-xs font-medium',
              isOwn ? 'text-white/60' : 'text-gray-400'
            )}>
              (editada)
            </span>
          )}
        </div>
        
        {/* Timestamp and status */}
        <div className="flex items-center gap-2 mt-1.5">
          <p className={cn(
            'text-[11px] font-medium',
            isOwn ? 'text-white/70' : 'text-gray-400'
          )}>
            {formatTime(message.created_at)}
          </p>

          {/* Status indicators */}
          {message.status === 'sending' && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-current opacity-50 animate-pulse" />
            </div>
          )}
          
          {message.status === 'failed' && isOwn && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              <button 
                onClick={() => onRetry?.(message)}
                className="text-[10px] font-semibold hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        {/* Read receipts (only for own messages) */}
        {isOwn && message.message_type !== 'private' && (
          <>
            {readBy && readBy.length > 0 && (
              <p className="text-[10px] text-white/60 mt-1 font-medium">
                Visto por {readBy.join(', ')}
              </p>
            )}
            {notSeenBy && notSeenBy.length > 0 && (
              <p className="text-[10px] text-white/50 mt-0.5">
                Não visto por {notSeenBy.join(', ')}
              </p>
            )}
          </>
        )}

        {/* Context Menu - Fixed contrast and z-index */}
        {showMenu && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[100] bg-white border-2 border-gray-300 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.24)] py-1.5 text-sm min-w-[10rem]"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            <button
              className="block w-full text-left px-4 py-2 text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onClick={() => { onReply?.(message); setShowMenu(false); }}
            >
              Responder
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-gray-900 font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onClick={() => { onEdit?.(message); setShowMenu(false); }}
            >
              Editar
            </button>
            <div className="border-t border-gray-200 my-1" />
            <button
              className="block w-full text-left px-4 py-2 text-red-600 font-medium hover:bg-red-50 hover:text-red-700 transition-colors"
              onClick={() => { onDelete?.(message); setShowMenu(false); }}
            >
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
