/**
 * ChatPageV2 - Integrated Chat UI with Chatwoot-inspired components
 * 
 * Uses the new components:
 * - ConversationCard (individual conversation items)
 * - MessageBubble (styled message bubbles)
 * - DaySeparator (date dividers)
 * - TypingIndicator (animated typing status)
 * - UnreadBadge (floating unread count)
 * - MessageInput (enhanced with attachments, mentions)
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
  useAccountUsers,
} from './hooks';
import type { ChatRoom, ChatMessage, SendMessageRequest, AccountUser } from './types';
import {
  MessageBubble,
  DaySeparator,
  UnreadBadge,
  TypingIndicator,
  ConversationCard,
  MessageInput,
} from './components';
import { groupMessagesByDay } from './utils';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CONVERSATIONS: ChatRoom[] = [
  {
    id: 'mock-dm-1',
    account_id: 1,
    type: 'dm',
    name: 'Maria Silva',
    created_by: 1,
    last_message: 'Olá! Preciso de ajuda com um cliente',
    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
    unread_count: 2,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-dm-2',
    account_id: 1,
    type: 'dm',
    name: 'João Carlos',
    created_by: 1,
    last_message: 'Ok, vou verificar e te retorno',
    last_message_at: new Date(Date.now() - 30 * 60000).toISOString(),
    unread_count: 0,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-dm-3',
    account_id: 1,
    type: 'dm',
    name: 'Ana Paula',
    created_by: 1,
    last_message: 'Reunião confirmada para às 15h',
    last_message_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    unread_count: 0,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_GROUPS: ChatRoom[] = [
  {
    id: 'mock-group-1',
    account_id: 1,
    type: 'room',
    name: 'Suporte Técnico',
    created_by: 1,
    last_message: 'Cliente #1234 resolvido ✓',
    last_message_at: new Date(Date.now() - 10 * 60000).toISOString(),
    unread_count: 5,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-group-2',
    account_id: 1,
    type: 'room',
    name: 'Equipe Vendas',
    created_by: 1,
    last_message: 'Meta do mês batida! 🎉',
    last_message_at: new Date(Date.now() - 45 * 60000).toISOString(),
    unread_count: 0,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-group-3',
    account_id: 1,
    type: 'room',
    name: 'Geral',
    created_by: 1,
    last_message: 'Bom dia equipe!',
    last_message_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    unread_count: 12,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'mock-msg-1',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 2,
    sender: { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com' },
    content: 'Bom dia! Alguém pode ajudar com o cliente #1234?',
    message_type: 'text',
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'mock-msg-2',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 3,
    sender: { id: 3, name: 'João Carlos', email: 'joao@whatpro.com' },
    content: 'Oi @Maria! Vou verificar agora',
    message_type: 'mention',
    created_at: new Date(Date.now() - 55 * 60000).toISOString(),
  },
  {
    id: 'mock-msg-3',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Você', email: 'demo@whatpro.com' },
    content: 'Posso ajudar também. Qual é o problema?',
    message_type: 'text',
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
  },
  {
    id: 'mock-msg-4',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 2,
    sender: { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com' },
    content: 'O cliente está com problema na integração do WhatsApp. A API não responde.',
    message_type: 'text',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'mock-msg-5',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 3,
    sender: { id: 3, name: 'João Carlos', email: 'joao@whatpro.com' },
    content: 'Verifiquei aqui. Era um problema no token de autenticação. Já corrigi!',
    message_type: 'text',
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 'mock-msg-6',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 2,
    sender: { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com' },
    content: 'Cliente #1234 resolvido ✓',
    message_type: 'text',
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'mock-msg-7',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 0,
    content: 'Conversa foi reaberta por Daniel Tavares',
    message_type: 'system',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: 'mock-msg-8',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 0,
    content: 'Cliente insatisfeito na última interação',
    message_type: 'private',
    created_at: new Date(Date.now() - 6 * 60000).toISOString(),
  },
];

const MOCK_USERS: AccountUser[] = [
  { id: 1, name: 'Você', email: 'demo@whatpro.com' },
  { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com' },
  { id: 3, name: 'João Carlos', email: 'joao@whatpro.com' },
  { id: 4, name: 'Ana Paula', email: 'ana@whatpro.com' },
];

const mockParam =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock');
const USE_MOCK_DATA = mockParam === '1';
const CURRENT_USER_ID = 1;

// ============================================================================
// ICONS
// ============================================================================

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MessageCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChatPageV2() {
  const themeParam =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('theme');
  const embedParam =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed');
  const uiVariant: 'b' | 'c' = 'b';
  const isEmbed = embedParam === '1';

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [search, setSearch] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [composerMode, setComposerMode] = useState<'reply' | 'private'>('reply');
  const [editMessage, setEditMessage] = useState<ChatMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Hooks - Use correct API
  const { rooms: apiRooms, loading: roomsLoading } = useChatRooms();
  const { messages: apiMessages, loading: messagesLoading } = useChatMessages(selectedRoom?.id ?? null);
  const { sendMessage, loading: sendingMessage } = useSendMessage(selectedRoom?.id ?? null);
  const { markAsRead } = useMarkAsRead(selectedRoom?.id ?? null);
  const { users: apiUsers } = useAccountUsers();

  // Mock or real data
  const allRooms = useMemo(
    () => (USE_MOCK_DATA ? [...MOCK_CONVERSATIONS, ...MOCK_GROUPS] : apiRooms || []),
    [apiRooms]
  );

  const displayMessages = useMemo(
    () =>
      USE_MOCK_DATA
        ? selectedRoom
          ? MOCK_MESSAGES.filter((m: ChatMessage) => m.room_id === selectedRoom.id)
          : []
        : apiMessages || [],
    [selectedRoom, apiMessages]
  );

  const filteredMessages = useMemo(() => {
    return displayMessages.filter((msg) => {
      if (msg.message_type === 'private') {
        return msg.sender_id === CURRENT_USER_ID;
      }
      return true;
    });
  }, [displayMessages]);

  const accountUsers = USE_MOCK_DATA ? MOCK_USERS : apiUsers;

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


  // Filter conversations
  const filteredRooms = useMemo(() => {
    if (!search.trim()) return allRooms;
    const needle = search.toLowerCase();
    return allRooms.filter((room: ChatRoom) => room.name?.toLowerCase().includes(needle));
  }, [allRooms, search]);

  // Group messages by day
  const groupedMessages = useMemo(() => {
    return groupMessagesByDay(filteredMessages);
  }, [filteredMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  // Mark room as read when selected
  useEffect(() => {
    if (selectedRoom && !USE_MOCK_DATA) {
      markAsRead();
    }
  }, [selectedRoom, markAsRead]);

  // Simulate typing indicator
  useEffect(() => {
    if (!selectedRoom) return;
    
    // Simulate someone typing occasionally
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setTypingUsers(['Maria']);
        setTimeout(() => setTypingUsers([]), 3000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedRoom]);

  const handleSendMessage = (content: string) => {
    if (!selectedRoom || !content.trim()) return;

    if (USE_MOCK_DATA) {
      if (editMessage) {
        const idx = MOCK_MESSAGES.findIndex(m => m.id === editMessage.id);
        if (idx >= 0) {
          MOCK_MESSAGES[idx] = {
            ...MOCK_MESSAGES[idx],
            content,
            edited_at: new Date().toISOString(),
          };
        }
        setEditMessage(null);
      } else {
        const finalContent = replyTo ? `↩︎ ${replyTo.content}\n${content}` : content;
        // Add mock message
        const newMessage: ChatMessage = {
          id: `mock-msg-${Date.now()}`,
          room_id: selectedRoom.id,
          account_id: 1,
          sender_id: CURRENT_USER_ID,
          sender: { id: CURRENT_USER_ID, name: 'Você', email: 'demo@whatpro.com' },
          content: finalContent,
          message_type: finalContent.includes('@') ? 'mention' : (composerMode === 'private' ? 'private' : 'text'),
          created_at: new Date().toISOString(),
        };
        MOCK_MESSAGES.push(newMessage);
      }
      setReplyTo(null);
      // Force re-render
      setSelectedRoom({ ...selectedRoom });
    } else {
      const request: SendMessageRequest = { content: replyTo ? `↩︎ ${replyTo.content}\n${content}` : content };
      sendMessage(request);
      setReplyTo(null);
    }
  };

  const handleSelectConversation = (room: ChatRoom) => {
    setSelectedRoom(room);
    setUnreadCount(0);
    setReplyTo(null);
    setEditMessage(null);
    setComposerMode('reply');
  };

  const handleScrollToUnread = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  };

  const shouldShowSender = (msg: ChatMessage, index: number, messages: ChatMessage[]) => {
    if (selectedRoom?.type === 'dm') return false;
    if (msg.sender_id === CURRENT_USER_ID) return false;
    if (index === 0) return true;
    const prevMsg = messages[index - 1];
    return prevMsg.sender_id !== msg.sender_id;
  };

  return (
    <div
      className="flex h-screen bg-background chatwoot-chat-shell"
      data-variant={uiVariant}
    >
      {/* Sidebar */}
      <div className="w-[320px] border-r bg-sidebar flex flex-col chatwoot-divider chatwoot-sidebar">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between chatwoot-divider chatwoot-sidebar-header">
          <div>
            <h1 className="font-semibold text-lg">Chat Interno</h1>
            <p className="text-xs text-muted-foreground">Visual nativo Chatwoot</p>
          </div>
          <div className="chatwoot-toolbar">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-muted hover:bg-muted/80">
                  <PlusIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Nova Conversa</DropdownMenuItem>
                <DropdownMenuItem>Novo Grupo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 chatwoot-divider chatwoot-search">
            <SearchIcon />
            <input
              className="w-full text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
              placeholder="Buscar conversas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {roomsLoading && !USE_MOCK_DATA ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <MessageCircleIcon />
                <p className="mt-2 text-sm">Nenhuma conversa</p>
              </div>
            ) : (
              <>
                <div className="px-2 pt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Conversas
                </div>
                {filteredRooms.filter((room: ChatRoom) => room.type === 'dm').map((room: ChatRoom) => (
                  <ConversationCard
                    key={room.id}
                    conversation={room}
                    isActive={selectedRoom?.id === room.id}
                    onSelect={handleSelectConversation}
                  />
                ))}
                <div className="px-2 pt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Grupos
                </div>
                {filteredRooms.filter((room: ChatRoom) => room.type !== 'dm').map((room: ChatRoom) => (
                  <ConversationCard
                    key={room.id}
                    conversation={room}
                    isActive={selectedRoom?.id === room.id}
                    onSelect={handleSelectConversation}
                  />
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col chatwoot-panel">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b flex items-center justify-between bg-background chatwoot-divider chatwoot-header">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold chatwoot-avatar",
                  selectedRoom.type === 'dm' 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-foreground"
                )}>
                  {selectedRoom.type === 'dm' ? (
                    selectedRoom.name?.charAt(0).toUpperCase()
                  ) : (
                    <UsersIcon />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedRoom.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoom.type === 'dm' ? 'online' : `${selectedRoom.members?.length || 0} membros`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full px-3 h-8 text-xs border-border/70 bg-background hover:bg-muted">
                  Resolver
                </Button>
                <Button variant="ghost" size="icon-sm" className="bg-muted/60 hover:bg-muted">
                  ⋯
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden">
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <UnreadBadge count={unreadCount} onClick={handleScrollToUnread} />
              )}

              <ScrollArea className="h-full px-6 py-4 chatwoot-messages" ref={scrollAreaRef}>
                {messagesLoading && !USE_MOCK_DATA ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Carregando mensagens...</div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageCircleIcon />
                    <p className="mt-2">Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie a primeira mensagem!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                  {groupedMessages.map(({ date, messages }: { date: string; messages: ChatMessage[] }) => (
                      <div key={date}>
                        <DaySeparator date={date} />
                        <div className="space-y-2 mt-3">
                          {messages.map((msg: ChatMessage, index: number) => (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              isOwn={msg.sender_id === CURRENT_USER_ID}
                              showSender={shouldShowSender(msg, index, messages)}
                              onReply={() => {
                                setComposerMode('reply');
                                setReplyTo(msg);
                              }}
                              onEdit={() => setEditMessage(msg)}
                              onDelete={() => {
                                const idx = MOCK_MESSAGES.findIndex(m => m.id === msg.id);
                                if (idx >= 0) {
                                  MOCK_MESSAGES.splice(idx, 1);
                                  setSelectedRoom({ ...selectedRoom });
                                }
                              }}
                              readBy={
                                selectedRoom?.type === 'room' && msg.sender_id === CURRENT_USER_ID
                                  ? (selectedRoom.members || [])
                                      .map((m) => m.user?.name)
                                      .filter(Boolean)
                                      .slice(0, 3) as string[]
                                  : undefined
                              }
                              notSeenBy={
                                selectedRoom?.type === 'room' && msg.sender_id === CURRENT_USER_ID
                                  ? (selectedRoom.members || [])
                                      .map((m) => m.user?.name)
                                      .filter(Boolean)
                                      .slice(3, 6) as string[]
                                  : undefined
                              }
                              onMentionClick={(username) => {
                                // TODO: Open DM with user or show tooltip
                                alert(`Abrir conversa com @${username}`);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="px-6 pb-2">
                  <TypingIndicator userNames={typingUsers} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-background chatwoot-composer">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={sendingMessage}
                users={accountUsers}
                placeholder={
                  composerMode === 'private'
                    ? 'Nota privada para colaboradores...'
                    : editMessage
                      ? `Editando mensagem...`
                      : `Mensagem para ${selectedRoom.name}...`
                }
                mode={composerMode}
                onModeChange={setComposerMode}
                initialContent={editMessage?.content || ''}
                replyTo={
                  replyTo
                    ? {
                        id: replyTo.id,
                        author: replyTo.sender?.name || 'Mensagem',
                        preview: replyTo.content,
                      }
                    : null
                }
                onClearReply={() => setReplyTo(null)}
              />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center text-muted-foreground chatwoot-empty">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageCircleIcon />
              </div>
              <h3 className="text-lg font-medium mb-1">Chat Interno</h3>
              <p className="text-sm max-w-xs">
                Selecione uma conversa ou crie uma nova para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPageV2;




