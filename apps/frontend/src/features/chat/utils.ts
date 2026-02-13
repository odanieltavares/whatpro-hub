// Chat utility functions

/**
 * Groups messages by day for rendering with DaySeparator components
 * 
 * @param messages Array of chat messages
 * @returns Array of grouped messages with date keys
 */
export function groupMessagesByDay<T extends { created_at: string }>(messages: T[]): Array<{ date: string; messages: T[] }> {
  const isDateStr = (val: unknown): val is string => typeof val === 'string';
  const validMessages = messages.filter(msg => isDateStr(msg?.created_at));

  const groups: Record<string, T[]> = {};
  
  validMessages.forEach(message => {
    const date = new Date(message.created_at);
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    
    groups[dayKey].push(message);
  });
  
  // Convert to array and sort by date
  return Object.entries(groups)
    .map(([date, msgs]) => ({
      date,
      messages: msgs.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Determines if sender name should be shown for a message
 * 
 * @param message Current message
 * @param previousMessage Previous message in the list
 * @param isGroupChat Whether this is a group chat (vs DM)
 * @returns Whether to show sender name
 */
export function shouldShowSender(
  message: { sender_id: number; created_at: string },
  previousMessage: { sender_id: number; created_at: string } | null,
  isGroupChat: boolean
): boolean {
  if (!isGroupChat) return false;
  
  if (!previousMessage) return true;
  
  // Show sender if different from previous message
  if (previousMessage.sender_id !== message.sender_id) return true;
  
  // Show sender if more than 5 minutes passed
  const timeDiff = new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime();
  const FIVE_MINUTES = 5 * 60 * 1000;
  
  return timeDiff > FIVE_MINUTES;
}
