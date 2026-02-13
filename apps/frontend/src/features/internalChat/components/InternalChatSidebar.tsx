import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Plus, Search, Check, CheckCheck, Pin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InternalAvatar } from './InternalAvatar';
import type { ChatRoom } from '../../chat/types';

interface InternalChatSidebarProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  onCreateGroup: () => void;
  filter?: 'all' | 'open' | 'resolved';
  onFilterChange?: (next: 'all' | 'open' | 'resolved') => void;
  getLastMessageStatus?: (roomId: string) => 'pending' | 'sent' | 'delivered' | 'read' | null;
  onTogglePinRoom?: (room: ChatRoom) => void;
  isRoomPinned?: (room: ChatRoom) => boolean;
}

const FILTERS: Array<{ key: 'all' | 'open' | 'resolved'; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Abertas' },
  { key: 'resolved', label: 'Resolvidas' },
];

export function InternalChatSidebar({
  rooms,
  activeRoomId,
  onSelectRoom,
  onCreateGroup,
  filter = 'all',
  onFilterChange,
  getLastMessageStatus,
  onTogglePinRoom,
  isRoomPinned,
}: InternalChatSidebarProps) {
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const needle = search.toLowerCase();
    return rooms.filter((r) => r.name?.toLowerCase().includes(needle));
  }, [rooms, search]);

  const groupAvatar = (name?: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Grupo')}&background=1e3a8a&color=ffffff&bold=true`;
  const dmAvatar = (name?: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Contato')}&background=e2e8f0&color=0f172a&bold=true`;
  const getRoomAvatar = (room: ChatRoom) =>
    room.type === 'room'
      ? groupAvatar(room.name || undefined)
      : (room as { avatar_url?: string }).avatar_url || dmAvatar(room.name || undefined);

  const sortPinnedFirst = useCallback(
    (list: ChatRoom[]) => [...list].sort((a, b) => Number(!!isRoomPinned?.(b)) - Number(!!isRoomPinned?.(a))),
    [isRoomPinned]
  );

  const { dmRooms, groupRooms } = useMemo(() => {
    const groups = filteredRooms.filter((room) => room.type === 'room');
    const dms = filteredRooms.filter((room) => room.type !== 'room');
    return { dmRooms: sortPinnedFirst(dms), groupRooms: sortPinnedFirst(groups) };
  }, [filteredRooms, sortPinnedFirst]);

  const orderedRooms = useMemo(() => [...groupRooms, ...dmRooms], [groupRooms, dmRooms]);

  const pinnedGroupCount = useMemo(() =>
    groupRooms.filter(r => isRoomPinned?.(r)).length,
    [groupRooms, isRoomPinned]
  );

  const pinnedDmCount = useMemo(() =>
    dmRooms.filter(r => isRoomPinned?.(r)).length,
    [dmRooms, isRoomPinned]
  );

  const handleTogglePin = (room: ChatRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTogglePinRoom || !isRoomPinned) return;

    const isPinned = isRoomPinned(room);

    // If unpinning, just do it
    if (isPinned) {
      onTogglePinRoom(room);
      return;
    }

    // If pinning, check limits
    if (room.type === 'room') {
      if (pinnedGroupCount >= 2) {
        setError('Máximo de 2 grupos fixados');
        return;
      }
    } else {
      if (pinnedDmCount >= 3) {
        setError('Máximo de 3 conversas fixadas');
        return;
      }
    }

    onTogglePinRoom(room);
  };

  const renderLastMessageStatus = (roomId: string) => {
    const status = getLastMessageStatus?.(roomId);
    if (!status) return null;
    if (status === 'pending') return <Check className="w-3 h-3 text-gray-300 mr-1" />;
    if (status === 'sent') return <Check className="w-3 h-3 text-gray-400 mr-1" />;
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-400 mr-1" />;
    if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-500 mr-1" />;
    return null;
  };

  return (
    <div className="w-80 h-full flex flex-col bg-white border-r border-gray-100 shadow-sm z-10 font-['Inter'] relative">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-3 h-3 mr-1.5" />
          {error}
        </div>
      )}

      <div className="p-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1e293b] tracking-tight">Mensagens</h2>
        <button
          onClick={onCreateGroup}
          className="flex items-center space-x-1 text-blue-600 font-semibold text-sm bg-[#eff6ff] px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          <span>Novo Chat</span>
        </button>
      </div>

      <div className="px-5 mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {orderedRooms.slice(0, 8).map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
              title={room.name}
            >
              <InternalAvatar src={getRoomAvatar(room)} alt={room.name} size="sm" active={true} />
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar mensagens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {onFilterChange && (
        <div className="px-5 mb-3">
          <div className="flex gap-2 bg-gray-50 p-1 rounded-full">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                onClick={() => onFilterChange(item.key)}
                className={cn(
                  'flex-1 text-[11px] font-bold py-1.5 rounded-full transition-all',
                  filter === item.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {groupRooms.length > 0 && (
          <div className="px-5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Grupos
          </div>
        )}
        {groupRooms.map((room) => {
          const isActive = activeRoomId === room.id;
          const unreadCount = room.unread_count || 0;
          const pinned = isRoomPinned?.(room);

          return (
            <div
              key={room.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectRoom(room)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectRoom(room);
              }}
              className={cn(
                'group w-full flex items-center px-5 py-3 transition-all relative border-b border-gray-50/50 cursor-pointer text-left',
                isActive ? 'bg-[#f1f7ff]' : 'hover:bg-gray-50'
              )}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-600" />}

              <div className="relative flex-shrink-0">
                <InternalAvatar src={getRoomAvatar(room)} alt={room.name} size="md" active={true} />
              </div>

              <div className="ml-3 flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span
                    className={cn(
                      'text-[14px] font-bold truncate',
                      isActive ? 'text-[#0f172a]' : 'text-[#334155]'
                    )}
                  >
                    {room.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 font-medium ml-2">
                      {room.last_message_at
                        ? new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1 mr-2">
                    {renderLastMessageStatus(room.id)}
                    <p
                      className={cn(
                        'text-[12px] truncate',
                        unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'
                      )}
                    >
                      {room.last_message || 'Sem mensagens'}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <div className="flex-shrink-0 bg-blue-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] flex items-center justify-center rounded-full px-1.5 shadow-sm shadow-blue-200">
                      {unreadCount}
                    </div>
                  )}
                </div>
              </div>
              {onTogglePinRoom && (
                <button
                  type="button"
                  onClick={(e) => handleTogglePin(room, e)}
                  className={cn(
                    "absolute right-3 top-3 transition-opacity",
                    pinned
                      ? "opacity-100 text-amber-500"
                      : "opacity-0 group-hover:opacity-100 text-gray-300 hover:text-amber-500"
                  )}
                  title={pinned ? "Desafixar grupo" : "Fixar grupo"}
                >
                  <Pin className={cn("w-3.5 h-3.5", pinned && "fill-current")} />
                </button>
              )}
            </div>
          );
        })}

        {dmRooms.length > 0 && (
          <div className="px-5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Conversas
          </div>
        )}
        {dmRooms.map((room) => {
          const isActive = activeRoomId === room.id;
          const unreadCount = room.unread_count || 0;
          const pinned = isRoomPinned?.(room);

          return (
            <div
              key={room.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectRoom(room)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectRoom(room);
              }}
              className={cn(
                'group w-full flex items-center px-5 py-3 transition-all relative border-b border-gray-50/50 cursor-pointer text-left',
                isActive ? 'bg-[#f1f7ff]' : 'hover:bg-gray-50'
              )}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-600" />}

              <div className="relative flex-shrink-0">
                <InternalAvatar src={getRoomAvatar(room)} alt={room.name} size="md" active={true} />
              </div>

              <div className="ml-3 flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span
                    className={cn(
                      'text-[14px] font-bold truncate',
                      isActive ? 'text-[#0f172a]' : 'text-[#334155]'
                    )}
                  >
                    {room.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 font-medium ml-2">
                      {room.last_message_at
                        ? new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1 mr-2">
                    {renderLastMessageStatus(room.id)}
                    <p
                      className={cn(
                        'text-[12px] truncate',
                        unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'
                      )}
                    >
                      {room.last_message || 'Sem mensagens'}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <div className="flex-shrink-0 bg-blue-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] flex items-center justify-center rounded-full px-1.5 shadow-sm shadow-blue-200">
                      {unreadCount}
                    </div>
                  )}
                </div>
              </div>
              {onTogglePinRoom && (
                <button
                  type="button"
                  onClick={(e) => handleTogglePin(room, e)}
                  className={cn(
                    "absolute right-3 top-3 transition-opacity",
                    pinned
                      ? "opacity-100 text-amber-500"
                      : "opacity-0 group-hover:opacity-100 text-gray-300 hover:text-amber-500"
                  )}
                  title={pinned ? "Desafixar conversa" : "Fixar conversa"}
                >
                  <Pin className={cn("w-3.5 h-3.5", pinned && "fill-current")} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
