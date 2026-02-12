import { useMemo } from 'react';
import type { ChatMessage } from '../types';

/**
 * Performance hooks for chat optimization
 * 
 * @performance-profiling principles:
 * - Memoize expensive computations
 * - Avoid unnecessary re-renders
 * - Optimize filters and sorts
 * 
 * @clean-code: Pure functions, single responsibility
 */

/**
 * useFilteredMessages
 * 
 * Memoizes filtered message list
 * Only recomputes when messages or query changes
 */
export function useFilteredMessages(
  messages: ChatMessage[],
  searchQuery: string
) {
  return useMemo(() => {
    if (!searchQuery.trim()) return messages;

    const query = searchQuery.toLowerCase();
    return messages.filter(msg =>
      msg.content.toLowerCase().includes(query) ||
      msg.sender_name?.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);
}

/**
 * useSortedMessages
 * 
 * Memoizes sorted message list
 * Prevents re-sorting on every render
 */
export function useSortedMessages(
  messages: ChatMessage[],
  sortBy: 'asc' | 'desc' = 'asc'
) {
  return useMemo(() => {
    const sorted = [...messages].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortBy === 'asc' ? timeA - timeB : timeB - timeA;
    });
    return sorted;
  }, [messages, sortBy]);
}

/**
 * useGroupedMessages
 * 
 * Groups messages by date for section headers
 * Memoized to avoid recalculation
 */
export function useGroupedMessages(messages: ChatMessage[]) {
  return useMemo(() => {
    const groups = new Map<string, ChatMessage[]>();
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('pt-BR');
      const existing = groups.get(date) || [];
      groups.set(date, [...existing, msg]);
    });

    return Array.from(groups.entries()).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  }, [messages]);
}

/**
 * useUnreadCount
 * 
 * Efficiently counts unread messages
 * Memoized to prevent recalculation
 */
export function useUnreadCount(messages: ChatMessage[], readUntil?: string) {
  return useMemo(() => {
    if (!readUntil) return messages.length;
    
    const readDate = new Date(readUntil);
    return messages.filter(msg => 
      new Date(msg.created_at) > readDate
    ).length;
  }, [messages, readUntil]);
}

/**
 * Performance comparison:
 * 
 * WITHOUT useMemo:
 * - Filter runs on EVERY render
 * - 1000 messages × 60fps = 60,000 filter operations/sec
 * - Causes jank and lag
 * 
 * WITH useMemo:
 * - Filter runs ONLY when messages/query changes
 * - ~1-2 filter operations/sec
 * - Smooth 60fps performance
 */
