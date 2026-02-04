
import React, { useEffect, useState, useRef } from 'react';
import { backendService } from '../services/mockBackend';
import { KanbanCard, WorkflowColumn, CardPriority, ClientCompany, Department, CardViewSettings } from '../types';
import { CardDetailModal } from './CardDetailModal';
import { MoreHorizontal, MessageSquare, AlertTriangle, User as UserIcon, Building2, FileText, CheckSquare, Layers, Eye, SlidersHorizontal, Trash2, Edit2, X, Clock, Tag, CreditCard, Hash } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  
  const [columns, setColumns] = useState<WorkflowColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Modals & Selection
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // UI State: Card Menus & View Settings
  const [menuOpenCardId, setMenuOpenCardId] = useState<string | null>(null);
  const [showFieldCustomizer, setShowFieldCustomizer] = useState(false);
  
  // Default View Settings
  const [viewSettings, setViewSettings] = useState<CardViewSettings>({
      showId: true,
      showDescription: true,
      showTags: true,
      showPriority: true,
      showAssignee: true,
      showContext: true,
      showTime: true,
      showCustomerData: true // Default ON for customer info
  });

  // Close menus when clicking outside
  useEffect(() => {
      const handleClickOutside = () => setMenuOpenCardId(null);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchBoardData = async () => {
      const fetchedCards = await backendService.getCards();
      setCards(fetchedCards);
  };

  useEffect(() => {
    const init = async () => {
      const fetchedDepts = backendService.getDepartments();
      setDepartments(fetchedDepts);
      if (fetchedDepts.length > 0) {
        setSelectedDeptId(fetchedDepts[0].id);
      }

      setColumns(backendService.getColumns());
      await fetchBoardData();
      setCompanies(backendService.getCompanies());
      setLoading(false);
    };
    init();
  }, []);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedCardId) return;
    setErrorMsg(null);

    const originalCards = [...cards];
    const card = cards.find(c => c.id === draggedCardId);
    const targetCol = columns.find(c => c.id === targetColumnId);

    // Front-end Validation for Context
    if (card && !card.selectedCompanyId && targetCol?.stage !== 'triage') {
        setErrorMsg("⚠️ Ação Bloqueada: Selecione uma empresa para vincular ao Ticket antes de prosseguir.");
        setTimeout(() => setErrorMsg(null), 4000);
        return;
    }

    // Optimistic Update
    setCards(prev => prev.map(c => 
      c.id === draggedCardId ? { ...c, columnId: targetColumnId } : c
    ));
    setDraggedCardId(null);

    try {
      await backendService.moveCard(draggedCardId, targetColumnId);
    } catch (error: any) {
      console.error("Failed to move card", error);
      setCards(originalCards);
      setErrorMsg(error.message || "Erro ao mover card");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleContextSelect = async (e: React.MouseEvent, cardId: string, companyId: string) => {
      e.stopPropagation(); // Prevent opening modal
      try {
          await backendService.setCardContext(cardId, companyId);
          // Local update
          const company = companies.find(c => c.id === companyId);
          setCards(prev => prev.map(c => c.id === cardId ? { ...c, selectedCompanyId: companyId, selectedCompany: company } : c));
      } catch (e) {
          alert("Erro ao definir contexto");
      }
  };

  // Translated Priorities Map
  const PRIORITY_CONFIG: Record<string, { label: string, classes: string }> = {
      [CardPriority.URGENT]: { label: 'Urgente', classes: 'bg-red-100 text-red-700 border-red-200 ring-red-500/20' },
      [CardPriority.HIGH]:   { label: 'Alta',    classes: 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500/20' },
      [CardPriority.MEDIUM]: { label: 'Média',   classes: 'bg-yellow-100 text-yellow-700 border-yellow-200 ring-yellow-500/20' },
      [CardPriority.LOW]:    { label: 'Baixa',   classes: 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500/20' },
      [CardPriority.NONE]:   { label: 'Nenhuma', classes: 'bg-gray-100 text-gray-500 border-gray-200 ring-gray-500/20' },
  };

  const getPriorityConfig = (priority: string) => {
      return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['none'];
  };

  // Filter columns based on selected Department
  const visibleColumns = columns
    .filter(c => c.departmentId === selectedDeptId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando fluxo Enterprise...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Detail Modal */}
      {selectedCardId && (
          <CardDetailModal 
            cardId={selectedCardId} 
            onClose={() => setSelectedCardId(null)} 
            allColumns={columns}
            onCardUpdate={fetchBoardData} // Pass callback to refresh board
          />
      )}

      {/* Field Customizer Modal */}
      {showFieldCustomizer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={() => setShowFieldCustomizer(false)}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center p-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-800">Personalizar Campos do Card</h3>
                      <button onClick={() => setShowFieldCustomizer(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                      <label className="flex items-start space-x-3 cursor-pointer group">
                          <input type="checkbox" checked={viewSettings.showDescription} onChange={() => setViewSettings(prev => ({...prev, showDescription: !prev.showDescription}))} 
                                 className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                          <div>
                              <span className="block font-medium text-gray-700 group-hover:text-blue-600">Descrição</span>
                              <span className="text-xs text-gray-400">Detalhes do card</span>
                          </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer group">
                          <input type="checkbox" checked={viewSettings.showTags} onChange={() => setViewSettings(prev => ({...prev, showTags: !prev.showTags}))}
                                 className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                          <div>
                              <span className="block font-medium text-gray-700 group-hover:text-blue-600">Etiquetas</span>
                              <span className="text-xs text-gray-400">Tags da conversa</span>
                          </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer group">
                          <input type="checkbox" checked={viewSettings.showPriority} onChange={() => setViewSettings(prev => ({...prev, showPriority: !prev.showPriority}))}
                                 className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                          <div>
                              <span className="block font-medium text-gray-700 group-hover:text-blue-600">Prioridade</span>
                              <span className="text-xs text-gray-400">Alta, Média, Baixa</span>
                          </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer group">
                          <input type="checkbox" checked={viewSettings.showContext} onChange={() => setViewSettings(prev => ({...prev, showContext: !prev.showContext}))}
                                 className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                          <div>
                              <span className="block font-medium text-gray-700 group-hover:text-blue-600">Contexto</span>
                              <span className="text-xs text-gray-400">Empresa vinculada</span>
                          </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer group">
                          <input type="checkbox" checked={viewSettings.showCustomerData} onChange={() => setViewSettings(prev => ({...prev, showCustomerData: !prev.showCustomerData}))}
                                 className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                          <div>
                              <span className="block font-medium text-gray-700 group-hover:text-blue-600">Dados do Cliente</span>
                              <span className="text-xs text-gray-400">CPF/CNPJ e Código</span>
                          </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer group">
                          <input type="checkbox" checked={viewSettings.showAssignee} onChange={() => setViewSettings(prev => ({...prev, showAssignee: !prev.showAssignee}))}
                                 className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                          <div>
                              <span className="block font-medium text-gray-700 group-hover:text-blue-600">Agente</span>
                              <span className="text-xs text-gray-400">Responsável atribuído</span>
                          </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer group">
                          <input type="checkbox" checked={viewSettings.showId} onChange={() => setViewSettings(prev => ({...prev, showId: !prev.showId}))}
                                 className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                          <div>
                              <span className="block font-medium text-gray-700 group-hover:text-blue-600">Metadados</span>
                              <span className="text-xs text-gray-400">Protocolo e ID</span>
                          </div>
                      </label>
                  </div>
                  <div className="p-4 bg-gray-50 flex justify-between items-center">
                      <button className="text-xs text-gray-500 hover:text-gray-800 underline">Restaurar padrão</button>
                      <button onClick={() => setShowFieldCustomizer(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center animate-bounce">
              <AlertTriangle className="mr-2" size={20} />
              <span className="font-medium">{errorMsg}</span>
          </div>
      )}

      {/* Header & Department Tabs */}
      <div className="px-6 pt-4 pb-2 flex flex-col md:flex-row md:justify-between md:items-end space-y-4 md:space-y-0">
          <div className="flex-1 overflow-x-auto scrollbar-none">
            <div className="flex items-center space-x-1 bg-gray-200/50 p-1 rounded-lg w-fit">
                {departments.map(dept => (
                    <button
                        key={dept.id}
                        onClick={() => setSelectedDeptId(dept.id)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-2 flex-shrink-0 whitespace-nowrap ${
                            selectedDeptId === dept.id 
                                ? 'bg-white text-blue-700 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <Layers size={14} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">{dept.name}</span>
                    </button>
                ))}
            </div>
          </div>
          
          <button 
             onClick={() => setShowFieldCustomizer(true)}
             className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded hover:bg-white hover:shadow-sm transition-all flex-shrink-0 md:ml-4"
          >
              <SlidersHorizontal size={16} />
              <span className="whitespace-nowrap">Personalizar Cards</span>
          </button>
      </div>

      {/* Kanban Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full space-x-6 min-w-max">
            {visibleColumns.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                    <p>Nenhuma coluna configurada para este departamento.</p>
                </div>
            ) : (
                visibleColumns.map(col => {
                const colCards = cards.filter(c => c.columnId === col.id);
                
                return (
                    <div 
                        key={col.id} 
                        className="flex flex-col w-[340px] bg-slate-100/80 rounded-xl border border-gray-200/60 shadow-sm max-h-full"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                    {/* Column Header */}
                    <div className={`px-4 py-3 bg-white/50 backdrop-blur-sm rounded-t-xl sticky top-0 z-10 border-t-[3px] ${col.color ? col.color.replace('bg-', 'border-') : 'border-slate-400'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-slate-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{col.title}</h3>
                                <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                {colCards.length}
                                </span>
                            </div>
                            <MoreHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-gray-600 flex-shrink-0" />
                        </div>
                        {col.checklist && (
                            <div className="flex items-center space-x-1 text-[10px] font-medium text-blue-600 mt-1">
                                <CheckSquare size={10} className="flex-shrink-0" />
                                <span className="whitespace-nowrap">Checklist Obrigatório</span>
                            </div>
                        )}
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 kanban-scroll">
                        {colCards.map(card => {
                            const isMenuOpen = menuOpenCardId === card.id;
                            const priorityConfig = getPriorityConfig(card.priority);
                            
                            return (
                                <div
                                    key={card.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, card.id)}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className="relative group bg-white p-3.5 rounded-lg shadow-sm border border-gray-200 cursor-pointer active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all"
                                >
                                    {/* Three Dots Menu Button */}
                                    <div className={`absolute top-2 right-2 z-20 ${isMenuOpen ? 'block' : 'hidden group-hover:block'}`}>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenCardId(isMenuOpen ? null : card.id);
                                            }}
                                            className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-colors"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        
                                        {/* Dropdown Menu */}
                                        {isMenuOpen && (
                                            <div 
                                                className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-30 animate-in fade-in zoom-in-95"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="py-1">
                                                    <button onClick={() => { setSelectedCardId(card.id); setMenuOpenCardId(null); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center">
                                                        <Edit2 size={12} className="mr-2" /> Editar
                                                    </button>
                                                    <button onClick={() => { setShowFieldCustomizer(true); setMenuOpenCardId(null); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center">
                                                        <Eye size={12} className="mr-2" /> Campos
                                                    </button>
                                                    <div className="border-t border-gray-100 my-1"></div>
                                                    <button className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center">
                                                        <Trash2 size={12} className="mr-2" /> Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* --- CARD CONTENT --- */}
                                    
                                    {/* Header: Priority (PT-BR) & ID */}
                                    <div className="flex items-center space-x-2 mb-2 pr-6">
                                        {viewSettings.showPriority && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-extrabold tracking-wider whitespace-nowrap ${priorityConfig.classes}`}>
                                                {priorityConfig.label}
                                            </span>
                                        )}
                                        {viewSettings.showId && (
                                            <span className="text-[10px] text-gray-400 font-mono tracking-tight bg-gray-50 px-1 rounded whitespace-nowrap">
                                                {card.protocolNumber}
                                            </span>
                                        )}
                                    </div>

                                    {/* Title (Name) */}
                                    <h4 className="font-bold text-gray-800 text-sm mb-1 leading-snug">{card.customerName}</h4>

                                    {/* NEW: Customer Data Fields (CPF/CNPJ & Code) */}
                                    {viewSettings.showCustomerData && (card.customerDocument || card.customerCode) && (
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-[10px] text-gray-500">
                                            {card.customerDocument && (
                                                <div className="flex items-center whitespace-nowrap" title="CPF/CNPJ">
                                                    <CreditCard size={10} className="mr-1 text-gray-400 flex-shrink-0" />
                                                    <span className="font-mono tracking-tight">{card.customerDocument}</span>
                                                </div>
                                            )}
                                            {card.customerCode && (
                                                <div className="flex items-center whitespace-nowrap" title="Código de Cadastro">
                                                    <Hash size={10} className="mr-1 text-gray-400 flex-shrink-0" />
                                                    <span className="font-medium text-gray-600">{card.customerCode}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Description (Collapsible) */}
                                    {viewSettings.showDescription && card.description && (
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                                            {card.description}
                                        </p>
                                    )}

                                    {/* Tags (Visible Label Style) */}
                                    {viewSettings.showTags && card.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {card.tags.map(tag => (
                                                <span key={tag} className="flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap">
                                                    <Tag size={10} className="mr-1 opacity-50 flex-shrink-0" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Context Switcher (Collapsible) */}
                                    {viewSettings.showContext && (
                                        <div className="mb-3">
                                            {card.selectedCompany ? (
                                                <div className="flex items-center text-xs text-blue-700 bg-blue-50/50 px-2 py-1 rounded border border-blue-100/50" title={card.selectedCompany.cnpj}>
                                                    <Building2 size={12} className="mr-1.5 flex-shrink-0 opacity-70" />
                                                    <span className="truncate font-medium max-w-[180px]">{card.selectedCompany.name}</span>
                                                </div>
                                            ) : (
                                                <div className="relative group/ctx" onClick={(e) => e.stopPropagation()}>
                                                    <button className="w-full bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-100 flex items-center hover:bg-red-100 transition-colors">
                                                        <AlertTriangle size={12} className="mr-1.5 flex-shrink-0" />
                                                        <span className="font-bold whitespace-nowrap">Sem Contexto</span>
                                                    </button>
                                                    {/* Dropdown Simulation */}
                                                    <div className="hidden group-hover/ctx:block absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded-md z-20 mt-1 overflow-hidden">
                                                        {companies.map(comp => (
                                                            <div key={comp.id} onClick={(e) => handleContextSelect(e, card.id, comp.id)} className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer border-b last:border-0 border-gray-100 whitespace-nowrap truncate">
                                                                <div className="font-medium truncate">{comp.name}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer: Assignee & Time */}
                                    <div className={`flex justify-between items-center pt-2 ${viewSettings.showAssignee || viewSettings.showTime ? 'border-t border-gray-50' : ''}`}>
                                        <div className="flex items-center space-x-2">
                                            {viewSettings.showAssignee && (
                                                card.assignee ? (
                                                    <div className="flex items-center space-x-1.5" title={card.assignee.name}>
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white shadow-sm flex-shrink-0">
                                                            {card.assignee.name.charAt(0)}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{card.assignee.name.split(' ')[0]}</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center border border-gray-200 flex-shrink-0">
                                                        <UserIcon size={10} />
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {viewSettings.showTime && (
                                            <div className="flex items-center text-[10px] text-gray-400 whitespace-nowrap">
                                                <Clock size={10} className="mr-1 flex-shrink-0" />
                                                <span>11m</span> 
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </div>
                );
                })
            )}
        </div>
      </div>
    </div>
  );
};
