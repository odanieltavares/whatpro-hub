import React from 'react';
import { Info } from 'lucide-react';
import { InternalAvatar } from './InternalAvatar';
import { cn } from '@/lib/utils';

interface InternalChatHeaderProps {
  title: string;
  status: string;
  avatar?: string;
  isOnline?: boolean;
  isProfileOpen: boolean;
  onToggleProfile: () => void;
}

export function InternalChatHeader({
  title,
  status,
  avatar,
  isOnline,
  isProfileOpen,
  onToggleProfile,
}: InternalChatHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center space-x-3">
        <InternalAvatar src={avatar} alt={title} size="md" active={isOnline} />
        <div>
          <h2 className="font-bold text-[#1e293b] text-sm leading-tight">{title}</h2>
          <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{status}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleProfile}
          className={cn(
            'p-2 rounded-full transition-colors',
            isProfileOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
          )}
          aria-label="Abrir perfil"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
