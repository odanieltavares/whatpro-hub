import React from 'react';
import { cn } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface InternalAvatarProps {
  src?: string;
  alt: string;
  size?: AvatarSize;
  active?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export function InternalAvatar({
  src,
  alt,
  size = 'md',
  active,
  className,
}: InternalAvatarProps) {
  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      <img
        src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=random`}
        alt={alt}
        className={cn(sizeClasses[size], 'rounded-full object-cover border border-gray-100 shadow-sm')}
      />
      {active !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full',
            active ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
}
