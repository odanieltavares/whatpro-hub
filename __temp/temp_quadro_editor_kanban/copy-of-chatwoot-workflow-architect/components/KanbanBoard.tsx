import React, { useEffect, useState } from 'react';
import { backendService } from '../services/mockBackend';
import { KanbanCard, WorkflowColumn, CardPriority, ClientCompany, Department } from '../types';
import { CardDetailModal } from './CardDetailModal';
import { MoreHorizontal, MessageSquare, AlertTriangle, User as UserIcon, Building2, FileText, CheckSquare, Layers, Eye } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  
  const [columns, setColumns] = useState<WorkflowColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [companies, setCompanies] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // New State for Modal
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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

  const getPriorityColor = (priority: CardPriority) => {
    switch(priority) {
      case CardPriority.URGENT: return 'bg-red-100 text-red-700 border-red-200';
      case CardPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
      case CardPriority.MEDIUM: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
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

      {/* Error Toast */}
      {errorMsg && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center animate-bounce">
              <AlertTriangle className="mr-2" size={20} />
              <span className="font-medium">{errorMsg}</span>
          </div>
      )}

      {/* Department Tabs */}
      <div className="px-6 pt-4 pb-0">
          <div className="flex items-center space-x-1 bg-gray-200/50 p-1 rounded-lg w-fit">
              {departments.map(dept => (
                  <button
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                          selectedDeptId === dept.id 
                              ? 'bg-white text-blue-700 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                  >
                      <Layers size={14} />
                      <span>{dept.name}</span>
                  </button>
              ))}
          </div>
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
                    className="flex flex-col w-80 bg-gray-100/80 rounded-xl border border-gray-200 shadow-sm max-h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    >
                    {/* Column Header - WITH DYNAMIC COLOR */}
                    <div className={`p-3 border-b border-gray-200 bg-white/60 backdrop-blur-sm rounded-t-xl sticky top-0 z-10 border-t-4 ${col.color ? col.color.replace('bg-', 'border-') : 'border-slate-400'}`}>
                        <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-800">{col.title}</h3>
                            <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {colCards.length}
                            </span>
                        </div>
                        <MoreHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                        </div>
                        {/* V2 Checklist Indicator */}
                        {col.checklist && (
                        <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 mt-1">
                            <CheckSquare size={12} />
                            <span>Checklist Obrigatório ({col.checklist.length} itens)</span>
                        </div>
                        )}
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 kanban-scroll">
                        {colCards.map(card => {
                            // Find context for Tags
                            const cardCol = columns.find(c => c.id === card.columnId);
                            const cardDept = departments.find(d => d.id === cardCol?.departmentId);

                            return (
                                <div
                                    key={card.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, card.id)}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer active:cursor-grabbing hover:shadow-md hover:ring-2 hover:ring-blue-400/50 transition-all group relative border-l-4 border-l-transparent hover:border-l-blue-500"
                                >
                                    {/* Header: Protocol & Priority */}
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 flex items-center">
                                            <FileText size={8} className="mr-1"/>
                                            {card.protocolNumber}
                                        </span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide ${getPriorityColor(card.priority)}`}>
                                        {card.priority}
                                    </span>
                                    </div>

                                    {/* Content */}
                                    <h4 className="font-bold text-gray-800 text-sm mb-0.5">{card.customerName}</h4>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{card.description}</p>

                                    {/* V2: Context Switcher / Display */}
                                    <div className="mb-2">
                                        {card.selectedCompany ? (
                                            <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1.5 rounded border border-blue-100 flex flex-col" title={card.selectedCompany.cnpj}>
                                                <div className="flex items-center mb-0.5">
                                                    <Building2 size={12} className="mr-1.5 flex-shrink-0" />
                                                    <span className="truncate font-medium">{card.selectedCompany.name}</span>
                                                </div>
                                                {/* Added CNPJ Display */}
                                                <div className="pl-4 text-[10px] opacity-80 font-mono">
                                                    {card.selectedCompany.cnpj}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative group/ctx">
                                                <button className="w-full bg-red-50 text-red-600 text-xs px-2 py-1.5 rounded border border-red-100 flex items-center justify-between hover:bg-red-100 transition-colors animate-pulse">
                                                    <div className="flex items-center">
                                                        <AlertTriangle size={12} className="mr-1.5" />
                                                        <span className="font-bold">Contexto Pendente</span>
                                                    </div>
                                                    <span className="text-[10px]">Selecionar ▼</span>
                                                </button>
                                                {/* Dropdown Simulation */}
                                                <div className="hidden group-hover/ctx:block absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded-md z-20 mt-1 overflow-hidden">
                                                    {companies.map(comp => (
                                                        <div 
                                                            key={comp.id}
                                                            onClick={(e) => handleContextSelect(e, card.id, comp.id)}
                                                            className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer border-b last:border-0 border-gray-100"
                                                        >
                                                            <div className="font-medium text-gray-800">{comp.name}</div>
                                                            <div className="text-[10px] text-gray-500">{comp.cnpj}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* VISUAL TAG: Dept | Column (Moved Below Context) */}
                                    <div className="mb-3 flex items-center space-x-1">
                                        <div className="flex items-center text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 w-full">
                                            <Eye size={10} className="mr-1 flex-shrink-0" />
                                            <div className="flex items-center truncate">
                                                <span className="font-semibold mr-1">{cardDept?.name}</span>
                                                <span className="text-gray-300 mx-1">|</span>
                                                <span className="truncate">{cardCol?.title}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metadata Footer */}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                    <div className="flex items-center space-x-2 text-gray-400">
                                        <MessageSquare size={14} />
                                        <span className="text-[10px]">#{card.conversationId}</span>
                                    </div>
                                    
                                    {card.assignee ? (
                                        <div className="flex items-center space-x-1.5">
                                            <span className="text-[10px] text-gray-500">{card.assignee.name.split(' ')[0]}</span>
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold border border-white">
                                                {card.assignee.name.charAt(0)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center border border-white">
                                        <UserIcon size={12} />
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
