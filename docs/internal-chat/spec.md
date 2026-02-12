# WHATPRO — Internal Team Chat (Production Spec)

**Versão:** 1.1.0  
**Frontend:** Vite + React + TS + Tailwind + shadcn  
**Backend:** Go (Fiber) + PostgreSQL + Redis + Object Storage  
**Escopo:** Chat interno multiempresa com contexto Chatwoot

---

## 0. Regras Adicionais Obrigatórias

### 0.1 Feature Flag

- Chat habilitado via `internal_chat_enabled` por tenant
- UI: mostra "não habilitado" se desabilitado
- Backend: rejeita com `403 FEATURE_DISABLED`

### 0.2 Isolamento Multiempresa

- Rooms/mensagens/anexos isolados por `account_id`
- WS não permite sub em room de outro tenant

### 0.3 Resolve/Reabrir

- Rooms: `status = open | resolved`
- Nova mensagem em room resolvida: reabre automaticamente
- Filtro: Abertas / Resolvidas

### 0.4 Retenção

- Política por tenant: 90/180/365 dias
- Job diário purge + audit log

---

## 1. Types (TypeScript Contracts)

```typescript
export type ID = string;
export type ISODate = string;

export type RoomType = "dm" | "group";
export type RoomStatus = "open" | "resolved";
export type MemberRole = "owner" | "moderator" | "member" | "viewer";
export type MessageType = "text" | "system" | "note" | "attachment" | "event";
export type Visibility = "all" | "role" | "users" | "self";
export type NotificationLevel = "all" | "mentions" | "none";

export interface AccountChatSettings {
  account_id: ID;
  internal_chat_enabled: boolean;
  retention_days: number;
  resolve_policy: "mods_only" | "all_members";
  notification_style: "native" | "chatwoot_like";
}

export interface Room {
  id: ID;
  account_id: ID;
  type: RoomType;
  name: string | null;
  status: RoomStatus;
  created_by: ID;
  created_at: ISODate;
  updated_at: ISODate;
  last_activity_at: ISODate;
  resolved_at: ISODate | null;
  resolved_by: ID | null;
  unread_count?: number;
  seq: number;
}

export interface Message {
  id: ID;
  account_id: ID;
  room_id: ID;
  client_msg_id: ID;
  author_id: ID;
  type: MessageType;
  visibility: Visibility;
  visibility_meta: VisibilityMeta | null;
  content: string;
  reply_to_message_id: ID | null;
  created_at: ISODate;
  edited_at: ISODate | null;
  edited_by: ID | null;
  deleted_at: ISODate | null;
  deleted_by: ID | null;
  quote?: QuotePayload | null;
  attachments?: Attachment[];
  reactions?: Reaction[];
}

export interface QuotePayload {
  source: "chatwoot";
  snapshot: {
    conversation_id: number;
    inbox_id?: number;
    contact_id?: number;
    subject?: string;
    preview?: string;
    tags?: string[];
    assignee_name?: string;
    link: string;
    captured_at: ISODate;
  };
}
```

---

## 2. WebSocket Protocol

### Client → Server

```typescript
type WSClientOp =
  | { op: "sub"; room_id: ID }
  | { op: "unsub"; room_id: ID }
  | { op: "typing"; room_id: ID; is_typing: boolean }
  | {
      op: "msg_send";
      room_id: ID;
      client_msg_id: ID;
      payload: CreateMessageRequest;
    }
  | { op: "room_read"; room_id: ID; last_read_message_id: ID };
```

### Server → Client

```typescript
type WSServerEvent =
  | {
      event: "message.ack";
      room_id: ID;
      client_msg_id: ID;
      message_id: ID;
      seq: number;
    }
  | { event: "message.created"; room_id: ID; seq: number; message: Message }
  | { event: "message.updated"; room_id: ID; seq: number; message: Message }
  | { event: "message.deleted"; room_id: ID; seq: number; message_id: ID }
  | { event: "room.read"; room_id: ID; user_id: ID; last_read_message_id: ID }
  | { event: "room.resolved"; room_id: ID; resolved_by: ID }
  | { event: "room.reopened"; room_id: ID; reopened_by: ID }
  | { event: "typing.on"; room_id: ID; user_id: ID }
  | { event: "typing.off"; room_id: ID; user_id: ID }
  | { event: "presence.update"; user_id: ID; status: "online" | "offline" };
```

---

## 3. REST API

Base: `/api/v1/accounts/:accountId/internal-chat`

| Endpoint                  | Method       | Descrição                    |
| ------------------------- | ------------ | ---------------------------- |
| `/settings`               | GET/PATCH    | Feature flags e configuração |
| `/rooms`                  | GET/POST     | Listar/criar rooms           |
| `/rooms/:id`              | GET/PATCH    | Room detail/update           |
| `/rooms/:id/status`       | PATCH        | Resolver/reabrir             |
| `/rooms/:id/messages`     | GET/POST     | Mensagens (cursor)           |
| `/rooms/:id/messages/:id` | PATCH/DELETE | Edit/delete                  |
| `/rooms/:id/read`         | POST         | Marcar como lido             |

---

## 4. Store Zustand (Core)

```typescript
interface InternalChatState {
  settings: AccountChatSettings | null;
  featureEnabled: boolean;

  roomsById: Record<ID, Room>;
  roomOrder: ID[];
  activeRoomId: ID | null;

  messagesByRoom: Record<ID, ID[]>;
  messagesById: Record<ID, Message>;
  roomSeq: Record<ID, number>;

  draftsByRoom: Record<ID, DraftState>;
  pending: Record<ID, PendingMessage>;

  typingByRoom: Record<ID, Record<ID, boolean>>;
  presenceByUser: Record<ID, "online" | "offline">;

  // Actions
  applyWSEvent: (evt: WSServerEvent) => { needsResync?: boolean };
}
```

---

## 5. Páginas

| Rota                  | Propósito                  |
| --------------------- | -------------------------- |
| `/internal-chat/mock` | Playground sem backend     |
| `/internal-chat`      | Produção com WS + contexto |

---

## 6. Quality Checklist

### P0 (Obrigatório)

- [ ] Feature flag funciona
- [ ] Isolamento multiempresa
- [ ] Idempotência (client_msg_id)
- [ ] Seq + resync
- [ ] Scroll estável
- [ ] Sanitização XSS

### P1 (Importante)

- [ ] Resolve/Reopen
- [ ] Virtualização
- [ ] Reactions
- [ ] Typing indicator
- [ ] Read receipts

### P2 (Desejável)

- [ ] Pins/Bookmarks
- [ ] Quote Chatwoot
- [ ] Retenção automática
- [ ] Busca full-text
