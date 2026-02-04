import React, { useState, useEffect } from 'react';
import { KanbanCard, ChatMessage, AuditLogEntry, ClientCompany, WorkflowColumn, Department, ScheduleEntry, CardChecklistItem, ChatwootUser } from '../types';
import { backendService } from '../services/mockBackend';
import { X, Building2, User, Calendar, CheckSquare, MessageSquare, History, FileText, AlertTriangle, Send, ArrowRightLeft, Bell, CalendarClock, CheckCircle2, Trash2, Edit2, Zap, Plus, Mail, Timer, ChevronDown, Clock, GripVertical } from 'lucide-react';

interface CardDetailModalProps {
  cardId: string;
  onClose: () => void;
  allColumns: WorkflowColumn[];
  onCardUpdate?: () => void;
}

const ACTION_TRANSLATION: Record<string, string> = {
  'CREATE': 'Ticket Criado',
  'MOVE': 'Movimentação',
  'CONTEXT_SWITCH': 'Troca de Contexto',
  'SCHEDULE_CREATED': 'Agendamento Criado',
  'SCHEDULE_UPDATED': 'Agendamento Editado',
  'SCHEDULE_DELETED': 'Agendamento Excluído',
  'SCHEDULE_RESOLVED': 'Tarefa Concluída',
  'NOTIFICATION_SENT': 'Notificação Enviada'
};

const MOCK_AGENTS: ChatwootUser[] = [
    { id: 1, name: 'Carlos Contador', email: 'carlos@firm.com', avatar_url: '' },
    { id: 2, name: 'Ana RH', email: 'ana@firm.com', avatar_url: '' },
    { id: 999, name: 'Supervisor Admin', email: 'admin@firm.com', avatar_url: '' },
];

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ cardId, onClose, allColumns, onCardUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<KanbanCard | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'agenda' | 'notifications' | 'transfer' | 'history'>('details');
  
  // Data State
  const [companies] = useState<ClientCompany[]>(backendService.getCompanies());
  const [departments] = useState<Department[]>(backendService.getDepartments());
  const [newNote, setNewNote] = useState('');
  
  // UI States
  const [showAgentPopover, setShowAgentPopover] = useState(false);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');

  // Transfer State
  const [transferDeptId, setTransferDeptId] = useState<string>('');
  const [transferColId, setTransferColId] = useState<string>('');

  // Schedule State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState<{title: string, description: string, date: string, time: string}>({
      title: '', description: '', date: '', time: ''
  });

  const CURRENT_USER = "Admin User"; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await backendService.getCardDetails(cardId);
        setCard(data.card);
        setChatHistory(data.chatHistory);
        setAuditLogs(data.auditLogs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cardId]);

  // --- HELPERS ---
  const getDuration = (startDate: string) => {
      const start = new Date(startDate).getTime();
      const now = Date.now();
      const diff = now - start;
      const hours = Math.floor(diff / 3600000);
      const remainingHours = hours % 24;
      const days = Math.floor(hours / 24);
      const minutes = Math.floor((diff % 3600000) / 60000);

      if (days > 0) return `${days}d ${remainingHours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes} min`;
  };

  const isLongDuration = (startDate: string) => {
      return (Date.now() - new Date(startDate).getTime()) > (24 * 3600000); // Red if > 24h
  };

  const getAgentName = (id?: number) => {
      if (!id) return null;
      return MOCK_AGENTS.find(a => a.id === id)?.name || 'Desconhecido';
  };

  // --- CHECKLIST HANDLERS ---
  const checklistTotal = card?.checklist?.length || 0;
  const checklistCompleted = card?.checklist?.filter(i => i.isChecked).length || 0;
  const checklistPercent = checklistTotal === 0 ? 0 : Math.round((checklistCompleted / checklistTotal) * 100);

  const handleAddChecklistItem = async () => {
      if(!card || !newChecklistItemText.trim()) return;
      await backendService.addChecklistItem(card.id, newChecklistItemText);
      const newItem: CardChecklistItem = { id: `temp_${Date.now()}`, text: newChecklistItemText, isChecked: false };
      setCard({...card, checklist: [...(card.checklist || []), newItem]});
      setNewChecklistItemText('');
  };

  const handleToggleChecklist = async (itemId: string) => {
      if(!card) return;
      await backendService.toggleChecklistItem(card.id, itemId);
      setCard({
          ...card,
          checklist: card.checklist.map(i => i.id === itemId ? { ...i, isChecked: !i.isChecked } : i)
      });
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
      if(!card) return;
      await backendService.deleteChecklistItem(card.id, itemId);
      setCard({
          ...card,
          checklist: card.checklist.filter(i => i.id !== itemId)
      });
  };

  const handleAssignChecklist = async (itemId: string, agentId: string) => {
      if(!card) return;
      const id = parseInt(agentId);
      await backendService.updateChecklistItem(card.id, itemId, { assigneeId: isNaN(id) ? undefined : id });
      setCard({
          ...card,
          checklist: card.checklist.map(i => i.id === itemId ? { ...i, assigneeId: isNaN(id) ? undefined : id } : i)
      });
  };

  const handleDateChecklist = async (itemId: string, dateStr: string) => {
      if(!card) return;
      await backendService.updateChecklistItem(card.id, itemId, { dueDate: dateStr });
      setCard({
          ...card,
          checklist: card.checklist.map(i => i.id === itemId ? { ...i, dueDate: dateStr } : i)
      });
  };

  // --- GENERAL HANDLERS ---
  const handleContextChange = async (companyId: string) => {
    if (!card) return;
    try {
        await backendService.setCardContext(card.id, companyId);
        const comp = companies.find(c => c.id === companyId);
        setCard({...card, selectedCompanyId: companyId, selectedCompany: comp});
        if(onCardUpdate) onCardUpdate();
    } catch (e) {
        alert("Erro ao mudar contexto");
    }
  };

  const handleTransfer = async () => {
      if(!transferDeptId || !transferColId || !card) return;
      try {
          await backendService.moveCard(card.id, transferColId);
          alert(`Sucesso! Card transferido.`);
          if(onCardUpdate) onCardUpdate();
          onClose();
      } catch (error: any) {
          alert(`Erro na transferência: ${error.message}`);
      }
  };

  const handleAssignToMe = async () => {
      if(!card) return;
      await backendService.assignCard(card.id, 999, 'Supervisor Admin');
      setCard({
          ...card,
          assignee: { id: 999, name: 'Supervisor Admin', email: 'admin@sys.com', avatar_url: '' }
      });
      if(onCardUpdate) onCardUpdate();
      setShowAgentPopover(false);
  };

  // --- SCHEDULE HANDLERS (Unified for Agenda & Notifications) ---
  const handleSaveSchedule = async (type: 'reminder' | 'notification') => {
      if(!card) return;
      const scheduledAt = `${newSchedule.date}T${newSchedule.time}`;
      
      // Update or Create logic could go here, simplified for create
      const entry: ScheduleEntry = {
           id: editingScheduleId || Date.now().toString(), 
           type, 
           status: 'pending', 
           title: newSchedule.title, 
           description: newSchedule.description, 
           scheduledAt, 
           createdBy: CURRENT_USER 
      };

      if (editingScheduleId) {
          await backendService.updateSchedule(card.id, editingScheduleId, entry, CURRENT_USER);
          setCard(prev => prev ? ({...prev, schedules: prev.schedules?.map(s => s.id === editingScheduleId ? entry : s)}) : null);
      } else {
          await backendService.addSchedule(card.id, entry);
          setCard(prev => prev ? ({...prev, schedules: [entry, ...(prev.schedules || [])]}) : null);
      }

      setShowScheduleForm(false);
      setEditingScheduleId(null);
      setNewSchedule({ title: '', description: '', date: '', time: '' });
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
      if(!card || !confirm("Tem certeza?")) return;
      await backendService.deleteSchedule(card.id, scheduleId, CURRENT_USER);
      setCard(prev => prev ? ({...prev, schedules: prev.schedules?.filter(s => s.id !== scheduleId)}) : null);
  };

  const renderScheduleList = (type: 'reminder' | 'notification') => {
      const items = card?.schedules?.filter(s => s.type === type) || [];
      if (items.length === 0) return <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg bg-gray-50">Nenhum item encontrado.</div>;

      return (
        <div className="space-y-3">
            {items.map(schedule => (
                <div key={schedule.id} className="flex items-start p-3 border rounded-lg shadow-sm bg-white hover:border-blue-300 transition-all group">
                    <div className={`p-2 rounded-full mr-3 ${type === 'notification' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {type === 'notification' ? <Zap size={16} /> : <Clock size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                            <h5 className="text-sm font-bold text-gray-800">{schedule.title}</h5>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${schedule.status === 'sent' ? 'bg-gray-200' : 'bg-blue-50 text-blue-600'}`}>{schedule.status}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{schedule.description}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <Calendar size={10} className="mr-1"/> {new Date(schedule.scheduledAt).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <button onClick={() => handleDeleteSchedule(schedule.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
            ))}
        </div>
      );
  };

  const renderAddForm = (type: 'reminder' | 'notification') => (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 animate-in fade-in slide-in-from-top-2">
          <h5 className="font-bold text-gray-700 mb-3 text-sm flex items-center">
              {type === 'reminder' ? <CalendarClock size={16} className="mr-2"/> : <Bell size={16} className="mr-2"/>}
              {editingScheduleId ? 'Editar Item' : `Novo ${type === 'reminder' ? 'Lembrete' : 'Envio'}`}
          </h5>
          <div className="space-y-3">
              <input type="text" placeholder="Título" className="w-full text-sm border-gray-300 rounded shadow-sm" value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} />
              <textarea placeholder="Descrição..." className="w-full text-sm border-gray-300 rounded shadow-sm h-16" value={newSchedule.description} onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})} />
              <div className="flex space-x-2">
                  <input type="date" className="flex-1 text-sm border-gray-300 rounded" value={newSchedule.date} onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})} />
                  <input type="time" className="w-32 text-sm border-gray-300 rounded" value={newSchedule.time} onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                  <button onClick={() => { setShowScheduleForm(false); setEditingScheduleId(null); }} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
                  <button onClick={() => handleSaveSchedule(type)} disabled={!newSchedule.title || !newSchedule.date} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300">Salvar</button>
              </div>
          </div>
      </div>
  );

  if (loading || !card) return null;

  const currentColumn = allColumns.find(c => c.id === card.columnId);
  const transferColumns = allColumns.filter(c => c.departmentId === transferDeptId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-start flex-shrink-0">
            <div>
                <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-800">{card.customerName}</h2>
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded font-mono border border-slate-300">{card.protocolNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border uppercase font-bold ${card.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{card.priority}</span>
                    <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ml-2 ${isLongDuration(card.createdAt) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        <Timer size={12} className="mr-1" />
                        Aberto há {getDuration(card.createdAt)}
                    </div>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500 mt-2">
                    {/* AGENT POPOVER */}
                    <div className="relative">
                        <button onClick={() => setShowAgentPopover(!showAgentPopover)} className="flex items-center space-x-1 hover:bg-gray-200 px-2 py-1 rounded transition-colors">
                            <User size={14} />
                            <span className="font-medium text-gray-700">{card.assignee?.name || 'Sem Agente'}</span>
                            <ChevronDown size={12} />
                        </button>
                        {showAgentPopover && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="p-4 border-b border-gray-100 bg-slate-50 rounded-t-lg"><h4 className="text-xs font-bold text-gray-500 uppercase">Responsável</h4></div>
                                {card.assignee ? (
                                    <div className="p-4">
                                        <div className="flex items-center mb-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mr-3">{card.assignee.name.charAt(0)}</div>
                                            <div><p className="font-bold text-gray-800">{card.assignee.name}</p><div className="flex items-center text-xs text-gray-500 mt-0.5"><Mail size={10} className="mr-1"/> {card.assignee.email}</div></div>
                                        </div>
                                        <button onClick={handleAssignToMe} className="w-full py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700">Alterar Agente</button>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center"><button onClick={handleAssignToMe} className="w-full py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">Assumir Ticket</button></div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span>{currentColumn?.title}</span></div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={24} /></button>
        </div>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
            {/* LEFT: CHAT */}
            <div className="w-2/5 border-r border-gray-200 flex flex-col bg-slate-50">
                <div className="p-3 border-b border-gray-200 bg-white shadow-sm flex items-center text-gray-600 font-medium text-sm"><MessageSquare size={16} className="mr-2" /> Chat Preview</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.length === 0 ? <div className="text-center text-gray-400 mt-10 italic">Vazio.</div> : chatHistory.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderType === 'agent' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${msg.senderType === 'agent' ? 'bg-blue-100 text-blue-900 rounded-tr-none' : msg.senderType === 'system' ? 'bg-gray-200 text-gray-600 text-xs italic w-full text-center' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>{msg.content}</div>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-white border-t border-gray-200 relative"><input type="text" placeholder="Nota interna..." className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm outline-none" /><button className="absolute right-4 top-4.5 text-blue-600"><Send size={16} /></button></div>
            </div>

            {/* RIGHT: TABS & CONTENT */}
            <div className="w-3/5 flex flex-col bg-white overflow-hidden">
                {/* SCROLLABLE TABS */}
                <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide flex-shrink-0">
                    <button onClick={() => setActiveTab('details')} className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <FileText size={16}/><span>Detalhes</span>
                    </button>
                    <button onClick={() => setActiveTab('checklist')} className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'checklist' ? 'border-green-500 text-green-600 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <CheckSquare size={16}/><span>Checklist ({checklistCompleted}/{checklistTotal})</span>
                    </button>
                    <button onClick={() => setActiveTab('agenda')} className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'agenda' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <CalendarClock size={16}/><span>Agenda</span>
                    </button>
                    <button onClick={() => setActiveTab('notifications')} className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'notifications' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <Bell size={16}/><span>Notificações</span>
                    </button>
                    <button onClick={() => setActiveTab('transfer')} className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'transfer' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <ArrowRightLeft size={16}/><span>Transferir</span>
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'history' ? 'border-gray-500 text-gray-600 bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <History size={16}/><span>Histórico</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    
                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className={`p-4 rounded-lg border-2 bg-white ${card.selectedCompany ? 'border-blue-100' : 'border-amber-200'}`}>
                                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center"><Building2 size={16} className="mr-2" /> Contexto Jurídico</h4>
                                {card.selectedCompany ? (
                                    <div className="flex justify-between items-center">
                                        <div><p className="font-semibold text-blue-900">{card.selectedCompany.name}</p><p className="text-xs text-blue-700 font-mono">{card.selectedCompany.cnpj}</p></div>
                                        <button onClick={() => setCard({...card, selectedCompanyId: undefined, selectedCompany: undefined})} className="text-xs text-blue-600 hover:underline">Alterar</button>
                                    </div>
                                ) : (
                                    <select className="w-full text-sm border-gray-300 rounded" onChange={(e) => handleContextChange(e.target.value)} defaultValue=""><option value="" disabled>Selecione a empresa...</option>{companies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select>
                                )}
                            </div>
                            {/* CUSTOM ATTRIBUTES RESTORED */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">Atributos Customizados</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(card.customAttributes).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 p-2 rounded border border-gray-100"><span className="block text-[10px] uppercase text-gray-500 font-bold">{key}</span><span className="block text-sm font-medium text-gray-800">{String(value)}</span></div>
                                    ))}
                                    {Object.keys(card.customAttributes).length === 0 && <span className="text-gray-400 text-sm italic col-span-2">Nenhum atributo.</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CHECKLIST TAB - INSPIRATION STYLE */}
                    {activeTab === 'checklist' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                             <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center"><CheckSquare size={18} className="mr-2 text-green-600" /> Progresso</h4>
                                <div className="flex items-center w-1/2 space-x-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${checklistPercent}%` }}></div></div>
                                    <span className="text-xs font-mono font-bold text-gray-500">{checklistPercent}%</span>
                                </div>
                             </div>
                             
                             <div className="relative mb-4">
                                <input type="text" className="w-full pl-4 pr-10 py-3 text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Adicionar nova tarefa..." value={newChecklistItemText} onChange={(e) => setNewChecklistItemText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()} />
                                <button onClick={handleAddChecklistItem} className="absolute right-2 top-2 p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Plus size={18} /></button>
                             </div>

                             <div className="space-y-3">
                                {card.checklist?.map(item => (
                                    <div key={item.id} className={`group bg-white rounded-lg border transition-all relative overflow-hidden ${item.isChecked ? 'border-green-200 opacity-75' : 'border-gray-200 hover:border-blue-300 shadow-sm'}`}>
                                        {/* Status Strip */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isChecked ? 'bg-green-500' : 'bg-gray-300 group-hover:bg-blue-400'}`}></div>
                                        
                                        <div className="p-3 pl-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3">
                                                    <input type="checkbox" className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer" checked={item.isChecked} onChange={() => handleToggleChecklist(item.id)} />
                                                    <div>
                                                        <span className={`text-sm block ${item.isChecked ? 'text-gray-500 line-through' : 'text-gray-800 font-medium'}`}>{item.text}</span>
                                                        
                                                        {/* Footer: Date & Agent */}
                                                        <div className="flex items-center mt-2 space-x-2">
                                                            {/* Date Badge */}
                                                            <div className={`flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${item.dueDate ? (new Date(item.dueDate) < new Date() && !item.isChecked ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200') : 'bg-transparent border-transparent'}`}>
                                                                <Calendar size={10} className="mr-1"/>
                                                                <input type="date" className="bg-transparent border-none p-0 w-20 text-[10px] focus:ring-0 cursor-pointer" value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => handleDateChecklist(item.id, e.target.value)} />
                                                            </div>
                                                            
                                                            {/* Agent Badge */}
                                                            <div className="relative">
                                                                <select className="appearance-none pl-5 pr-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-600 cursor-pointer hover:bg-white focus:ring-1 focus:ring-blue-500" value={item.assigneeId || ""} onChange={(e) => handleAssignChecklist(item.id, e.target.value)}>
                                                                    <option value="">Atribuir</option>
                                                                    {MOCK_AGENTS.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
                                                                </select>
                                                                <User size={10} className="absolute left-1.5 top-1.5 text-gray-400 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteChecklistItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!card.checklist || card.checklist.length === 0) && <div className="p-8 text-center text-gray-400 border border-dashed rounded-lg bg-white">Lista vazia. Adicione uma tarefa.</div>}
                             </div>
                        </div>
                    )}
                    
                    {/* AGENDA TAB */}
                    {activeTab === 'agenda' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-800">Compromissos Internos</h4><button onClick={() => { setShowScheduleForm(true); setNewSchedule({...newSchedule, title: ''}) }} className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600">Novo</button></div>
                            {showScheduleForm && renderAddForm('reminder')}
                            {renderScheduleList('reminder')}
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB (RESTORED) */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-800">Mensagens Automáticas (WhatsApp)</h4><button onClick={() => { setShowScheduleForm(true); setNewSchedule({...newSchedule, title: ''}) }} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700">Nova</button></div>
                            <div className="bg-purple-50 p-3 rounded text-xs text-purple-700 mb-4 border border-purple-100 flex items-center"><Zap size={14} className="mr-2"/>Estas mensagens serão enviadas automaticamente para o cliente no horário agendado.</div>
                            {showScheduleForm && renderAddForm('notification')}
                            {renderScheduleList('notification')}
                        </div>
                    )}

                    {/* TRANSFER TAB */}
                    {activeTab === 'transfer' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-900 mb-1">Transferência entre Departamentos</h4>
                                <p className="text-xs text-blue-700">O ticket sairá do seu quadro e irá para a triagem do setor selecionado.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Departamento Destino</label>
                                    <select className="w-full border-gray-300 rounded mt-1 shadow-sm" value={transferDeptId} onChange={(e) => setTransferDeptId(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {departments.filter(d => d.id !== currentColumn?.departmentId).map(dept => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                                    </select>
                                </div>
                                {transferDeptId && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-medium text-gray-700">Coluna de Entrada</label>
                                        <select className="w-full border-gray-300 rounded mt-1 shadow-sm" value={transferColId} onChange={(e) => setTransferColId(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {transferColumns.map(col => (<option key={col.id} value={col.id}>{col.title}</option>))}
                                        </select>
                                    </div>
                                )}
                                <button onClick={handleTransfer} disabled={!transferColId} className="w-full py-3 bg-blue-600 text-white rounded font-bold shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed mt-4 transition-colors">Confirmar Transferência</button>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB (RESTORED) */}
                    {activeTab === 'history' && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                             <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pt-2">
                                {auditLogs.length === 0 ? <p className="text-sm text-gray-400 italic ml-6">Sem registros de auditoria.</p> : auditLogs.map((log) => (
                                    <div key={log.id} className="ml-6 relative group">
                                        <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white group-hover:ring-blue-50 transition-all"><span className="h-3 w-3 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" /></span>
                                        <div className="flex justify-between items-start">
                                            <h3 className="flex items-center text-sm font-semibold text-gray-900">{ACTION_TRANSLATION[log.action] || log.action}</h3>
                                            <time className="block mb-1 text-xs font-normal leading-none text-gray-400">{log.timestamp}</time>
                                        </div>
                                        <p className="mb-1 text-sm font-normal text-gray-500">{log.description}</p>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1"><User size={10} className="mr-1"/> {log.actor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
