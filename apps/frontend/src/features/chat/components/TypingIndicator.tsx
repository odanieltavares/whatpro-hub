import { cn } from '@/lib/utils';

/**
 * TypingIndicator - Animated typing indicator
 * 
 * Design principles (@frontend-specialist):
 * - Subtle animation (bounce)
 * - Consistent with brand (blue)
 * - Non-intrusive
 * - Clear context (username)
 * 
 * Performance (@performance-profiling):
 * - CSS animations (GPU accelerated)
 * - No JS animation loops
 */

interface TypingIndicatorProps {
  username?: string;
  className?: string;
}

export function TypingIndicator({ username = 'Alguém', className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      {/* Avatar placeholder */}
      <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
      
      {/* Bubble with dots */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">{username} está digitando</span>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
