import { MOCK_CARDS, MOCK_COLUMNS, MOCK_COMPANIES, MOCK_CHAT_HISTORY, MOCK_AUDIT_LOGS, MOCK_DEPTS } from '../constants';
import { KanbanCard, WorkflowColumn, ClientCompany, ChatMessage, AuditLogEntry, Department, ScheduleEntry, CardChecklistItem } from '../types';

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
      const otherColumns = this.columns.filter(c => c.departmentId !== departmentId);
      const deptColumns = this.columns.filter(c => c.departmentId === departmentId);
      
      const updatedDeptColumns = deptColumns.map(col => {
          const newIndex = newOrderIds.indexOf(col.id);
          return { ...col, orderIndex: newIndex };
      });

      this.columns = [...otherColumns, ...updatedDeptColumns];
  }

  deleteColumn(colId: string) {
      this.columns = this.columns.filter(c => c.id !== colId);
  }

  async getCardDetails(cardId: string): Promise<{ 
    card: KanbanCard, 
    chatHistory: ChatMessage[],
    auditLogs: AuditLogEntry[] 
  }> {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) throw new Error("Card Not Found");
    
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

    this.cards[cardIndex] = {
        ...this.cards[cardIndex],
        selectedCompanyId: companyId,
        selectedCompany: company
    };

    this.logAudit(cardId, 'CONTEXT_SWITCH', `Contexto alterado para ${company.name}`, 'System');
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async moveCard(cardId: string, targetColumnId: string): Promise<void> {
    const cardIndex = this.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found');

    const card = this.cards[cardIndex];
    const targetColumn = this.columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) throw new Error('Column not found');

    if (!card.selectedCompanyId && targetColumn.stage !== 'triage') {
        throw new Error("⛔ BLOQUEIO: Você deve selecionar uma Empresa (Contexto) antes de mover o card.");
    }

    this.cards[cardIndex] = {
      ...card,
      columnId: targetColumnId,
      updatedAt: new Date().toISOString(),
      tags: [...card.tags.filter(t => !this.columns.map(c => c.chatwootTag).includes(t)), targetColumn.chatwootTag]
    };

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

      await new Promise(resolve => setTimeout(resolve, 200));
  }

  // --- CHECKLIST ADVANCED METHODS ---

  async addChecklistItem(cardId: string, text: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const newItem: CardChecklistItem = {
          id: `ck_${Date.now()}`,
          text: text,
          isChecked: false
      };

      this.cards[cardIndex] = {
          ...this.cards[cardIndex],
          checklist: [...(this.cards[cardIndex].checklist || []), newItem]
      };
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  async toggleChecklistItem(cardId: string, itemId: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const checklist = this.cards[cardIndex].checklist || [];
      const updatedChecklist = checklist.map(item => 
          item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      );

      this.cards[cardIndex] = { ...this.cards[cardIndex], checklist: updatedChecklist };
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  async updateChecklistItem(cardId: string, itemId: string, updates: Partial<CardChecklistItem>) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const checklist = this.cards[cardIndex].checklist || [];
      const updatedChecklist = checklist.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
      );

      this.cards[cardIndex] = { ...this.cards[cardIndex], checklist: updatedChecklist };
      await new Promise(resolve => setTimeout(resolve, 200));
  }

  async deleteChecklistItem(cardId: string, itemId: string) {
      const cardIndex = this.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      const checklist = this.cards[cardIndex].checklist || [];
      const updatedChecklist = checklist.filter(item => item.id !== itemId);

      this.cards[cardIndex] = { ...this.cards[cardIndex], checklist: updatedChecklist };
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
      await new Promise(resolve => setTimeout(resolve, 500)); 
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

  getQueueStatus() {
    return this.queue;
  }
}

export const backendService = new MockBackendService();
