import { Users, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatRoom } from '../types';

interface ConversationCardProps {
  conversation: ChatRoom;
  isActive: boolean;
  isSelected?: boolean;
  onSelect: (conversation: ChatRoom) => void;
  onToggleSelect?: (conversationId: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

/**
 * ConversationCard - Chatwoot-inspired conversation list item
 * 
 * Design principles:
 * - Clear visual hierarchy (name > last message > timestamp)
 * - Unread badge in teal color (n-teal-9)
 * - Avatar with online status for DMs
 * - Hover state with subtle background change
 * - Active state with border and card-select animation
 * - Selection checkbox appears on hover
 * 
 * UX patterns from Chatwoot:
 * - Truncate long names/messages with ellipsis
 * - Font weight distinction (semibold for unread, medium for read)
 * - Compact spacing for high-density lists
 */
export function ConversationCard({
  conversation,
  isActive,
  isSelected = false,
  onSelect,
  onToggleSelect,
  showCheckbox = false,
}: ConversationCardProps) {
  const [hovered, setHovered] = React.useState(false);

  const hasUnread = (conversation.unread_count ?? 0) > 0;
  const displayCount = conversation.unread_count && conversation.unread_count > 9 
    ? '9+' 
    : conversation.unread_count;

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <button
      onClick={() => onSelect(conversation)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all relative chatwoot-room-item',
        'border border-transparent',
        isActive && 'chatwoot-room-item--active',
        isSelected && 'bg-muted'
      )}
    >
      {/* Avatar with status indicator */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold chatwoot-avatar',
          conversation.type === 'dm' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-muted text-foreground'
        )}>
          {conversation.type === 'dm' ? (
            getInitials(conversation.name)
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>
        
        {/* Online status (only for DMs) */}
        {conversation.type === 'dm' && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
        
        {/* Selection checkbox (appears on hover) */}
        {showCheckbox && (hovered || isSelected) && onToggleSelect && (
          <label
            className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer bg-background/90 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onToggleSelect(conversation.id, e.target.checked)}
              className="cursor-pointer"
            />
          </label>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row: Name + Type badge + Time */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <p className={cn(
              'truncate',
              hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
            )}>
              {conversation.name}
            </p>
            {conversation.type === 'dm' && (
              <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                DM
              </span>
            )}
            {conversation.type === 'room' && (
              <Hash className="flex-shrink-0 w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>

        {/* Last message */}
        <p className={cn(
          'text-xs truncate',
          hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
        )}>
          {conversation.last_message || 'Sem mensagens'}
        </p>
      </div>

      {/* Unread badge */}
      {hasUnread && (
        <span className="flex-shrink-0 rounded-full text-[10px] font-semibold h-4 leading-4 min-w-[1rem] px-1 text-center text-primary-foreground bg-primary">
          {displayCount}
        </span>
      )}
    </button>
  );
}

// Add React import at the top
import React from 'react';
