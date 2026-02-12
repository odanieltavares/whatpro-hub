// Definições de Tipos Globais

export enum CardPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface ChatwootUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
}

// V2: Empresas e Contexto
export interface ClientCompany {
  id: string;
  name: string;
  cnpj: string;
  taxRegime: 'Simples' | 'Lucro Presumido' | 'Real';
}

// V3: Advanced Checklist Item
export interface CardChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  assigneeId?: number; // Agente responsável por este item
  dueDate?: string;    // Data limite ISO
  isSystemGenerated?: boolean; // Se veio do template da coluna
}

// Template on Column (still simple)
export interface ChecklistTemplateItem {
  id: string;
  text: string;
  required: boolean;
}

// New: Scheduling & Notifications
export type ScheduleType = 'reminder' | 'notification';
export type ScheduleStatus = 'pending' | 'sent' | 'cancelled' | 'completed';

export interface ScheduleEntry {
  id: string;
  type: ScheduleType;
  status: ScheduleStatus;
  scheduledAt: string; // ISO Date
  title: string;
  description?: string;
  createdBy: string;
  // Tracking resolution
  resolvedBy?: string;
  resolvedAt?: string;
}

// MODULE 1: Dynamic Workflow Types
export interface Department {
  id: string;
  name: string;
  code: string; // e.g., 'FISC', 'RH'
  description?: string;
  color: string; // Tailwind class identifier e.g., 'blue', 'green'
}

export interface WorkflowColumn {
  id: string;
  departmentId: string; // Linked to Department
  title: string;
  chatwootTag: string;
  stage: 'triage' | 'handover' | 'waiting' | 'resolution';
  orderIndex: number;
  checklist?: ChecklistTemplateItem[]; // Template for new cards
  color?: string; // New: Custom column color (hex or tailwind class)
}

// MODULE 2: Session Stack Types
export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED', // Waiting in stack (Interruption)
  QUEUED = 'QUEUED', // Waiting to start
  COMPLETED = 'COMPLETED'
}

export enum TransferMode {
  HANDOFF = 'HANDOFF',   // Linear pass (A -> B)
  INTERRUPT = 'INTERRUPT' // Stack push (A [paused] -> B [active])
}

export interface TicketNode {
  id: string;
  departmentId: string; // Which dept owns this ticket node
  status: TicketStatus;
  startedAt: string;
  ownerId?: number; // User ID
}

export interface TicketSession {
  conversationId: number;
  customerName: string;
  companyName: string;
  ticketStack: TicketNode[]; // 0 is bottom, length-1 is top (Active)
}

// Chat Preview Types
export interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'agent' | 'system';
  timestamp: string;
}

// Legacy support for KanbanCard (Visual representation of the Active Node)
export interface KanbanCard {
  id: string;
  conversationId: number;
  columnId: string; // Mapped from Active Ticket Status/Dept
  title: string;
  description?: string;
  assignee?: ChatwootUser;
  priority: CardPriority;
  protocolNumber: string;
  customerName: string;
  selectedCompanyId?: string;
  selectedCompany?: ClientCompany;
  customAttributes: Record<string, any>;
  tags: string[];
  updatedAt: string;
  createdAt: string; // Added for Duration Tracking
  
  // V3 Checklist
  checklist: CardChecklistItem[]; 
  
  schedules?: ScheduleEntry[]; 
}

export interface AuditLogEntry {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: string;
}
