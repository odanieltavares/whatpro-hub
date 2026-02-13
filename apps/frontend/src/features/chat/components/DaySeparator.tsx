// DaySeparator component - no React import needed

interface DaySeparatorProps {
  date: string;
}

/**
 * DaySeparator - Visual separator between messages from different days
 * 
 * Design: Subtle horizontal line with centered date text
 * Follows Chatwoot's minimalist approach to day separators
 */
export function DaySeparator({ date }: DaySeparatorProps) {
  const formatDate = (dateStr: string) => {
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for comparison
    const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (msgDateOnly.getTime() === todayOnly.getTime()) {
      return 'Hoje';
    }
    
    if (msgDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Ontem';
    }
    
    return msgDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long',
      year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="flex items-center justify-center my-3 px-6">
      <div className="flex-1 h-px bg-border" />
      <span className="px-2 text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
