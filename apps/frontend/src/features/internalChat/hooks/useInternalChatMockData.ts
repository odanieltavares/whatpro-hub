import { useCallback, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ChatRoom, AccountUser } from '../../chat/types';

const MOCK_CONVERSATIONS: ChatRoom[] = [
  {
    id: 'mock-dm-1',
    account_id: 1,
    type: 'dm',
    name: 'Maria Silva',
    created_by: 1,
    last_message: 'Ola! Preciso de ajuda com um cliente',
    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
    unread_count: 3,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: 'https://i.pravatar.cc/150?u=maria',
  },
  {
    id: 'mock-dm-2',
    account_id: 1,
    type: 'dm',
    name: 'Joao Carlos',
    created_by: 1,
    last_message: 'Conseguiu resolver?',
    last_message_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    unread_count: 0,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: 'https://i.pravatar.cc/150?u=joao',
  },
  {
    id: 'mock-dm-3',
    account_id: 1,
    type: 'dm',
    name: 'Fernanda Lima',
    created_by: 1,
    last_message: 'Pode revisar o contrato?',
    last_message_at: new Date(Date.now() - 30 * 60000).toISOString(),
    unread_count: 1,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: 'https://i.pravatar.cc/150?u=fernanda',
  },
];

const MOCK_GROUPS: ChatRoom[] = [
  {
    id: 'mock-group-1',
    account_id: 1,
    type: 'room',
    name: 'Suporte Tecnico',
    created_by: 1,
    last_message: 'Cliente #1234 resolvido',
    last_message_at: new Date(Date.now() - 15 * 60000).toISOString(),
    unread_count: 5,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: 'https://ui-avatars.com/api/?name=Suporte+Tecnico&background=random',
  },
  {
    id: 'mock-group-2',
    account_id: 1,
    type: 'room',
    name: 'Vendas Brasil',
    created_by: 1,
    last_message: 'Bom dia equipe!',
    last_message_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    unread_count: 12,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: 'https://ui-avatars.com/api/?name=Vendas+Brasil&background=random',
  },
  {
    id: 'mock-group-3',
    account_id: 1,
    type: 'room',
    name: 'Produto & Roadmap',
    created_by: 1,
    last_message: 'Prioridade: automacoes Q2',
    last_message_at: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
    unread_count: 0,
    members: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: 'https://ui-avatars.com/api/?name=Produto+Roadmap&background=random',
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 2,
    sender: { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=maria' },
    content: 'Bom dia equipe! Temos um cliente com problema na integracao.',
    message_type: 'text',
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-2',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 3,
    sender: { id: 3, name: 'Joao Carlos', email: 'joao@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=joao' },
    content: 'Qual o ID do cliente? Vou verificar aqui.',
    message_type: 'text',
    created_at: new Date(Date.now() - 55 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-3',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 2,
    sender: { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=maria' },
    content: 'E o cliente #1234. @joao consegue verificar?',
    message_type: 'text',
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-4',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Voce', email: 'demo@whatpro.com' },
    content: 'Verificando no sistema agora...',
    message_type: 'text',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-5',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Voce', email: 'demo@whatpro.com' },
    content: 'Era um problema no token de autenticacao. Ja corrigi!',
    message_type: 'text',
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-6',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 2,
    sender: { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=maria' },
    content: 'Perfeito! Obrigada pela ajuda rapida.',
    message_type: 'text',
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-7',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 4,
    sender: { id: 4, name: 'Ana Costa', email: 'ana@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=ana' },
    content: 'Checklist:\n- Validar logs\n- Avisar @todos\n- Encerrar ticket',
    message_type: 'text',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-8',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Voce', email: 'demo@whatpro.com' },
    content: '**Atualizacao**: integracao normalizada. Link: [status](https://status.whatpro.com)',
    message_type: 'text',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'read',
    reply_to_message_id: 'msg-7',
  },
  {
    id: 'msg-9',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Voce', email: 'demo@whatpro.com' },
    content: 'Nota sobre o cliente: contrato vence em 30 dias.',
    message_type: 'private',
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-9b',
    room_id: 'mock-group-1',
    account_id: 1,
    sender_id: 4,
    sender: { id: 4, name: 'Ana Costa', email: 'ana@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=ana' },
    content: 'Fixei a conversa e deixei anotado no painel.',
    message_type: 'text',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-10',
    room_id: 'mock-dm-1',
    account_id: 1,
    sender_id: 2,
    sender: { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=maria' },
    content: 'Consegue revisar o SLA? Preciso fechar hoje.',
    message_type: 'text',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-11',
    room_id: 'mock-dm-1',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Voce', email: 'demo@whatpro.com' },
    content: 'Sim, estou revisando agora. Te retorno em 10 minutos.',
    message_type: 'text',
    created_at: new Date(Date.now() - 16 * 60000).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-12',
    room_id: 'mock-dm-2',
    account_id: 1,
    sender_id: 3,
    sender: { id: 3, name: 'Joao Carlos', email: 'joao@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=joao' },
    content: 'Checklist:\n1. Revisar deploy\n2. Validar logs\n3. Avisar @todos',
    message_type: 'text',
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-13',
    room_id: 'mock-group-2',
    account_id: 1,
    sender_id: 5,
    sender: { id: 5, name: 'Lucas Prado', email: 'lucas@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=lucas' },
    content: 'Equipe, precisamos ajustar o pitch para o setor financeiro.',
    message_type: 'text',
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-14',
    room_id: 'mock-group-2',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Voce', email: 'demo@whatpro.com' },
    content: 'Vou preparar uma proposta ate o fim do dia.',
    message_type: 'text',
    created_at: new Date(Date.now() - 100 * 60000).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-15',
    room_id: 'mock-group-3',
    account_id: 1,
    sender_id: 6,
    sender: { id: 6, name: 'Paula Reis', email: 'paula@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=paula' },
    content: 'Roadmap Q2: melhorar notificacoes e analytics.',
    message_type: 'text',
    created_at: new Date(Date.now() - 8 * 60 * 60000).toISOString(),
    status: 'read',
  },
  {
    id: 'msg-16',
    room_id: 'mock-group-3',
    account_id: 1,
    sender_id: 1,
    sender: { id: 1, name: 'Voce', email: 'demo@whatpro.com' },
    content: 'Link do documento: [Roadmap](https://whatpro.com/roadmap)',
    message_type: 'text',
    created_at: new Date(Date.now() - 7 * 60 * 60000).toISOString(),
    status: 'sent',
  },
];

const MOCK_USERS: AccountUser[] = [
  { id: 1, name: 'Voce', email: 'demo@whatpro.com', whatpro_role: 'supervisor' },
  { id: 2, name: 'Maria Silva', email: 'maria@whatpro.com', whatpro_role: 'agent', avatar_url: 'https://i.pravatar.cc/150?u=maria' },
  { id: 3, name: 'Joao Carlos', email: 'joao@whatpro.com', whatpro_role: 'agent', avatar_url: 'https://i.pravatar.cc/150?u=joao' },
  { id: 4, name: 'Ana Costa', email: 'ana@whatpro.com', whatpro_role: 'admin', avatar_url: 'https://i.pravatar.cc/150?u=ana' },
  { id: 5, name: 'Lucas Prado', email: 'lucas@whatpro.com', whatpro_role: 'agent', avatar_url: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 6, name: 'Paula Reis', email: 'paula@whatpro.com', whatpro_role: 'agent', avatar_url: 'https://i.pravatar.cc/150?u=paula' },
  { id: 7, name: 'Rafael Dias', email: 'rafael@whatpro.com', whatpro_role: 'supervisor', avatar_url: 'https://i.pravatar.cc/150?u=rafael' },
];

const MOCK_GROUP_MEMBERS: Record<string, Array<{ id: string; name: string; email: string; avatar_url?: string; role: string }>> = {
  'mock-group-1': [
    { id: '1', name: 'Voce', email: 'demo@whatpro.com', role: 'supervisor' },
    { id: '2', name: 'Maria Silva', email: 'maria@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=maria', role: 'agent' },
    { id: '3', name: 'Joao Carlos', email: 'joao@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=joao', role: 'agent' },
    { id: '4', name: 'Ana Costa', email: 'ana@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=ana', role: 'admin' },
  ],
  'mock-group-2': [
    { id: '1', name: 'Voce', email: 'demo@whatpro.com', role: 'supervisor' },
    { id: '5', name: 'Lucas Prado', email: 'lucas@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=lucas', role: 'agent' },
    { id: '7', name: 'Rafael Dias', email: 'rafael@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=rafael', role: 'supervisor' },
  ],
  'mock-group-3': [
    { id: '1', name: 'Voce', email: 'demo@whatpro.com', role: 'supervisor' },
    { id: '6', name: 'Paula Reis', email: 'paula@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=paula', role: 'agent' },
    { id: '7', name: 'Rafael Dias', email: 'rafael@whatpro.com', avatar_url: 'https://i.pravatar.cc/150?u=rafael', role: 'supervisor' },
  ],
};

const CURRENT_USER_ID = '1';

const groupAvatar = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Grupo')}&background=1e3a8a&color=ffffff&bold=true`;
const dmAvatar = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Contato')}&background=e2e8f0&color=0f172a&bold=true`;
const getRoomAvatar = (room: ChatRoom | null) => {
  if (!room) return undefined;
  return room.type === 'room'
    ? groupAvatar(room.name || undefined)
    : (room as { avatar_url?: string }).avatar_url || dmAvatar(room.name || undefined);
};

export function useInternalChatMockData() {
  const [rooms, setRooms] = useState<ChatRoom[]>([...MOCK_GROUPS, ...MOCK_CONVERSATIONS]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(MOCK_GROUPS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [membersByRoom, setMembersByRoom] = useState(MOCK_GROUP_MEMBERS);
  const [pinnedByRoom, setPinnedByRoom] = useState<Record<string, Set<string>>>({});
  const [pinnedRooms, setPinnedRooms] = useState<Record<string, boolean>>({});
  const pendingRef = useRef<Record<string, { status: 'pending' | 'sent'; created_at: number }>>({});

  const roomMessages = useMemo(() => {
    if (!selectedRoom) return [];
    return messages.filter((m) => m.room_id === selectedRoom.id);
  }, [messages, selectedRoom]);

  const handleSendMessage = useCallback(
    (content: string, mode: 'reply' | 'private', replyTo: ChatMessage | null) => {
      if (!selectedRoom || !content.trim()) return;

      const mockUser = MOCK_USERS.find((u) => String(u.id) === CURRENT_USER_ID);
      const newMsg: ChatMessage & { reply_to_message_id?: string } = {
        id: `msg-${Date.now()}`,
        room_id: selectedRoom.id,
        account_id: 1,
        sender_id: Number(CURRENT_USER_ID),
        sender: mockUser
          ? {
              id: mockUser.id,
              name: mockUser.name || 'Usuario',
              email: mockUser.email || '',
            }
          : undefined,
        content: content.trim(),
        message_type: mode === 'private' ? 'private' : 'text',
        created_at: new Date().toISOString(),
        status: 'sent',
        reply_to_message_id: replyTo?.id,
      };

      setMessages((prev) => [...prev, newMsg]);
      setRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoom.id
            ? {
                ...room,
                last_message: newMsg.content,
                last_message_at: newMsg.created_at,
                unread_count: 0,
              }
            : room
        )
      );

      pendingRef.current[selectedRoom.id] = { status: 'sent', created_at: Date.now() };
    },
    [selectedRoom]
  );

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    if (!selectedRoom || !content.trim()) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: content.trim(),
              edited_at: new Date().toISOString(),
            }
          : msg
      )
    );
  }, [selectedRoom]);

  const pinnedMessageIds = useMemo(() => {
    if (!selectedRoom) return new Set<string>();
    return pinnedByRoom[selectedRoom.id] ?? new Set<string>();
  }, [pinnedByRoom, selectedRoom]);

  const pinnedMessages = useMemo(() => {
    if (!selectedRoom) return [];
    const ids = pinnedMessageIds;
    return messages.filter((msg) => ids.has(msg.id));
  }, [messages, pinnedMessageIds, selectedRoom]);

  const handleTogglePinMessage = useCallback(
    (message: ChatMessage) => {
      if (!selectedRoom) return;
      setPinnedByRoom((prev) => {
        const current = prev[selectedRoom.id] ?? new Set<string>();
        const next = new Set(current);
        if (next.has(message.id)) next.delete(message.id);
        else next.add(message.id);
        return { ...prev, [selectedRoom.id]: next };
      });
    },
    [selectedRoom]
  );

  const isRoomPinned = useCallback(
    (room: ChatRoom) => !!pinnedRooms[room.id],
    [pinnedRooms]
  );

  const handleTogglePinRoom = useCallback((room: ChatRoom) => {
    setPinnedRooms((prev) => ({ ...prev, [room.id]: !prev[room.id] }));
  }, []);

  const getLastMessageStatus = useCallback(
    (roomId: string) => {
      const pending = pendingRef.current[roomId];
      if (pending?.status === 'pending') return 'pending';

      const lastMsg = [...messages].reverse().find((m) => m.room_id === roomId);
      if (!lastMsg || String(lastMsg.sender_id) !== CURRENT_USER_ID) return null;
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return null;
      return room.unread_count === 0 ? 'read' : 'sent';
    },
    [messages, rooms]
  );

  const handleUpdateRoomInfo = useCallback((roomId: string, name: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              name,
              updated_at: new Date().toISOString(),
              avatar_url: room.type === 'room' ? groupAvatar(name) : room.avatar_url,
            }
          : room
      )
    );
  }, []);

  const handleAddMember = useCallback((roomId: string, userId: string) => {
    const user = MOCK_USERS.find((u) => String(u.id) === String(userId));
    if (!user) return;
    setMembersByRoom((prev) => {
      const current = prev[roomId] ?? [];
      if (current.some((m) => String(m.id) === String(userId))) return prev;
      const next = [
        ...current,
        {
          id: String(user.id),
          name: user.name || 'Usuario',
          email: user.email || '',
          avatar_url: user.avatar_url,
          role: user.whatpro_role || 'agent',
        },
      ];
      return { ...prev, [roomId]: next };
    });
  }, []);

  const handleRemoveMember = useCallback((roomId: string, userId: string) => {
    setMembersByRoom((prev) => {
      const current = prev[roomId] ?? [];
      const next = current.filter((member) => String(member.id) !== String(userId));
      return { ...prev, [roomId]: next };
    });
  }, []);

  return {
    rooms,
    activeRoom: selectedRoom,
    activeRoomId: selectedRoom?.id || null,
    onSelectRoom: (room: ChatRoom) => setSelectedRoom(room),
    filter: undefined,
    onFilterChange: undefined,
    messages: roomMessages,
    isLoadingMessages: false,
    loadMore: () => undefined,
    hasMore: false,
    isSending: false,
    onSendMessage: handleSendMessage,
    onEditMessage: handleEditMessage,
    typingUsers: [],
    draftText: '',
    resetDraft: undefined,
    users: MOCK_USERS,
    members: selectedRoom?.type === 'room' ? (membersByRoom[selectedRoom.id] ?? []) : [],
    getLastMessageStatus,
    getRoomAvatar,
    currentUserId: CURRENT_USER_ID,
    currentUserRole: MOCK_USERS.find((u) => String(u.id) === CURRENT_USER_ID)?.whatpro_role || 'agent',
    onTogglePinRoom: handleTogglePinRoom,
    isRoomPinned,
    availableUsers: MOCK_USERS,
    onUpdateRoomInfo: handleUpdateRoomInfo,
    onAddMember: handleAddMember,
    onRemoveMember: handleRemoveMember,
    pinnedMessageIds,
    pinnedMessages,
    onTogglePinMessage: handleTogglePinMessage,
  };
}
