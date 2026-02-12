import { TicketSession, TicketNode, TicketStatus, TransferMode } from '../types';

// Mock Data for the Session
const MOCK_SESSION: TicketSession = {
  conversationId: 1024,
  customerName: "João Silva",
  companyName: "Tech Solutions SA",
  ticketStack: [
    {
      id: 'ticket_root',
      departmentId: 'dept_fiscal',
      status: TicketStatus.PAUSED,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      ownerId: 1
    },
    {
      id: 'ticket_child',
      departmentId: 'dept_rh',
      status: TicketStatus.ACTIVE,
      startedAt: new Date().toISOString(),
      ownerId: 2
    }
  ]
};

class TicketService {
  private currentSession: TicketSession = { ...MOCK_SESSION };
  private listeners: ((session: TicketSession) => void)[] = [];

  // --- GETTERS ---
  
  getSession(): TicketSession {
    return this.currentSession;
  }

  getActiveTicket(): TicketNode | undefined {
    // The active ticket is always the one at the top of the stack (if any)
    const stack = this.currentSession.ticketStack;
    if (stack.length === 0) return undefined;
    return stack[stack.length - 1];
  }

  subscribe(listener: (session: TicketSession) => void) {
    this.listeners.push(listener);
    listener(this.currentSession);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.currentSession }));
  }

  // --- CORE LOGIC ---

  /**
   * TRANSFER TICKET
   * Handles "Passing the Baton" (Handoff) vs "Call Extension" (Interrupt)
   */
  async transferTicket(targetDeptId: string, mode: TransferMode) {
    console.log(`[TicketService] Transferring to ${targetDeptId} via ${mode}`);
    
    const stack = [...this.currentSession.ticketStack];
    const currentTicket = stack[stack.length - 1];

    if (!currentTicket) throw new Error("No active ticket to transfer");

    const newTicket: TicketNode = {
      id: `ticket_${Date.now()}`,
      departmentId: targetDeptId,
      status: TicketStatus.ACTIVE,
      startedAt: new Date().toISOString()
    };

    if (mode === TransferMode.HANDOFF) {
      // 1. Close current
      currentTicket.status = TicketStatus.COMPLETED;
      // 2. Remove current from stack (Linear flow replaces the head)
      stack.pop(); 
      // 3. Add new
      stack.push(newTicket);
    } 
    else if (mode === TransferMode.INTERRUPT) {
      // 1. Pause current
      currentTicket.status = TicketStatus.PAUSED;
      // 2. Push new on top (Stack grows)
      stack.push(newTicket);
    }

    this.currentSession = { ...this.currentSession, ticketStack: stack };
    this.notify();
    await this.syncToChatwoot(this.currentSession);
  }

  /**
   * COMPLETE TICKET
   * Handles resolving the current node and deciding what happens next (Resume vs Close)
   */
  async completeTicket() {
    console.log(`[TicketService] Completing active ticket`);
    
    const stack = [...this.currentSession.ticketStack];
    if (stack.length === 0) return;

    // 1. Pop the completed ticket
    const completedTicket = stack.pop();
    
    // 2. Check logic for next step
    if (stack.length > 0) {
      // Logic: Resume the ticket below it
      const nextTicket = stack[stack.length - 1];
      if (nextTicket.status === TicketStatus.PAUSED) {
        nextTicket.status = TicketStatus.ACTIVE;
        console.log(`[TicketService] Resuming Ticket ${nextTicket.id} (${nextTicket.departmentId})`);
      }
    } else {
      console.log(`[TicketService] Stack empty. Conversation Resolved.`);
      // In a real app, this would call Chatwoot API to toggle status to 'resolved'
    }

    this.currentSession = { ...this.currentSession, ticketStack: stack };
    this.notify();
    await this.syncToChatwoot(this.currentSession);
  }

  // Mock API Call
  private async syncToChatwoot(session: TicketSession) {
    // Simulate latency
    await new Promise(r => setTimeout(r, 500));
    console.log("Synced Session to Chatwoot:", session);
  }
}

export const ticketService = new TicketService();
