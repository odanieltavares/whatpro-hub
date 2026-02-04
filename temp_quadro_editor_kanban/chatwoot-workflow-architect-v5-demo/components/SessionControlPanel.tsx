
import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/TicketService';
import { TicketSession, TicketStatus, TransferMode } from '../types';
import { PlayCircle, PauseCircle, CheckCircle, ArrowRightCircle, Layers, PhoneForwarded, ChevronRight, ChevronLeft, PanelRight } from 'lucide-react';

const DEPT_MAP: Record<string, string> = {
  'dept_fiscal': 'Fiscal',
  'dept_rh': 'RH',
  'dept_legal': 'Jurídico'
};

interface SessionControlPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const SessionControlPanel: React.FC<SessionControlPanelProps> = ({ isOpen, onToggle }) => {
  const [session, setSession] = useState<TicketSession>(ticketService.getSession());
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    return ticketService.subscribe(setSession);
  }, []);

  const activeTicket = ticketService.getActiveTicket();
  
  const getDuration = (startStr: string) => {
    const minutes = Math.floor((Date.now() - new Date(startStr).getTime()) / 60000);
    return `${minutes} min`;
  };

  const handleTransfer = (mode: TransferMode) => {
    const currentDept = activeTicket?.departmentId || 'dept_fiscal';
    const targetDept = currentDept === 'dept_fiscal' ? 'dept_rh' : 'dept_fiscal';
    
    ticketService.transferTicket(targetDept, mode);
    setShowTransferModal(false);
  };

  // Se o painel estiver fechado, mostra uma barra lateral fina e funcional
  if (!isOpen) {
    return (
      <div 
        className="h-full w-12 border-l border-gray-200 bg-white flex flex-col items-center py-4 space-y-6 flex-shrink-0 cursor-pointer hover:bg-gray-50 transition-colors group"
        onClick={onToggle}
      >
        <button className="text-gray-400 group-hover:text-blue-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center space-y-8">
           <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">
              Sessão Ativa
           </div>
           {activeTicket && (
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Sessão em andamento"></div>
           )}
           <PanelRight size={18} className="text-gray-300 group-hover:text-blue-400" />
        </div>
      </div>
    );
  }

  if (!activeTicket) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200 w-80 shadow-xl z-30 transition-all duration-300">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Painel de Sessão</h3>
            <button onClick={onToggle} className="text-gray-400 hover:text-gray-600">
               <ChevronRight size={18} />
            </button>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400 p-6">
                <CheckCircle size={40} className="mx-auto mb-4 text-green-500 opacity-20" />
                <p className="text-sm font-medium">Nenhum ticket ativo no seu fluxo agora.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 w-80 shadow-xl z-30 transition-all duration-300 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-start">
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Painel de Sessão</h3>
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-bold text-slate-800 truncate max-w-[180px]">{session.companyName}</span>
                </div>
            </div>
            <button onClick={onToggle} className="p-1 hover:bg-gray-200 rounded text-gray-400 transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>

        {/* Stack Visualizer */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50 scrollbar-thin">
            <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                <Layers size={14} />
                <span>Fluxo de Atendimento (Stack)</span>
            </div>

            <div className="space-y-3 flex flex-col-reverse">
                {session.ticketStack.map((ticket, index) => {
                    const isTop = index === session.ticketStack.length - 1;
                    return (
                        <div 
                            key={ticket.id}
                            className={`relative p-3 rounded-lg border shadow-sm transition-all duration-200 ${
                                isTop 
                                ? 'bg-white border-blue-200 ring-2 ring-blue-500/10 transform scale-100 z-10' 
                                : 'bg-gray-100 border-gray-200 text-gray-500 transform scale-95 opacity-80'
                            }`}
                        >
                            {/* Connector Line */}
                            {!isTop && (
                                <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-gray-300 -z-10"></div>
                            )}

                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isTop ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {DEPT_MAP[ticket.departmentId] || ticket.departmentId}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                    {getDuration(ticket.startedAt)}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-2">
                                {ticket.status === TicketStatus.ACTIVE && <PlayCircle size={14} className="text-green-500"/>}
                                {ticket.status === TicketStatus.PAUSED && <PauseCircle size={14} className="text-amber-500"/>}
                                <span className="text-[11px] font-medium capitalize">{ticket.status.toLowerCase()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-gray-200 bg-white space-y-3">
            <button 
                onClick={() => ticketService.completeTicket()}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
                <CheckCircle size={18} />
                <span>Finalizar Etapa</span>
            </button>
            
            <button 
                onClick={() => setShowTransferModal(true)}
                className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
                <ArrowRightCircle size={18} />
                <span>Transferir</span>
            </button>
        </div>

        {/* Transfer Modal Overlay */}
        {showTransferModal && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h4 className="font-bold text-gray-800">Tipo de Transferência</h4>
                        <p className="text-xs text-gray-500">Como deseja encaminhar este atendimento?</p>
                    </div>
                    <div className="p-4 space-y-3">
                        <button 
                            onClick={() => handleTransfer(TransferMode.HANDOFF)}
                            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-gray-700 group-hover:text-blue-700">Passar o Bastão (Handoff)</span>
                                <ArrowRightCircle size={16} className="text-gray-400 group-hover:text-blue-500"/>
                            </div>
                            <p className="text-[11px] text-gray-500">O ticket sai da sua responsabilidade e vai para o próximo setor.</p>
                        </button>

                        <button 
                            onClick={() => handleTransfer(TransferMode.INTERRUPT)}
                            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-gray-700 group-hover:text-amber-700">Pausar e Chamar (Ramal)</span>
                                <PhoneForwarded size={16} className="text-gray-400 group-hover:text-amber-500"/>
                            </div>
                            <p className="text-[11px] text-gray-500">Você fica em espera e o ticket retorna automaticamente para você depois.</p>
                        </button>
                    </div>
                    <div className="p-3 bg-gray-50 text-center">
                        <button onClick={() => setShowTransferModal(false)} className="text-sm text-gray-500 hover:text-gray-800 font-medium">Voltar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
