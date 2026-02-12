import React from 'react';
import { cn } from '@/lib/utils';

interface InternalChatLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  profile?: React.ReactNode;
  className?: string;
}

export function InternalChatLayout({
  sidebar,
  main,
  profile,
  className,
}: InternalChatLayoutProps) {
  return (
    <div className={cn('h-full w-full flex overflow-hidden bg-gray-50', className)}>
      {sidebar}
      <main className="flex-1 flex overflow-hidden relative">{main}</main>
      {profile}
    </div>
  );
}
