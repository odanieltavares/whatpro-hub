import { MOCK_CARDS, MOCK_COLUMNS, MOCK_COMPANIES, MOCK_CHAT_HISTORY, MOCK_AUDIT_LOGS, MOCK_DEPTS } from '../constants';
import { KanbanCard, WorkflowColumn, ClientCompany, ChatMessage, AuditLogEntry, Department, ScheduleEntry } from '../types';

class MockBackendService {
  private cards: KanbanCard[] = [...MOCK_CARDS];
  private columns: WorkflowColumn[] = [...MOCK_COLUMNS];
  private depts: Department[] = [...MOCK_DEPTS];
  private queue: string[] = [];

  getCards(): Promise<KanbanCard[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.cards), 500);
    });
  }

  getColumns(): WorkflowColumn[] {
    return [...this.columns]; // Return copy to trigger React state updates
  }
  
  getCompanies(): ClientCompany[] {
    return MOCK_COMPANIES;
  }

  getDepartments(): Department[] {
    return [...this.depts]; // Return copy
  }

  addDepartment(dept: Department) {
      this.depts = [...this.depts, dept];
  }

  addColumn(col: WorkflowColumn) {
      this.columns = [...this.columns, col];
  }

  updateColumn(colId: string, updates: Partial<WorkflowColumn>) {
      this.columns = this.columns.map(c => c.id === colId ? { ...c, ...updates } : c);
  }

  reorderColumns(departmentId: string, newOrderIds: string[]) {
      // Get columns that are NOT in this department
      const otherColumns = this.columns.filter(c => c.departmentId !== departmentId);
      
      // Get columns in this department
      const deptColumns = this.columns.filter(c => c.departmentId === departmentId);
      
      // Reassign orderIndex based on the array order passed
      const updatedDeptColumns = deptColumns.map(col => {
          const newIndex = newOrderIds.indexOf(col.id);
          return { ...col, orderIndex: newIndex };
      });

      this.columns = [...otherColumns, ...updatedDeptColumns];
  }

  deleteColumn(colId: string) {
      this.columns = this.columns.filter(c => c.id !== colId);
  }

  // New method for Modal Details
  async getCardDetails(cardId: string): Promise<{ 
    card: KanbanCard, 
    chatHistory: ChatMessage[],
    auditLogs: AuditLogEntry[] 
  }> {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) throw new Error("Card Not Found");
    
    // Simulate Fetch Delay
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      card,
      chatHistory: MOCK_CHAT_HISTORY[cardId] || [],
      auditLogs: MOCK_AUDIT_LOGS[cardId] || []
    };
  }

  async setCardContext(cardId: string, companyId: string): Promise<void> {
    const cardIndex = this.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found');
    
    const company = MOCK_COMPANIES.find(c => c.id === companyId);
    if (!company) throw new Error('Company not found');

    // Update state
    this.cards[cardIndex] = {
        ...this.cards[cardIndex],
        selectedCompanyId: companyId,
        selectedCompany: company
    };

    // Log Audit
    this.addToQueue(`Audit: Context switched to ${company.name} for Protocol ${this.cards[cardIndex].protocolNumber}`);
    this.logAudit(cardId, 'CONTEXT_SWITCH', `Contexto alterado para ${company.name}`, 'System');
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async moveCard(cardId: string, targetColumnId: string): Promise<void> {
    const cardIndex = this.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found');

    const card = this.cards[cardIndex];
    const targetColumn = this.columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) throw new Error('Column not found');

    // RULE 1: Context Required check
    if (!card.selectedCompanyId && targetColumn.stage !== 'triage') {
        throw new Error("⛔ BLOQUEIO: Você deve selecionar uma Empresa (Contexto) antes de mover o card.");
    }

    // 1. Optimistic Update
    this.cards[cardIndex] = {
      ...card,
      columnId: targetColumnId,
      updatedAt: new Date().toISOString(),
      tags: [...card.tags.filter(t => !this.columns.map(c => c.chatwootTag).includes(t)), targetColumn.chatwootTag]
    };

    // 2. Audit & Sync
    this.addToQueue(`Audit: Moved to ${targetColumn.title}. Protocol ${card.protocolNumber}`);
    this.addToQueue(`Sync: Chatwoot Tag "${targetColumn.chatwootTag}"`);
    this.logAudit(cardId, 'MOVE', `Movido para ${targetColumn.title}`, 'System');

    await new Promise(resolve => setTimeout(resolve, 600));
  }

  async assignCard(cardId: string, userId: number, userName: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      this.cards[cardIndex] = {
          ...this.cards[cardIndex],
          assignee: { id: userId, name: userName, email: 'agent@test.com', avatar_url: '' }
      };

      this.addToQueue(`Audit: Assigned to ${userName}`);
      await new Promise(resolve => setTimeout(resolve, 200));
  }

  async updateChecklist(cardId: string, completedIds: string[]) {
     const cardIndex = this.cards.findIndex(c => c.id === cardId);
     if (cardIndex === -1) return;
     this.cards[cardIndex] = { ...this.cards[cardIndex], completedChecklistIds: completedIds };
     await new Promise(resolve => setTimeout(resolve, 200));
  }

  // --- SCHEDULING METHODS ---

  async addSchedule(cardId: string, schedule: ScheduleEntry) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;
      
      const currentSchedules = this.cards[cardIndex].schedules || [];
      this.cards[cardIndex] = { ...this.cards[cardIndex], schedules: [schedule, ...currentSchedules] };

      this.logAudit(cardId, 'SCHEDULE_CREATED', `Novo agendamento: "${schedule.title}"`, schedule.createdBy);
      await new Promise(resolve => setTimeout(resolve, 300));
  }

  async updateSchedule(cardId: string, scheduleId: string, updates: Partial<ScheduleEntry>, actor: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const schedules = this.cards[cardIndex].schedules || [];
      const updatedSchedules = schedules.map(s => s.id === scheduleId ? { ...s, ...updates } : s);
      
      this.cards[cardIndex] = { ...this.cards[cardIndex], schedules: updatedSchedules };

      this.logAudit(cardId, 'SCHEDULE_UPDATED', `Agendamento editado: "${updates.title || 'Item'}"`, actor);
      await new Promise(resolve => setTimeout(resolve, 300));
  }

  async deleteSchedule(cardId: string, scheduleId: string, actor: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const schedules = this.cards[cardIndex].schedules || [];
      const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
      
      this.cards[cardIndex] = { ...this.cards[cardIndex], schedules: updatedSchedules };

      this.logAudit(cardId, 'SCHEDULE_DELETED', `Agendamento removido`, actor);
      await new Promise(resolve => setTimeout(resolve, 300));
  }

  async triggerScheduleNow(cardId: string, scheduleId: string, actor: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const schedules = this.cards[cardIndex].schedules || [];
      const updatedSchedules = schedules.map(s => 
          s.id === scheduleId 
          ? { ...s, status: 'sent' as const, resolvedBy: actor, resolvedAt: new Date().toISOString() } 
          : s
      );

      this.cards[cardIndex] = { ...this.cards[cardIndex], schedules: updatedSchedules };

      this.logAudit(cardId, 'NOTIFICATION_SENT', `Notificação disparada manualmente`, actor);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
  }

  async resolveSchedule(cardId: string, scheduleId: string, actorName: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const schedules = this.cards[cardIndex].schedules || [];
      const updatedSchedules = schedules.map(s => 
          s.id === scheduleId 
          ? { ...s, status: 'completed' as const, resolvedBy: actorName, resolvedAt: new Date().toISOString() } 
          : s
      );

      this.cards[cardIndex] = { ...this.cards[cardIndex], schedules: updatedSchedules };

      this.logAudit(cardId, 'SCHEDULE_RESOLVED', `Lembrete resolvido`, actorName);
      await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Helper for Logging
  private logAudit(cardId: string, action: string, desc: string, actor: string) {
      if(!MOCK_AUDIT_LOGS[cardId]) MOCK_AUDIT_LOGS[cardId] = [];
      MOCK_AUDIT_LOGS[cardId].unshift({
          id: Date.now().toString(),
          action: action,
          description: desc,
          actor: actor,
          timestamp: new Date().toLocaleString()
      });
  }

  private addToQueue(action: string) {
    this.queue.push(action);
    setTimeout(() => {
      this.queue = this.queue.filter(q => q !== action);
    }, 4000);
  }

  getQueueStatus() {
    return this.queue;
  }
}

export const backendService = new MockBackendService();
