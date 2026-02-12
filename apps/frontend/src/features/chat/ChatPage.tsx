import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useChatRooms,
  useChatMessages,
  useSendMessage,
  useMarkAsRead,
  useCreateRoom,
  useAccountUsers,
} from './hooks';
import type { ChatRoom, ChatMessage, AccountUser, SendMessageRequest } from './types';

// ============================================================================
// Icons (inline SVG for simplicity)
const MessageCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7 7 0 1116.65 2.35a7 7 0 010 14.3z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

// Mock data (enable via ?mock=1)
const mockParam =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock');
const USE_MOCK_DATA = mockParam === '1';

const isoMinutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();

const MOCK_USERS: AccountUser[] = [
  { id: 101, name: 'Larissa Pereira', email: 'larissa@whatpro.com' },
  { id: 102, name: 'Camila Santos', email: 'camila@whatpro.com' },
  { id: 103, name: 'Rafael Lima', email: 'rafael@whatpro.com' },
  { id: 104, name: 'Jorge Alves', email: 'jorge@whatpro.com' },
];

const MOCK_CONVERSATIONS: ChatRoom[] = [
  {
    id: 'mock-1',
    account_id: 1,
    type: 'dm',
    name: 'Camila Santos',
    created_by: 101,
    created_at: isoMinutesAgo(240),
    updated_at: isoMinutesAgo(5),
    last_message: 'Fechou, vou revisar o briefing.',
    last_message_at: isoMinutesAgo(5),
    unread_count: 1,
  },
  {
    id: 'mock-2',
    account_id: 1,
    type: 'dm',
    name: 'Rafael Lima',
    created_by: 101,
    created_at: isoMinutesAgo(480),
    updated_at: isoMinutesAgo(35),
    last_message: 'Acho que já está pronto para o piloto.',
    last_message_at: isoMinutesAgo(35),
    unread_count: 0,
  },
];

const MOCK_GROUPS: ChatRoom[] = [
  {
    id: 'mock-3',
    account_id: 1,
    type: 'room',
    name: 'Equipe Produto',
    created_by: 101,
    created_at: isoMinutesAgo(720),
    updated_at: isoMinutesAgo(12),
    last_message: 'Agendei o sync para amanhã 9h.',
    last_message_at: isoMinutesAgo(12),
    unread_count: 3,
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    room_id: 'mock-1',
    account_id: 1,
    sender_id: 102,
    content: 'Revisou o layout do chat interno?',
    message_type: 'text',
    created_at: isoMinutesAgo(55),
    sender: { id: 102, name: 'Camila Santos', email: 'camila@whatpro.com' },
  },
  {
    id: 'm2',
    room_id: 'mock-1',
    account_id: 1,
    sender_id: 101,
    content: 'Sim, estou alinhando com o estilo do Chatwoot.',
    message_type: 'text',
    created_at: isoMinutesAgo(52),
    sender: { id: 101, name: 'Larissa Pereira', email: 'larissa@whatpro.com' },
  },
  {
    id: 'm3',
    room_id: 'mock-1',
    account_id: 1,
    sender_id: 102,
    content: 'Fechou, vou revisar o briefing.',
    message_type: 'text',
    created_at: isoMinutesAgo(5),
    sender: { id: 102, name: 'Camila Santos', email: 'camila@whatpro.com' },
  },
  {
    id: 'm4',
    room_id: 'mock-3',
    account_id: 1,
    sender_id: 103,
    content: '@Larissa Pereira consegue validar o copy?',
    message_type: 'mention',
    created_at: isoMinutesAgo(40),
    sender: { id: 103, name: 'Rafael Lima', email: 'rafael@whatpro.com' },
  },
  {
    id: 'm5',
    room_id: 'mock-3',
    account_id: 1,
    sender_id: 101,
    content: 'Agendei o sync para amanhã 9h.',
    message_type: 'text',
    created_at: isoMinutesAgo(12),
    sender: { id: 101, name: 'Larissa Pereira', email: 'larissa@whatpro.com' },
  },
];

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDay = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
};

const renderMentionContent = (content: string) => {
  const parts = content.split(/(@[\\w.-]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="text-primary font-semibold">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// ============================================================================
// ROOM LIST COMPONENT
// ============================================================================

interface RoomListProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  loading: boolean;
}

function RoomList({ rooms, selectedRoom, onSelectRoom, loading }: RoomListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <MessageCircleIcon />
        <p className="mt-2 text-sm">Nenhuma conversa ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {rooms.map((room) => {
        const unread = room.unread_count || 0;
        const lastMessage = room.last_message || 'Sem mensagens ainda';
        const lastAt = formatTime(room.last_message_at);
        const isDm = room.type === 'dm';

        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={cn(
              'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all chatwoot-room-item',
              selectedRoom?.id === room.id && 'chatwoot-room-item--active'
            )}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {room.type === 'dm' ? (
                <span className="text-base font-semibold text-primary">
                  {room.name?.[0] || '?'}
                </span>
              ) : (
                <UsersIcon />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-medium truncate">{room.name || 'Direct Message'}</p>
                  {isDm && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      DM
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground ml-2">{lastAt}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {lastMessage}
              </p>
            </div>
            {unread > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                {unread}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MESSAGE LIST COMPONENT
// ============================================================================

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: number;
  loading: boolean;
}

function MessageList({ messages, currentUserId, loading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageCircleIcon />
          <p className="mt-2">Nenhuma mensagem ainda</p>
          <p className="text-sm">Envie a primeira mensagem!</p>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <ScrollArea className="flex-1 px-6 py-4 chatwoot-messages" ref={scrollRef}>
      <div className="space-y-4">
        {sortedMessages.map((msg, index) => {
          const isOwn = msg.sender_id === currentUserId;
          const isSystem = msg.message_type === 'system';
          const prev = index > 0 ? sortedMessages[index - 1] : null;
          const showDay = !prev || formatDay(prev.created_at) !== formatDay(msg.created_at);
          const showSender = !isOwn && (!prev || prev.sender_id !== msg.sender_id || showDay);

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className="space-y-2">
              {showDay && (
                <div className="flex justify-center">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDay(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2 shadow-sm chatwoot-bubble',
                    isOwn
                      ? 'chatwoot-bubble--own'
                      : 'chatwoot-bubble--peer'
                  )}
                >
                  {showSender && msg.sender && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {msg.sender.name}
                    </p>
                  )}
                  {msg.quote && (
                    <div className="mb-2 rounded-lg border border-dashed px-2 py-1 text-xs text-muted-foreground">
                      Conversa citada (ID {msg.quote.conversation_id}) - mensagem {msg.quote.chatwoot_message_id}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{renderMentionContent(msg.content)}</p>
                  <p
                    className={cn(
                      'text-[11px] mt-1 chatwoot-meta',
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// MESSAGE INPUT COMPONENT
// ============================================================================

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  users: AccountUser[];
  quoteDraft: QuoteDraft | null;
  onClearQuote: () => void;
  onQuoteChange: (draft: QuoteDraft) => void;
}

type QuoteDraft = {
  chatwoot_account_id: number;
  conversation_id: number;
  chatwoot_message_id: number;
};

function MessageInput({
  onSend,
  disabled,
  users,
  quoteDraft,
  onClearQuote,
  onQuoteChange,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMentionInput = (value: string) => {
    const mentionMatch = value.split(/\s+/).pop() || '';
    if (mentionMatch.startsWith('@')) {
      setShowMentions(true);
      setMentionQuery(mentionMatch.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(mentionQuery) || email.includes(mentionQuery);
  });

  const handleSelectMention = (user: AccountUser) => {
    const parts = content.split(/\s+/);
    parts[parts.length - 1] = `@${user.name || user.email}`;
    const next = parts.join(' ') + ' ';
    setContent(next);
    setShowMentions(false);
    setMentionQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background chatwoot-divider chatwoot-composer">
      {quoteDraft && (
        <div className="mb-3 rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground flex items-center justify-between chatwoot-surface">
          <div>
            Citando conversa {quoteDraft.conversation_id} (msg {quoteDraft.chatwoot_message_id})
          </div>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onClearQuote}>
            ✕
          </Button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleMentionInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          disabled={disabled}
          rows={1}
          className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 resize-none chatwoot-composer-input"
        />
        <Button type="submit" disabled={disabled || !content.trim()} size="icon">
          <SendIcon />
        </Button>
      </div>
      {showMentions && filteredUsers.length > 0 && (
        <div className="mt-2 rounded-xl border bg-background shadow-lg max-h-48 overflow-auto chatwoot-surface">
          {filteredUsers.slice(0, 6).map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectMention(user)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <div className="font-medium">{user.name || user.email}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground mt-2">
        Pressione Enter para enviar, Shift+Enter para quebrar linha
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() =>
            onQuoteChange({
              chatwoot_account_id: Number(localStorage.getItem('chatwoot_account_id') || '1'),
              conversation_id: 0,
              chatwoot_message_id: 0,
            })
          }
        >
          Citar conversa Chatwoot
        </Button>
        {quoteDraft && (
          <>
            <Input
              value={quoteDraft.conversation_id || ''}
              onChange={(e) =>
                onQuoteChange({
                  ...quoteDraft,
                  conversation_id: Number(e.target.value),
                })
              }
              placeholder="Conversation ID"
              className="h-7 text-xs"
            />
            <Input
              value={quoteDraft.chatwoot_message_id || ''}
              onChange={(e) =>
                onQuoteChange({
                  ...quoteDraft,
                  chatwoot_message_id: Number(e.target.value),
                })
              }
              placeholder="Message ID"
              className="h-7 text-xs"
            />
          </>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// CREATE ROOM DIALOG
// ============================================================================

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (room: ChatRoom) => void;
}

function CreateRoomDialog({ isOpen, onClose, onCreated }: CreateRoomDialogProps) {
  const [name, setName] = useState('');
  const { createRoom, loading } = useCreateRoom();

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const room = await createRoom({
        type: 'room',
        name: name.trim(),
        member_ids: [],
      });
      if (room) {
        setName('');
        onCreated(room);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 m-4 chatwoot-surface">
        <h2 className="text-lg font-semibold mb-4">Criar Novo Grupo</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Grupo</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipe Vendas, Suporte Técnico"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE DM DIALOG
// ============================================================================

interface CreateDMDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (room: ChatRoom) => void;
}

function CreateDMDialog({ isOpen, onClose, onCreated }: CreateDMDialogProps) {
  const [search, setSearch] = useState('');
  const { users, loading, error } = useAccountUsers();
  const { createRoom, loading: creating } = useCreateRoom();

  if (!isOpen) return null;

  const filteredUsers = users.filter((user) => {
    const name = user.name || '';
    const email = user.email || '';
    const needle = search.toLowerCase();
    return name.toLowerCase().includes(needle) || email.toLowerCase().includes(needle);
  });

  const handleCreateDM = async (user: AccountUser) => {
    const room = await createRoom({
      type: 'dm',
      name: user.name || user.email || 'Direct Message',
      member_ids: [user.id],
    });
    if (room) {
      onCreated(room);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 chatwoot-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nova Conversa</h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email"
          />
          {loading && (
            <div className="text-sm text-muted-foreground">Carregando usuários...</div>
          )}
          {error && (
            <div className="text-sm text-destructive">Erro ao carregar usuários.</div>
          )}
          {!loading && filteredUsers.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
          )}
          <div className="max-h-64 overflow-auto space-y-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleCreateDM(user)}
                className="w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left hover:bg-muted transition"
                disabled={creating}
              >
                <div>
                  <p className="font-medium text-sm">{user.name || user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">offline</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CHAT PAGE
// ============================================================================

export function ChatPage() {
  const variantParam =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('variant');
  const themeParam =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('theme');
  const embedParam =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed');
  const [uiVariant, setUiVariant] = useState<'b' | 'c'>(variantParam === 'c' ? 'c' : 'b');
  const isEmbed = embedParam === '1';

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateDMDialog, setShowCreateDMDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const lastMessageRef = useRef<string | null>(null);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);

  const { rooms, loading: roomsLoading, refetch: refetchRooms } = useChatRooms();
  const { users: accountUsers } = useAccountUsers();
  const { messages, loading: messagesLoading, refetch: refetchMessages } = useChatMessages(
    selectedRoom?.id || null
  );
  const { sendMessage, loading: sendingMessage } = useSendMessage(selectedRoom?.id || null);
  const { markAsRead } = useMarkAsRead(selectedRoom?.id || null);

  const currentUserId = parseInt(localStorage.getItem('user_id') || '0', 10);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('chatwoot-embed', isEmbed);
    if (themeParam === 'dark' || themeParam === 'light') {
      document.documentElement.dataset.chatwootTheme = themeParam;
    }
    return () => {
      document.body.classList.remove('chatwoot-embed');
    };
  }, [isEmbed, themeParam]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('variant', uiVariant);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
  }, [uiVariant]);

  useEffect(() => {
    if (selectedRoom) {
      markAsRead();
    }
  }, [selectedRoom, markAsRead]);

  useEffect(() => {
    if (!messages.length) return;
    const newest = [...messages].reduce((acc, msg) =>
      new Date(msg.created_at) > new Date(acc.created_at) ? msg : acc
    );

    if (lastMessageRef.current && newest.id !== lastMessageRef.current) {
      if (newest.sender_id !== currentUserId) {
        if (toastTimeoutRef.current) {
          window.clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = window.setTimeout(() => {
          setToast((newest.sender?.name || 'Nova mensagem') + ': ' + newest.content);
        }, 0);
      }
    }
    lastMessageRef.current = newest.id;
  }, [messages, currentUserId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleSendMessage = async (content: string) => {
    const payload: SendMessageRequest = { content };
    if (quoteDraft && quoteDraft.conversation_id && quoteDraft.chatwoot_message_id) {
      payload.quote = {
        chatwoot_account_id: quoteDraft.chatwoot_account_id,
        conversation_id: quoteDraft.conversation_id,
        chatwoot_message_id: quoteDraft.chatwoot_message_id,
      };
    }

    const result = await sendMessage(payload);
    if (result) {
      refetchMessages();
      refetchRooms();
      setQuoteDraft(null);
    }
  };

  const handleRoomCreated = (room: ChatRoom) => {
    refetchRooms();
    setSelectedRoom(room);
  };

  // Combine API rooms with mock data when enabled
  const allRooms = useMemo(() => {
    if (USE_MOCK_DATA) {
      // Merge mock data with API data, mock first for visibility
      const mockRooms = [...MOCK_CONVERSATIONS, ...MOCK_GROUPS];
      const apiRoomIds = rooms.map(r => r.id);
      const uniqueMocks = mockRooms.filter(m => !apiRoomIds.includes(m.id));
      return [...rooms, ...uniqueMocks];
    }
    return rooms;
  }, [rooms]);

  // Get messages with mock fallback
  const displayMessages = useMemo(() => {
    if (USE_MOCK_DATA && selectedRoom?.id.startsWith('mock-')) {
      return MOCK_MESSAGES.filter(m => m.room_id === selectedRoom.id);
    }
    return messages;
  }, [messages, selectedRoom]);

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return allRooms;
    const needle = search.toLowerCase();
    return allRooms.filter((room) => {
      const name = room.name || '';
      return name.toLowerCase().includes(needle);
    });
  }, [allRooms, search]);

  const usersForMentions = USE_MOCK_DATA && accountUsers.length === 0 ? MOCK_USERS : accountUsers;

  return (
    <div
      className={cn(
        'flex h-screen bg-background chatwoot-chat-shell',
        uiVariant === 'c' && 'chatwoot-variant-c'
      )}
      data-variant={uiVariant}
    >
      <div className="w-[320px] border-r bg-sidebar flex flex-col chatwoot-divider chatwoot-sidebar">
        <div className="p-4 border-b flex items-center justify-between chatwoot-divider chatwoot-sidebar-header">
          <div>
            <h1 className="font-semibold text-lg">Chat Interno</h1>
            <p className="text-xs text-muted-foreground">Visual nativo Chatwoot</p>
          </div>
          <div className="chatwoot-toolbar">
            <div className="chatwoot-pill flex items-center gap-1 p-1">
              <button
                type="button"
                data-active={uiVariant === 'b'}
                onClick={() => setUiVariant('b')}
              >
                B
              </button>
              <button
                type="button"
                data-active={uiVariant === 'c'}
                onClick={() => setUiVariant('c')}
              >
                C
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" title="Nova conversa" className="chatwoot-ghost">
                  <PlusIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCreateDMDialog(true)}>
                  Nova Conversa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                  Novo Grupo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 chatwoot-divider chatwoot-search">
            <SearchIcon />
            <input
              className="w-full text-sm bg-transparent focus:outline-none"
              placeholder="Buscar conversas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <RoomList
            rooms={filteredRooms}
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
            loading={roomsLoading}
          />
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col chatwoot-panel">
        {selectedRoom ? (
          <>
            <div className="h-16 px-6 border-b flex items-center justify-between bg-background chatwoot-divider chatwoot-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center chatwoot-avatar">
                  {selectedRoom.type === 'dm' ? (
                    <span className="text-lg font-semibold text-primary">
                      {selectedRoom.name?.[0] || '?'}
                    </span>
                  ) : (
                    <UsersIcon />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedRoom.name || 'Direct Message'}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoom.type === 'dm'
                      ? 'offline'
                      : `${selectedRoom.members?.length || 0} membros`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon-sm" variant="ghost" title="Info" className="chatwoot-ghost">
                  <InfoIcon />
                </Button>
              </div>
            </div>

            <MessageList
              messages={displayMessages}
              currentUserId={currentUserId}
              loading={messagesLoading}
            />

            <MessageInput
              onSend={handleSendMessage}
              disabled={sendingMessage}
              users={usersForMentions}
              quoteDraft={quoteDraft}
              onClearQuote={() => setQuoteDraft(null)}
              onQuoteChange={(draft) => setQuoteDraft(draft)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground chatwoot-empty">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageCircleIcon />
              </div>
              <h3 className="text-lg font-medium mb-1">Chat Interno</h3>
              <p className="text-sm max-w-xs">
                Selecione uma conversa ou crie uma nova sala para começar
              </p>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-background border shadow-lg rounded-xl px-4 py-3 text-sm max-w-sm chatwoot-surface">
            <p className="font-medium mb-1">Nova mensagem</p>
            <p className="text-muted-foreground truncate">{toast}</p>
          </div>
        </div>
      )}

      <CreateRoomDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleRoomCreated}
      />

      <CreateDMDialog
        isOpen={showCreateDMDialog}
        onClose={() => setShowCreateDMDialog(false)}
        onCreated={handleRoomCreated}
      />
    </div>
  );
}

export default ChatPage;





