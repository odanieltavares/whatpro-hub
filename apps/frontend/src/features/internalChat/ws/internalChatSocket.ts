/**
 * Internal Chat WebSocket Client
 * 
 * Handles real-time connection, subscriptions, and event handling.
 * Uses reconnecting websocket with exponential backoff and jitter.
 */

import type { ID, WSClientOp, WSServerEvent, CreateMessageRequest } from '../contracts';
import { useInternalChatStore } from '../store';

// =============================================================================
// CONFIGURATION
// =============================================================================

const WS_BASE = import.meta.env.VITE_WS_BASE || '';
const HEARTBEAT_INTERVAL = 30_000; // 30s
const RECONNECT_MIN = 1_000; // 1s
const RECONNECT_MAX = 30_000; // 30s

// =============================================================================
// SOCKET CLASS
// =============================================================================

export class InternalChatSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private subscribedRooms = new Set<ID>();
  private isConnecting = false;

  // Callbacks
  private onConnected?: () => void;
  private onDisconnected?: () => void;
  private onError?: (error: Error) => void;
  private onNeedsResync?: (roomId: ID) => void;

  constructor(options?: {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
    onNeedsResync?: (roomId: ID) => void;
  }) {
    this.onConnected = options?.onConnected;
    this.onDisconnected = options?.onDisconnected;
    this.onError = options?.onError;
    this.onNeedsResync = options?.onNeedsResync;
  }

  // ---------------------------------------------------------------------------
  // CONNECTION
  // ---------------------------------------------------------------------------

  connect(token: string): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;

    this.token = token;
    this.isConnecting = true;

    try {
      const url = `${WS_BASE}/ws/internal-chat?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.resubscribeAll();
        this.onConnected?.();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = () => {
        this.onError?.(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.onDisconnected?.();
        this.scheduleReconnect();
      };
    } catch (error) {
      this.isConnecting = false;
      this.onError?.(error as Error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.subscribedRooms.clear();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.token) return;

    this.reconnectAttempts++;
    const delay = Math.min(
      RECONNECT_MIN * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000,
      RECONNECT_MAX
    );

    setTimeout(() => {
      if (this.token) this.connect(this.token);
    }, delay);
  }

  // ---------------------------------------------------------------------------
  // HEARTBEAT
  // ---------------------------------------------------------------------------

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ op: 'ping', t: Date.now() });
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIPTIONS
  // ---------------------------------------------------------------------------

  subscribe(roomId: ID): void {
    this.subscribedRooms.add(roomId);
    this.send({ op: 'sub', room_id: roomId });
  }

  unsubscribe(roomId: ID): void {
    this.subscribedRooms.delete(roomId);
    this.send({ op: 'unsub', room_id: roomId });
  }

  private resubscribeAll(): void {
    for (const roomId of this.subscribedRooms) {
      this.send({ op: 'sub', room_id: roomId });
    }
  }

  // ---------------------------------------------------------------------------
  // OPERATIONS
  // ---------------------------------------------------------------------------

  sendTyping(roomId: ID, isTyping: boolean): void {
    this.send({ op: 'typing', room_id: roomId, is_typing: isTyping });
  }

  sendMessage(roomId: ID, clientMsgId: ID, payload: CreateMessageRequest): void {
    this.send({
      op: 'msg_send',
      room_id: roomId,
      client_msg_id: clientMsgId,
      idempotency_key: clientMsgId,
      payload,
    });
  }

  markRead(roomId: ID, lastReadMessageId: ID): void {
    this.send({ op: 'room_read', room_id: roomId, last_read_message_id: lastReadMessageId });
  }

  // ---------------------------------------------------------------------------
  // SEND
  // ---------------------------------------------------------------------------

  private send(op: WSClientOp): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(op));
    }
  }

  // ---------------------------------------------------------------------------
  // MESSAGE HANDLER
  // ---------------------------------------------------------------------------

  private handleMessage(data: string): void {
    try {
      const evt: WSServerEvent = JSON.parse(data);
      
      // Apply to store
      const result = useInternalChatStore.getState().applyWSEvent(evt);
      
      // Trigger resync if needed
      if (result.needsResync && result.roomId) {
        this.onNeedsResync?.(result.roomId);
      }
    } catch (error) {
      console.error('[InternalChatSocket] Failed to parse message:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // STATUS
  // ---------------------------------------------------------------------------

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get reconnecting(): boolean {
    return this.reconnectAttempts > 0 && !this.isConnecting;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let socketInstance: InternalChatSocket | null = null;

export function getInternalChatSocket(): InternalChatSocket {
  if (!socketInstance) {
    socketInstance = new InternalChatSocket();
  }
  return socketInstance;
}

export function resetInternalChatSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
