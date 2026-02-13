import { cn } from '@/lib/utils';

/**
 * MessageSkeleton - Loading skeleton for messages
 * 
 * Design principles (@frontend-specialist):
 * - Matches MessageBubble structure
 * - Smooth pulse animation
 * - Variant for own/peer messages
 * 
 * Performance (@performance-profiling):
 * - Pure CSS animations
 * - Lightweight DOM
 */

interface MessageSkeletonProps {
  variant?: 'own' | 'peer';
  count?: number;
}

export function MessageSkeleton({ variant = 'peer', count = 3 }: MessageSkeletonProps) {
  const isOwn = variant === 'own';

  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex gap-3 animate-pulse',
            isOwn && 'justify-end'
          )}
        >
          {/* Avatar */}
          {!isOwn && (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
          )}

          {/* Message bubble skeleton */}
          <div
            className={cn(
              'max-w-[75%] rounded-2xl px-4 py-3 space-y-2',
              isOwn ? 'bg-blue-100' : 'bg-gray-100'
            )}
          >
            {/* Sender name (only for peer) */}
            {!isOwn && (
              <div className="h-3 w-24 bg-gray-300 rounded" />
            )}
            
            {/* Content lines */}
            <div className="space-y-1.5">
              <div className={cn(
                'h-3 bg-gray-300 rounded',
                i % 2 === 0 ? 'w-48' : 'w-36'
              )} />
              <div className="h-3 w-32 bg-gray-300 rounded" />
            </div>

            {/* Timestamp */}
            <div className="h-2 w-16 bg-gray-300 rounded" />
          </div>

          {/* Avatar (own messages) */}
          {isOwn && (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
