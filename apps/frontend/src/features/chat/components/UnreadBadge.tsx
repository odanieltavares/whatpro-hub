// UnreadBadge component

interface UnreadBadgeProps {
  count: number;
  onClick?: () => void;
}

/**
 * UnreadBadge - Floating badge showing unread message count
 * 
 * Design: Chatwoot-style floating badge positioned above the message list
 * Clickable to scroll to first unread message
 */
export function UnreadBadge({ count, onClick }: UnreadBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > 9 ? '9+' : count;
  const label = count > 1 ? 'mensagens não lidas' : 'mensagem não lida';

  return (
    <div className="sticky top-4 z-10 flex justify-center pointer-events-none mb-4">
      <button
        onClick={onClick}
        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold px-3 py-1 transition-all pointer-events-auto animate-fade-in-up"
      >
        {displayCount} {label}
      </button>
    </div>
  );
}
