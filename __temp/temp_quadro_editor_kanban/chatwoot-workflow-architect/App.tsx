import React, { useState } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { WorkflowSettings } from './components/WorkflowSettings';
import { SessionControlPanel } from './components/SessionControlPanel';
import { Trello, Server, Settings, Search, Bell, GitMerge, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'kanban' | 'architecture' | 'settings'>('kanban');
  const [showAgentPanel, setShowAgentPanel] = useState(true);

  return (
    <div className="flex h-screen w-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 flex-shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            CA
          </div>
          <h1 className="font-bold text-white tracking-tight">Contábil Flow</h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Operacional
          </div>
          <button 
            onClick={() => setView('kanban')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              view === 'kanban' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Trello size={20} />
            <span className="font-medium">Quadros Kanban</span>
          </button>
          
          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gestão & Config
          </div>
          
           <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              view === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <GitMerge size={20} />
            <span className="font-medium">Editor de Fluxos</span>
          </button>

           <button 
            onClick={() => setView('architecture')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              view === 'architecture' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Server size={20} />
            <span className="font-medium">Arquitetura Backend</span>
          </button>
           <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <Settings size={20} />
            <span className="font-medium">Configurações Gerais</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <label className="flex items-center space-x-2 cursor-pointer mb-4">
              <input 
                type="checkbox" 
                checked={showAgentPanel} 
                onChange={e => setShowAgentPanel(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-offset-slate-900" 
              />
              <span className="text-xs text-slate-400">Mostrar Painel do Agente</span>
           </label>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-700"></div>
            <div>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-500">Tenant: Escritório XYZ</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center text-gray-500 text-sm">
            <span className="hover:text-gray-900 cursor-pointer">Home</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">
              {view === 'kanban' && 'Fluxo Operacional'}
              {view === 'settings' && 'Construtor de Fluxos'}
              {view === 'architecture' && 'Especificações Técnicas'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="pl-10 pr-4 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-full text-sm w-64 transition-all"
                />
             </div>
             <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-auto bg-gray-50 relative p-6">
                {view === 'kanban' && <KanbanBoard />}
                {view === 'settings' && <WorkflowSettings />}
                {view === 'architecture' && <ArchitectureViewer />}
            </main>

            {/* Right Side: Session Control Panel (Simulated Agent View) */}
            {showAgentPanel && (
                <SessionControlPanel />
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
