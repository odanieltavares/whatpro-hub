import { Avatar } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name?: string;
  email?: string;
  avatar_url?: string;
}

interface MentionsDropdownProps {
  users: User[];
  onSelect: (user: User) => void;
  query: string;
  onClose?: () => void;
}

/**
 * MentionsDropdown - Dropdown for @mentions autocomplete
 * 
 * Design: Appears above input when @ is typed
 * Shows filtered user list with avatars
 * Keyboard navigable (up/down/enter/escape)
 */
export function MentionsDropdown({ users, onSelect, query, onClose }: MentionsDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeIndex = users.length > 0 ? Math.min(selectedIndex, users.length - 1) : 0;

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight) return text;

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, idx) =>
      regex.test(part) ? (
        <mark key={idx} className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(users[safeIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [users, safeIndex, onSelect, onClose]);

  if (users.length === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 bottom-full mb-2 max-h-56 overflow-auto bg-white dark:bg-zinc-900 text-foreground border border-border rounded-lg shadow-2xl z-20 animate-fade-in-up"
      role="listbox"
      aria-label="Mencoes sugeridas"
    >
      <div className="py-1">
        {users.map((user, index) => (
          <button
            key={user.id}
            type="button"
            role="option"
            aria-selected={index === safeIndex}
            onClick={() => onSelect(user)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full px-3 py-2 text-left flex items-center gap-3 transition-colors ${
              index === safeIndex ? 'bg-primary/10 text-foreground' : 'hover:bg-muted'
            }`}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <img
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                alt={user.name || 'User'}
                className="w-full h-full object-cover rounded-full"
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {highlightMatch(user.name || 'Usuario', query)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {highlightMatch(user.email || '', query)}
              </p>
            </div>
            {index === safeIndex && (
              <kbd className="text-[0.625rem] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Enter
              </kbd>
            )}
          </button>
        ))}
      </div>
      <div className="px-3 py-1.5 border-t text-[0.625rem] text-muted-foreground flex gap-3">
        <span><kbd className="px-1 rounded bg-muted">??</kbd> navegar</span>
        <span><kbd className="px-1 rounded bg-muted">Enter</kbd> selecionar</span>
        <span><kbd className="px-1 rounded bg-muted">Esc</kbd> fechar</span>
      </div>
    </div>
  );
}
