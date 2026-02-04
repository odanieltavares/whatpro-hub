import React, { useEffect, useState } from 'react';
import { ticketService } from '../services/TicketService';
import { TicketSession, TicketStatus, TransferMode } from '../types';
import { PlayCircle, PauseCircle, CheckCircle, ArrowRightCircle, Layers, PhoneForwarded } from 'lucide-react';

const DEPT_MAP: Record<string, string> = {
  'dept_fiscal': 'Fiscal',
  'dept_rh': 'RH',
  'dept_legal': 'Jurídico'
};

export const SessionControlPanel: React.FC = () => {
  const [session, setSession] = useState<TicketSession>(ticketService.getSession());
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    return ticketService.subscribe(setSession);
  }, []);

  const activeTicket = ticketService.getActiveTicket();
  
  // Logic to calculate waiting time
  const getDuration = (startStr: string) => {
    const minutes = Math.floor((Date.now() - new Date(startStr).getTime()) / 60000);
    return `${minutes} min`;
  };

  const handleTransfer = (mode: TransferMode) => {
    // Hardcoded target for demo purposes (cycling between depts)
    const currentDept = activeTicket?.departmentId || 'dept_fiscal';
    const targetDept = currentDept === 'dept_fiscal' ? 'dept_rh' : 'dept_fiscal';
    
    ticketService.transferTicket(targetDept, mode);
    setShowTransferModal(false);
  };

  if (!activeTicket) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border-l border-gray-200">
        <div className="text-center text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-2 text-green-500 opacity-50" />
            <p>Nenhum ticket ativo no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 w-80 shadow-xl z-30">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-slate-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Painel de Sessão</h3>
            <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-bold text-slate-800 truncate">{session.companyName}</span>
            </div>
        </div>

        {/* Stack Visualizer */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50">
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
                            className={`relative p-3 rounded-lg border shadow-sm transition-all ${
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
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    isTop ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {DEPT_MAP[ticket.departmentId] || ticket.departmentId}
                                </span>
                                <span className="text-[10px] font-mono">
                                    {getDuration(ticket.startedAt)}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-2">
                                {ticket.status === TicketStatus.ACTIVE && <PlayCircle size={14} className="text-green-500"/>}
                                {ticket.status === TicketStatus.PAUSED && <PauseCircle size={14} className="text-amber-500"/>}
                                <span className="text-xs font-medium capitalize">{ticket.status.toLowerCase()}</span>
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
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
                <CheckCircle size={18} />
                <span>Finalizar Etapa</span>
            </button>
            
            <button 
                onClick={() => setShowTransferModal(true)}
                className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
                <ArrowRightCircle size={18} />
                <span>Transferir / Ramal</span>
            </button>
        </div>

        {/* Transfer Modal Overlay */}
        {showTransferModal && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h4 className="font-bold text-gray-800">Tipo de Transferência</h4>
                        <p className="text-xs text-gray-500">Como você deseja passar este ticket?</p>
                    </div>
                    <div className="p-4 space-y-3">
                        <button 
                            onClick={() => handleTransfer(TransferMode.HANDOFF)}
                            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-gray-700 group-hover:text-blue-700">Passar o Bastão (Handoff)</span>
                                <ArrowRightCircle size={16} className="text-gray-400 group-hover:text-blue-500"/>
                            </div>
                            <p className="text-xs text-gray-500">Eu termino minha parte. O ticket sai da minha mesa e vai para o próximo departamento.</p>
                        </button>

                        <button 
                            onClick={() => handleTransfer(TransferMode.INTERRUPT)}
                            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-gray-700 group-hover:text-amber-700">Pausar e Chamar (Ramal)</span>
                                <PhoneForwarded size={16} className="text-gray-400 group-hover:text-amber-500"/>
                            </div>
                            <p className="text-xs text-gray-500">Eu aguardo na linha (Pausado). O ticket vai para o próximo e depois volta pra mim.</p>
                        </button>
                    </div>
                    <div className="p-3 bg-gray-50 text-center">
                        <button onClick={() => setShowTransferModal(false)} className="text-sm text-gray-500 hover:text-gray-800">Cancelar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
