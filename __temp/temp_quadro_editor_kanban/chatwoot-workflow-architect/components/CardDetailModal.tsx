import React, { useState, useEffect } from 'react';
import { KanbanCard, ChatMessage, AuditLogEntry, ClientCompany, WorkflowColumn, Department, ScheduleEntry } from '../types';
import { backendService } from '../services/mockBackend';
import { X, Building2, User, Calendar, CheckSquare, MessageSquare, History, FileText, AlertTriangle, Send, ArrowRightLeft, ArrowRight, Bell, Clock, Plus, UserPlus, CalendarClock, CheckCircle2, Trash2, Edit2, Zap, AlignLeft } from 'lucide-react';

interface CardDetailModalProps {
  cardId: string;
  onClose: () => void;
  allColumns: WorkflowColumn[];
  onCardUpdate?: () => void; // Trigger parent refresh
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

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ cardId, onClose, allColumns, onCardUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<KanbanCard | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  
  // Updated Tabs State
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'history' | 'transfer' | 'agenda' | 'notifications'>('details');
  
  const [companies] = useState<ClientCompany[]>(backendService.getCompanies());
  const [departments] = useState<Department[]>(backendService.getDepartments());
  const [newNote, setNewNote] = useState('');

  // Transfer State
  const [transferDeptId, setTransferDeptId] = useState<string>('');
  const [transferColId, setTransferColId] = useState<string>('');

  // Schedule/Notification State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState<{title: string, description: string, date: string, time: string}>({
      title: '', description: '', date: '', time: ''
  });

  // Current User Mock (In real app, comes from Context/Auth)
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

  // Reset form when tab changes
  useEffect(() => {
      setShowScheduleForm(false);
      setEditingScheduleId(null);
      setNewSchedule({title: '', description: '', date: '', time: ''});
  }, [activeTab]);

  const handleToggleChecklist = async (itemId: string) => {
    if (!card) return;
    const current = card.completedChecklistIds || [];
    const updated = current.includes(itemId) 
      ? current.filter(id => id !== itemId) 
      : [...current, itemId];
    
    // Optimistic
    setCard({ ...card, completedChecklistIds: updated });
    await backendService.updateChecklist(card.id, updated);
  };

  const handleContextChange = async (companyId: string) => {
    if (!card) return;
    try {
        await backendService.setCardContext(card.id, companyId);
        const comp = companies.find(c => c.id === companyId);
        setCard({...card, selectedCompanyId: companyId, selectedCompany: comp});
        setAuditLogs(prev => [{
            id: Date.now().toString(),
            action: 'CONTEXT_SWITCH',
            actor: CURRENT_USER,
            description: `Contexto alterado para ${comp?.name}`,
            timestamp: new Date().toLocaleString()
        }, ...prev]);
        if(onCardUpdate) onCardUpdate();
    } catch (e) {
        alert("Erro ao mudar contexto");
    }
  };

  const handleTransfer = async () => {
      if(!transferDeptId || !transferColId || !card) return;

      try {
          await backendService.moveCard(card.id, transferColId);
          const deptName = departments.find(d => d.id === transferDeptId)?.name;
          alert(`Sucesso! Card transferido para ${deptName}.`);
          if(onCardUpdate) onCardUpdate();
          onClose(); // Close modal as card is effectively gone from current view
      } catch (error: any) {
          alert(`Erro na transferência: ${error.message}`);
      }
  };

  // --- SCHEDULING & NOTIFICATION LOGIC ---

  const handleSaveSchedule = async (type: 'reminder' | 'notification') => {
      if(!card || !newSchedule.title || !newSchedule.date || !newSchedule.time) return;

      const scheduledAt = `${newSchedule.date}T${newSchedule.time}`;

      if (editingScheduleId) {
          // UPDATE EXISTING
          await backendService.updateSchedule(card.id, editingScheduleId, {
              title: newSchedule.title,
              description: newSchedule.description,
              scheduledAt: scheduledAt
          }, CURRENT_USER);

          setCard(prev => prev ? ({
              ...prev,
              schedules: prev.schedules?.map(s => s.id === editingScheduleId ? { 
                  ...s, 
                  title: newSchedule.title, 
                  description: newSchedule.description,
                  scheduledAt 
              } : s)
          }) : null);

          setAuditLogs(prev => [{
              id: Date.now().toString(),
              action: 'SCHEDULE_UPDATED',
              description: `Editado: "${newSchedule.title}"`,
              actor: CURRENT_USER,
              timestamp: new Date().toLocaleString()
          }, ...prev]);

      } else {
          // CREATE NEW
          const scheduleEntry: ScheduleEntry = {
              id: Date.now().toString(),
              type: type,
              status: 'pending',
              title: newSchedule.title,
              description: newSchedule.description,
              scheduledAt: scheduledAt,
              createdBy: CURRENT_USER
          };
          await backendService.addSchedule(card.id, scheduleEntry);
          
          setCard(prev => prev ? ({ ...prev, schedules: [scheduleEntry, ...(prev.schedules || [])] }) : null);
          setAuditLogs(prev => [{
              id: Date.now().toString(),
              action: 'SCHEDULE_CREATED',
              description: `Novo ${type === 'notification' ? 'envio' : 'agendamento'}: "${newSchedule.title}"`,
              actor: CURRENT_USER,
              timestamp: new Date().toLocaleString()
          }, ...prev]);
      }

      setShowScheduleForm(false);
      setEditingScheduleId(null);
      setNewSchedule({title: '', description: '', date: '', time: ''});
  };

  const handleEditSchedule = (s: ScheduleEntry) => {
      const dateObj = new Date(s.scheduledAt);
      // Format YYYY-MM-DD
      const dateStr = dateObj.toISOString().split('T')[0];
      // Format HH:MM
      const timeStr = dateObj.toTimeString().substring(0, 5);

      setNewSchedule({
          title: s.title,
          description: s.description || '',
          date: dateStr,
          time: timeStr
      });
      setEditingScheduleId(s.id);
      setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
      if(!card || !confirm("Tem certeza que deseja excluir este item?")) return;
      
      await backendService.deleteSchedule(card.id, scheduleId, CURRENT_USER);
      setCard(prev => prev ? ({
          ...prev,
          schedules: prev.schedules?.filter(s => s.id !== scheduleId)
      }) : null);
      
      setAuditLogs(prev => [{
          id: Date.now().toString(),
          action: 'SCHEDULE_DELETED',
          description: `Item excluído da agenda`,
          actor: CURRENT_USER,
          timestamp: new Date().toLocaleString()
      }, ...prev]);
  };

  const handleTriggerNow = async (scheduleId: string, title: string) => {
      if(!card || !confirm(`Deseja enviar a notificação "${title}" agora?`)) return;

      await backendService.triggerScheduleNow(card.id, scheduleId, CURRENT_USER);
      
      setCard(prev => prev ? ({
          ...prev,
          schedules: prev.schedules?.map(s => s.id === scheduleId ? { ...s, status: 'sent', resolvedBy: CURRENT_USER } : s)
      }) : null);

      setAuditLogs(prev => [{
          id: Date.now().toString(),
          action: 'NOTIFICATION_SENT',
          description: `Disparo manual: "${title}"`,
          actor: CURRENT_USER,
          timestamp: new Date().toLocaleString()
      }, ...prev]);
      
      alert("Notificação enviada com sucesso!");
  };

  const handleResolveSchedule = async (scheduleId: string, title: string) => {
      if(!card) return;

      await backendService.resolveSchedule(card.id, scheduleId, CURRENT_USER);

      const updatedSchedules = card.schedules?.map(s => 
          s.id === scheduleId 
          ? { ...s, status: 'completed' as const, resolvedBy: CURRENT_USER, resolvedAt: new Date().toISOString() } 
          : s
      );
      setCard({...card, schedules: updatedSchedules});

      setAuditLogs(prev => [{
          id: Date.now().toString(),
          action: 'SCHEDULE_RESOLVED',
          description: `Lembrete resolvido: "${title}"`,
          actor: CURRENT_USER,
          timestamp: new Date().toLocaleString()
      }, ...prev]);
  };

  const handleAssignToMe = async () => {
      if(!card) return;
      await backendService.assignCard(card.id, 999, 'Supervisor Admin');
      setCard({
          ...card,
          assignee: { id: 999, name: 'Supervisor Admin', email: 'admin@sys.com', avatar_url: '' }
      });
      if(onCardUpdate) onCardUpdate();
  };

  const transferColumns = allColumns.filter(c => c.departmentId === transferDeptId);

  if (loading || !card) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl animate-pulse flex flex-col items-center">
           <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
           <p className="text-sm text-gray-500">Carregando detalhes do ticket...</p>
        </div>
      </div>
    );
  }

  const currentColumn = allColumns.find(c => c.id === card.columnId);

  // Helper to render schedule items
  const renderScheduleList = (type: 'reminder' | 'notification') => {
      const items = card.schedules?.filter(s => s.type === type) || [];
      
      if (items.length === 0) {
          return (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg bg-gray-50">
                {type === 'reminder' ? 'Nenhum compromisso agendado.' : 'Nenhuma notificação programada.'}
            </div>
          );
      }

      return (
        <div className="space-y-3">
            {items.map(schedule => {
                const isCompleted = schedule.status === 'completed';
                const isSent = schedule.status === 'sent';
                const isLocked = isCompleted || isSent; // Can't edit if done
                
                return (
                    <div key={schedule.id} className={`flex items-start p-3 border rounded-lg shadow-sm transition-all group ${
                        isLocked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}>
                        {/* ICON */}
                        <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                            schedule.type === 'notification' 
                                ? (isSent ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-600') 
                                : (isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-amber-100 text-amber-600')
                        }`}>
                            {isCompleted ? <CheckCircle2 size={16} /> : (schedule.type === 'notification' ? <Send size={16} /> : <Clock size={16} />)}
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h5 className={`text-sm font-bold truncate ${isLocked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                    {schedule.title}
                                </h5>
                                
                                {/* STATUS BADGE */}
                                <div className="flex items-center space-x-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        schedule.status === 'sent' ? 'bg-gray-200 text-gray-600' 
                                        : isCompleted ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                        {schedule.status === 'pending' ? 'Pendente' : (schedule.status === 'completed' ? 'Resolvido' : 'Enviado')}
                                    </span>
                                </div>
                            </div>
                            
                            {/* DESCRIPTION / BODY */}
                            {schedule.description && (
                                <p className={`text-xs mt-1 mb-1.5 line-clamp-2 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {schedule.description}
                                </p>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                                <Calendar size={10} className="mr-1"/>
                                {new Date(schedule.scheduledAt).toLocaleString('pt-BR')}
                            </p>
                            
                            {/* METADATA */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <div className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 flex items-center">
                                    <User size={8} className="mr-1"/>
                                    Criado: {schedule.createdBy}
                                </div>
                                
                                {(isCompleted || isSent) && schedule.resolvedBy && (
                                    <div className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 flex items-center">
                                        <CheckCircle2 size={8} className="mr-1"/>
                                        {isSent ? 'Disparado por: ' : 'Resolvido por: '}{schedule.resolvedBy}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ACTIONS BAR (Visible on Hover or if active) */}
                        {!isLocked && (
                            <div className="ml-3 flex flex-col space-y-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                
                                {/* 1. RESOLVE / SEND NOW */}
                                {type === 'reminder' ? (
                                    <button 
                                        onClick={() => handleResolveSchedule(schedule.id, schedule.title)}
                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                                        title="Concluir"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleTriggerNow(schedule.id, schedule.title)}
                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                                        title="Enviar Agora"
                                    >
                                        <Zap size={16} />
                                    </button>
                                )}

                                {/* 2. EDIT */}
                                <button 
                                    onClick={() => handleEditSchedule(schedule)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>

                                {/* 3. DELETE */}
                                <button 
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      );
  };

  const renderAddForm = (type: 'reminder' | 'notification') => (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 mb-4 relative">
        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            {editingScheduleId ? 'Editar Item' : (type === 'reminder' ? 'Novo Compromisso' : 'Programar Envio')}
        </h5>
        
        {/* Date & Time Row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Data</label>
                <input 
                    type="date" 
                    className="w-full text-sm rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Hora</label>
                <input 
                    type="time" 
                    className="w-full text-sm rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                />
            </div>
        </div>

        {/* Title Input */}
        <div className="mb-3">
            <label className="block text-xs font-bold text-gray-600 mb-1">
                {type === 'reminder' ? 'Título da Tarefa' : 'Título da Notificação'}
            </label>
            <input 
                type="text" 
                className="w-full text-sm rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" 
                placeholder={type === 'reminder' ? "Ex: Ligar para confirmar" : "Ex: Lembrete de Vencimento"}
                value={newSchedule.title}
                onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
            />
        </div>

        {/* Description Textarea */}
        <div className="mb-3">
            <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center justify-between">
                <span>{type === 'reminder' ? 'Detalhes / Observações' : 'Mensagem (Conteúdo)'}</span>
                {type === 'notification' && <span className="text-[10px] text-gray-400 font-normal">Será enviado ao cliente</span>}
            </label>
            <textarea 
                className="w-full text-sm rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-2" 
                rows={3}
                placeholder={type === 'reminder' ? "Detalhes adicionais..." : "Olá, gostaríamos de lembrar que..."}
                value={newSchedule.description}
                onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})}
            />
        </div>

        <div className="flex justify-end space-x-2">
            <button 
                onClick={() => {
                    setShowScheduleForm(false);
                    setEditingScheduleId(null);
                    setNewSchedule({title: '', description: '', date: '', time: ''});
                }}
                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded"
            >
                Cancelar
            </button>
            <button 
                onClick={() => handleSaveSchedule(type)}
                disabled={!newSchedule.title || !newSchedule.date || !newSchedule.time}
                className={`px-3 py-1.5 text-xs text-white rounded font-medium disabled:bg-gray-300 transition-colors ${
                    type === 'notification' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {editingScheduleId ? 'Salvar Alterações' : (type === 'reminder' ? 'Salvar Compromisso' : 'Agendar Envio')}
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
            <div>
                <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-800">{card.customerName}</h2>
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded font-mono border border-slate-300">
                        {card.protocolNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border uppercase font-bold ${
                        card.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                        {card.priority}
                    </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{card.assignee?.name || 'Não atribuído'}</span>
                        {!card.assignee && (
                            <button 
                                onClick={handleAssignToMe}
                                className="ml-2 flex items-center text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition"
                            >
                                <UserPlus size={10} className="mr-1"/>
                                Assumir
                            </button>
                        )}
                        {card.assignee?.id !== 999 && card.assignee && (
                             <button 
                                onClick={handleAssignToMe}
                                className="ml-2 flex items-center text-[10px] border border-gray-300 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-100 transition"
                            >
                                Trocar
                            </button>
                        )}
                    </div>
                    <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(card.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                       <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                       <span className="font-medium text-gray-700">{currentColumn?.title}</span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Body Layout */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Left Column: Chat Preview & Quick Actions */}
            <div className="w-2/5 border-r border-gray-200 flex flex-col bg-slate-50">
                <div className="p-3 border-b border-gray-200 bg-white shadow-sm flex items-center text-gray-600 font-medium text-sm">
                    <MessageSquare size={16} className="mr-2" />
                    Preview da Conversa
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 italic">Nenhuma mensagem registrada.</div>
                    ) : (
                        chatHistory.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.senderType === 'agent' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${
                                    msg.senderType === 'agent' 
                                        ? 'bg-blue-100 text-blue-900 rounded-tr-none' 
                                        : msg.senderType === 'system'
                                            ? 'bg-gray-200 text-gray-600 text-xs italic w-full text-center'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                </div>
                                {msg.senderType !== 'system' && (
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                        {msg.timestamp} - {msg.senderType === 'agent' ? 'Agente' : 'Cliente'}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Internal Note Input */}
                <div className="p-3 bg-white border-t border-gray-200">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Adicionar nota interna..." 
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata Tabs */}
            <div className="w-3/5 flex flex-col bg-white">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        title="Detalhes"
                    >
                        <FileText size={16} />
                        <span>Detalhes</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('checklist')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === 'checklist' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        title="Checklist"
                    >
                        <CheckSquare size={16} />
                        <span>Checklist</span>
                    </button>
                    {/* Split Tabs: Agenda & Notifications */}
                    <button 
                        onClick={() => setActiveTab('agenda')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === 'agenda' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        title="Agenda"
                    >
                        <CalendarClock size={16} />
                        <span>Agenda</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === 'notifications' ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        title="Notificações"
                    >
                        <Bell size={16} />
                        <span>Notificações</span>
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('transfer')}
                         className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === 'transfer' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                         title="Transferir"
                    >
                         <ArrowRightLeft size={16} />
                         <span>Transferir</span>
                    </button>
                    {/* UPDATED: History Tab with Icon Only */}
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`py-3 px-4 text-sm font-medium flex items-center justify-center border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        title="Auditoria"
                    >
                        <History size={16} />
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Context Switcher Section */}
                            <div className={`p-4 rounded-lg border-2 ${card.selectedCompany ? 'border-blue-100 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
                                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <Building2 size={16} className="mr-2" />
                                    Empresa (Contexto Jurídico)
                                </h4>
                                
                                {card.selectedCompany ? (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-blue-900">{card.selectedCompany.name}</p>
                                            <p className="text-xs text-blue-700 font-mono">{card.selectedCompany.cnpj} • {card.selectedCompany.taxRegime}</p>
                                        </div>
                                        <button 
                                            onClick={() => setCard({...card, selectedCompanyId: undefined, selectedCompany: undefined})}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Alterar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center text-amber-700 text-xs mb-2">
                                            <AlertTriangle size={14} className="mr-1" />
                                            <span>Selecione uma empresa para liberar ações no ticket.</span>
                                        </div>
                                        <select 
                                            className="w-full text-sm border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                                            onChange={(e) => handleContextChange(e.target.value)}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Selecione a empresa...</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.cnpj})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Custom Attributes Grid */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">Atributos Customizados</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(card.customAttributes).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <span className="block text-[10px] uppercase text-gray-500 font-semibold tracking-wider">{key.replace(/_/g, ' ')}</span>
                                            <span className="block text-sm font-medium text-gray-800">{String(value)}</span>
                                        </div>
                                    ))}
                                    {Object.keys(card.customAttributes).length === 0 && (
                                        <span className="text-gray-400 text-sm italic col-span-2">Nenhum atributo adicional.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'checklist' && (
                        <div>
                             <h4 className="text-sm font-bold text-gray-700 mb-2">Checklist da Etapa: {currentColumn?.title}</h4>
                             <p className="text-xs text-gray-500 mb-4">Itens obrigatórios bloqueiam a movimentação para a próxima coluna.</p>
                             
                             <div className="space-y-2">
                                {currentColumn?.checklist?.map(item => {
                                    const isChecked = card.completedChecklistIds?.includes(item.id);
                                    return (
                                        <label key={item.id} className={`flex items-start p-3 rounded border transition-all cursor-pointer ${
                                            isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300'
                                        }`}>
                                            <div className="relative flex items-center h-5">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleChecklist(item.id)}
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <span className={`font-medium ${isChecked ? 'text-green-800 line-through opacity-70' : 'text-gray-700'}`}>
                                                    {item.text}
                                                </span>
                                                {item.required && (
                                                    <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                                        Obrigatório
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                                {!currentColumn?.checklist && (
                                    <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
                                        Nenhum checklist configurado para esta etapa.
                                    </div>
                                )}
                             </div>
                        </div>
                    )}

                    {/* AGENDA TAB (Internal Reminders) */}
                    {activeTab === 'agenda' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center">
                                        <CalendarClock size={18} className="mr-2 text-amber-500" />
                                        Agenda de Retornos
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">Compromissos e retornos pendentes para este cliente.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowScheduleForm(!showScheduleForm);
                                        setEditingScheduleId(null);
                                        setNewSchedule({title: '', description: '', date: '', time: ''});
                                    }}
                                    className="flex items-center text-xs bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition shadow-sm"
                                >
                                    <Plus size={14} className="mr-1" />
                                    Novo Compromisso
                                </button>
                            </div>

                            {showScheduleForm && renderAddForm('reminder')}
                            {renderScheduleList('reminder')}
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB (Outbound Automation) */}
                    {activeTab === 'notifications' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center">
                                        <Bell size={18} className="mr-2 text-green-600" />
                                        Notificações Programadas
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">Mensagens automáticas que serão enviadas ao cliente via WhatsApp.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowScheduleForm(!showScheduleForm);
                                        setEditingScheduleId(null);
                                        setNewSchedule({title: '', description: '', date: '', time: ''});
                                    }}
                                    className="flex items-center text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition shadow-sm"
                                >
                                    <Plus size={14} className="mr-1" />
                                    Nova Notificação
                                </button>
                            </div>

                            {showScheduleForm && renderAddForm('notification')}
                            {renderScheduleList('notification')}
                        </div>
                    )}

                    {activeTab === 'transfer' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-900 mb-1 flex items-center">
                                    <ArrowRightLeft size={18} className="mr-2" />
                                    Transferência de Departamento
                                </h4>
                                <p className="text-xs text-blue-700">Mover este ticket para outro quadro Kanban (outro setor).</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecione o Departamento de Destino</label>
                                    <select 
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={transferDeptId}
                                        onChange={(e) => {
                                            setTransferDeptId(e.target.value);
                                            setTransferColId(''); // Reset column
                                        }}
                                    >
                                        <option value="">Selecione...</option>
                                        {departments.filter(d => d.id !== currentColumn?.departmentId).map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {transferDeptId && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">2. Selecione a Coluna de Entrada</label>
                                        <select 
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={transferColId}
                                            onChange={(e) => setTransferColId(e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {transferColumns.map(col => (
                                                <option key={col.id} value={col.id}>{col.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button 
                                        disabled={!transferDeptId || !transferColId}
                                        onClick={handleTransfer}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow transition-colors flex items-center justify-center"
                                    >
                                        Confirmar Transferência
                                        <ArrowRight size={18} className="ml-2" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                            {auditLogs.map((log, idx) => (
                                <div key={log.id} className="ml-6 relative">
                                    <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white">
                                         <span className="h-3 w-3 rounded-full bg-blue-300" />
                                    </span>
                                    <div className="flex justify-between items-start">
                                        {/* Translated Action Name */}
                                        <h3 className="flex items-center text-sm font-semibold text-gray-900">
                                            {ACTION_TRANSLATION[log.action] || log.action}
                                        </h3>
                                        <time className="block mb-1 text-xs font-normal leading-none text-gray-400">{log.timestamp}</time>
                                    </div>
                                    <p className="mb-1 text-sm font-normal text-gray-500">{log.description}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {log.actor}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
