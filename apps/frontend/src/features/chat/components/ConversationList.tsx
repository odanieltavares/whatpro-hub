import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConversationCard } from './ConversationCard';
import type { ChatRoom } from '../types';

interface ConversationListProps {
  conversations: ChatRoom[];
  selectedConversation: ChatRoom | null;
  onSelectConversation: (conversation: ChatRoom) => void;
  loading?: boolean;
  enableBulkActions?: boolean;
}

/**
 * ConversationList - Sidebar with searchable conversation list
 * 
 * Features:
 * - Search/filter conversations
 * - Bulk selection mode (optional)
 * - Grouped by type (DMs first, then rooms)
 * - Loading state
 * - Empty state
 */
export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading = false,
  enableBulkActions = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate DMs and rooms
  const dms = filteredConversations.filter(c => c.type === 'dm');
  const rooms = filteredConversations.filter(c => c.type === 'room');

  const handleToggleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-muted-foreground text-sm mb-1">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
            </p>
            {searchQuery && (
              <p className="text-muted-foreground text-xs">
                Tente outro termo de busca
              </p>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* DMs section */}
            {dms.length > 0 && (
              <div className="mb-4">
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Mensagens Diretas
                </h3>
                <div className="space-y-1">
                  {dms.map(conv => (
                    <ConversationCard
                      key={conv.id}
                      conversation={conv}
                      isActive={selectedConversation?.id === conv.id}
                      isSelected={selectedIds.has(conv.id)}
                      onSelect={onSelectConversation}
                      onToggleSelect={enableBulkActions ? handleToggleSelect : undefined}
                      showCheckbox={enableBulkActions}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rooms section */}
            {rooms.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Grupos
                </h3>
                <div className="space-y-1">
                  {rooms.map(conv => (
                    <ConversationCard
                      key={conv.id}
                      conversation={conv}
                      isActive={selectedConversation?.id === conv.id}
                      isSelected={selectedIds.has(conv.id)}
                      onSelect={onSelectConversation}
                      onToggleSelect={enableBulkActions ? handleToggleSelect : undefined}
                      showCheckbox={enableBulkActions}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk actions footer (if enabled and items selected) */}
      {enableBulkActions && selectedIds.size > 0 && (
        <div className="border-t p-3 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selecionada(s)
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-primary hover:underline"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
