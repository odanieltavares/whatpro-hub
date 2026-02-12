
import React, { useState } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { WorkflowSettings } from './components/WorkflowSettings';
import { SessionControlPanel } from './components/SessionControlPanel';
import { Trello, Server, Settings, Search, Bell, GitMerge, Menu, ChevronLeft, ChevronRight, PanelRight, X } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'kanban' | 'architecture' | 'settings'>('kanban');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleAgentPanel = () => setAgentPanelOpen(!agentPanelOpen);

  return (
    <div className="flex h-screen w-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-20
        bg-slate-900 text-slate-300 flex flex-col shadow-xl flex-shrink-0 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between overflow-hidden">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              CA
            </div>
            {sidebarOpen && <h1 className="font-bold text-white tracking-tight animate-in fade-in duration-300">Contábil Flow</h1>}
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {sidebarOpen && <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider animate-in fade-in">Operacional</div>}
          <button 
            onClick={() => { setView('kanban'); if(window.innerWidth < 1024) setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              view === 'kanban' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Quadros Kanban"
          >
            <Trello size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="font-medium whitespace-nowrap animate-in fade-in">Quadros Kanban</span>}
          </button>
          
          {sidebarOpen && <div className="px-3 mt-8 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider animate-in fade-in">Gestão & Config</div>}
          
           <button 
            onClick={() => { setView('settings'); if(window.innerWidth < 1024) setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              view === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Editor de Fluxos"
          >
            <GitMerge size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="font-medium whitespace-nowrap animate-in fade-in">Editor de Fluxos</span>}
          </button>

           <button 
            onClick={() => { setView('architecture'); if(window.innerWidth < 1024) setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
              view === 'architecture' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Arquitetura Backend"
          >
            <Server size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="font-medium whitespace-nowrap animate-in fade-in">Arquitetura Backend</span>}
          </button>
           <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors" title="Configurações">
            <Settings size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="font-medium whitespace-nowrap animate-in fade-in">Configurações</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-slate-700"></div>
            {sidebarOpen && (
              <div className="animate-in fade-in duration-300">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-slate-500 truncate">Escritório XYZ</p>
              </div>
            )}
          </div>
          {/* Collapse Trigger Desktop */}
          <button 
            onClick={toggleSidebar} 
            className="mt-4 hidden lg:flex w-full items-center justify-center p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center text-gray-500 text-xs lg:text-sm">
              <span className="hover:text-gray-900 cursor-pointer">Home</span>
              <span className="mx-2">/</span>
              <span className="font-medium text-gray-900 truncate max-w-[150px] lg:max-w-none">
                {view === 'kanban' && 'Fluxo Operacional'}
                {view === 'settings' && 'Construtor de Fluxos'}
                {view === 'architecture' && 'Especificações Técnicas'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
             <div className="relative hidden md:block">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="pl-10 pr-4 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-full text-sm w-40 lg:w-64 transition-all"
                />
             </div>
             
             <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
               <Bell size={20} />
             </button>

             <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block"></div>

             <button 
              onClick={toggleAgentPanel}
              className={`p-2 rounded-lg transition-all hidden lg:flex items-center space-x-2 ${
                agentPanelOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={agentPanelOpen ? 'Fechar Painel Lateral' : 'Abrir Painel Lateral'}
             >
                <PanelRight size={20} />
                <span className="text-xs font-bold uppercase tracking-wider hidden xl:block">
                  {agentPanelOpen ? 'Recolher' : 'Sessão'}
                </span>
             </button>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-auto bg-gray-50 relative p-4 lg:p-6 min-w-0">
                {view === 'kanban' && <KanbanBoard />}
                {view === 'settings' && <WorkflowSettings />}
                {view === 'architecture' && <ArchitectureViewer />}
            </main>

            {/* Right Side: Session Control Panel */}
            <SessionControlPanel isOpen={agentPanelOpen} onToggle={toggleAgentPanel} />
        </div>
      </div>
    </div>
  );
};

export default App;
