import { WorkflowColumn, KanbanCard, CardPriority, ClientCompany, ChatMessage, AuditLogEntry, Department } from './types';

// V2: Empresas Mockadas para o Context Switcher
export const MOCK_COMPANIES: ClientCompany[] = [
  { id: 'comp_1', name: 'Tech Solutions SA', cnpj: '12.345.678/0001-90', taxRegime: 'Lucro Presumido' },
  { id: 'comp_2', name: 'Padaria do Zé', cnpj: '98.765.432/0001-11', taxRegime: 'Simples' },
  { id: 'comp_3', name: 'Consultoria Alpha', cnpj: '11.222.333/0001-00', taxRegime: 'Real' }
];

export const MOCK_DEPTS: Department[] = [
  { id: 'dept_reception', name: 'Recepção (Triagem)', code: 'REC', color: 'indigo' },
  { id: 'dept_fiscal', name: 'Departamento Fiscal', code: 'FISC', color: 'blue' },
  { id: 'dept_rh', name: 'Recursos Humanos', code: 'RH', color: 'purple' },
  { id: 'dept_legal', name: 'Jurídico', code: 'JUR', color: 'slate' },
  { id: 'dept_supervisor', name: 'Supervisão', code: 'SUP', color: 'rose' }, // New Supervisor Dept
];

export const MOCK_COLUMNS: WorkflowColumn[] = [
  // --- RECEPÇÃO (Fluxo Inicial) ---
  { 
    id: 'col_rec_inbox', 
    departmentId: 'dept_reception',
    title: 'Triagem (Inbox)', 
    chatwootTag: 'triagem', 
    stage: 'triage',
    orderIndex: 0,
    color: 'bg-slate-400'
  },
  { 
    id: 'col_rec_wip', 
    departmentId: 'dept_reception',
    title: 'Em Atendimento', 
    chatwootTag: 'atendimento-rec', 
    stage: 'handover',
    orderIndex: 1,
    color: 'bg-blue-500'
  },

  // --- FISCAL ---
  { 
    id: 'col_fiscal_inbox', 
    departmentId: 'dept_fiscal',
    title: 'Entrada Fiscal', 
    chatwootTag: 'fiscal-inbox', 
    stage: 'triage',
    orderIndex: 0,
    color: 'bg-slate-400'
  },
  { 
    id: 'col_fiscal_analysis', 
    departmentId: 'dept_fiscal',
    title: 'Análise Técnica', 
    chatwootTag: 'fiscal-analysis', 
    stage: 'handover',
    orderIndex: 1,
    color: 'bg-indigo-500'
  },
  { 
    id: 'col_fiscal_qa', 
    departmentId: 'dept_fiscal',
    title: 'Validação (QA)', 
    chatwootTag: 'qa-check', 
    stage: 'handover',
    orderIndex: 2,
    checklist: [
      { id: 'chk_1', text: 'Impostos Calculados', required: true },
      { id: 'chk_2', text: 'Guia Anexada', required: true },
      { id: 'chk_3', text: 'Cliente Notificado', required: false }
    ],
    color: 'bg-amber-500'
  },
  { 
    id: 'col_fiscal_done', 
    departmentId: 'dept_fiscal',
    title: 'Concluído', 
    chatwootTag: 'fiscal-resolved', 
    stage: 'resolution',
    orderIndex: 3,
    color: 'bg-emerald-500'
  },

  // --- RH ---
  { 
    id: 'col_rh_inbox', 
    departmentId: 'dept_rh',
    title: 'Entrada RH', 
    chatwootTag: 'rh-inbox', 
    stage: 'triage',
    orderIndex: 0,
    color: 'bg-slate-400'
  },
  { 
    id: 'col_rh_process', 
    departmentId: 'dept_rh',
    title: 'Processamento', 
    chatwootTag: 'rh-proc', 
    stage: 'handover',
    orderIndex: 1,
    color: 'bg-purple-500'
  },

  // --- SUPERVISOR (Monitoramento) ---
  { 
    id: 'col_sup_overview', 
    departmentId: 'dept_supervisor',
    title: 'Atenção Necessária', 
    chatwootTag: 'sup-attention', 
    stage: 'triage',
    orderIndex: 0,
    color: 'bg-red-500'
  }
];

export const MOCK_CARDS: KanbanCard[] = [
  {
    id: 'card_1',
    conversationId: 1024,
    columnId: 'col_rec_inbox', // Starts in Reception
    protocolNumber: '#2024-REC-0842',
    title: 'João Silva (Gerente)',
    customerName: 'João Silva',
    customerCode: 'CLI-00192',
    customerDocument: '123.456.789-00',
    description: 'Preciso da guia do DAS deste mês. Poderiam me enviar?',
    priority: CardPriority.URGENT,
    tags: ['urgente', 'financeiro'],
    customAttributes: {},
    updatedAt: new Date().toISOString(),
    assignee: undefined,
    selectedCompanyId: undefined, 
  },
  {
    id: 'card_2',
    conversationId: 1025,
    columnId: 'col_fiscal_analysis', // Already in Fiscal
    protocolNumber: '#2024-FISC-1201',
    title: 'Maria Oliveira',
    customerName: 'Maria Oliveira',
    customerCode: 'CLI-00255',
    customerDocument: '987.654.321-99',
    description: 'Dúvida sobre alíquota de ISS retido na fonte.',
    priority: CardPriority.MEDIUM,
    tags: ['fiscal-pending', 'imposto'],
    customAttributes: { client_tier: 'silver' },
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    assignee: { id: 1, name: 'Carlos Contador', email: 'carlos@firm.com', avatar_url: '' },
    selectedCompanyId: 'comp_1',
    selectedCompany: MOCK_COMPANIES[0],
    completedChecklistIds: []
  },
  {
    id: 'card_3',
    conversationId: 1026,
    columnId: 'col_rh_inbox', // In RH
    protocolNumber: '#2024-RH-1199',
    title: 'José Santos',
    customerName: 'José Santos',
    customerCode: 'CLI-00050',
    customerDocument: '111.222.333-44',
    description: 'Envio de documentos para admissão de funcionário.',
    priority: CardPriority.LOW,
    tags: ['waiting-qa', 'admissao'],
    customAttributes: {},
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    assignee: { id: 2, name: 'Ana RH', email: 'ana@firm.com', avatar_url: '' },
    selectedCompanyId: 'comp_2',
    selectedCompany: MOCK_COMPANIES[1],
    completedChecklistIds: []
  },
  {
    id: 'card_4',
    conversationId: 1028,
    columnId: 'col_rec_inbox',
    protocolNumber: '#2024-REC-9999',
    title: 'Roberto',
    customerName: 'Roberto Almeida',
    customerCode: 'CLI-00300',
    customerDocument: '555.444.333-22',
    description: 'Solicitação de férias.',
    priority: CardPriority.NONE, // Testing NONE priority
    tags: [],
    customAttributes: {},
    updatedAt: new Date().toISOString(),
    assignee: undefined,
  }
];

export const MOCK_CHAT_HISTORY: Record<string, ChatMessage[]> = {
  'card_2': [
    { id: 'msg_1', content: 'Olá, bom dia. Poderiam me ajudar?', senderType: 'user', timestamp: '10:00' },
    { id: 'msg_2', content: 'Bom dia! Sou o robô de triagem. Qual sua dúvida?', senderType: 'agent', timestamp: '10:01' },
    { id: 'msg_3', content: 'Tenho dúvida sobre a nota fiscal de serviço que emiti ontem.', senderType: 'user', timestamp: '10:02' },
    { id: 'msg_4', content: 'Sistema: Transferido para Dept Fiscal', senderType: 'system', timestamp: '10:05' },
    { id: 'msg_5', content: 'Olá Maria, Carlos aqui. Qual a dúvida específica?', senderType: 'agent', timestamp: '10:10' }
  ]
};

export const MOCK_AUDIT_LOGS: Record<string, AuditLogEntry[]> = {
  'card_2': [
    { id: 'aud_1', action: 'CREATE', description: 'Ticket criado na Triagem', actor: 'System', timestamp: '2024-05-20 09:55' },
    { id: 'aud_2', action: 'CONTEXT_SWITCH', description: 'Contexto definido para Tech Solutions SA', actor: 'Carlos Contador', timestamp: '2024-05-20 10:05' },
    { id: 'aud_3', action: 'MOVE', description: 'Movido para Análise Fiscal', actor: 'Carlos Contador', timestamp: '2024-05-20 10:15' }
  ]
};
