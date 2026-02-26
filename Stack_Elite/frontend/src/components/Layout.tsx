import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Building2, Car, Users, Zap, Calendar, Settings, Sun, Moon, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tenants',   icon: Building2,       label: 'Lojas (Tenants)' },
  { to: '/inventory', icon: Car,             label: 'Estoque' },
  { to: '/leads',     icon: Users,           label: 'Leads & Conversas' },
  { 
    to: '/scheduling', icon: Calendar,       label: 'Agendamentos',
    subItems: [
      { to: '/scheduling?status=DONE', label: 'Concluídos' },
      { to: '/scheduling?status=IN_PROGRESS', label: 'Em Atendimento' },
      { to: '/scheduling?status=CHECK_IN', label: 'Check-in' },
      { to: '/scheduling?status=CANCELED', label: 'Cancelados' },
      { to: '/scheduling?status=NO_SHOW', label: 'Perdidos' },
    ]
  },
]

const bottomNav = [
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    localStorage.setItem('sidebarCollapsed', (!isSidebarCollapsed).toString());
  };
  const location = useLocation();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">SDR Elite</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'w-20' : 'w-52'}`}>
        
        {/* Toggle Collapse Button (Desktop only) */}
        <button 
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-6 h-6 rounded-full items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">SDR Elite</p>
              <p className="text-xs text-gray-500 truncate">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {nav.map(({ to, icon: Icon, label, subItems }) => {
            const isActiveParent = location.pathname.startsWith(to);
            return (
              <div key={to} className="flex flex-col gap-1">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                    ${isActive || (isActiveParent && subItems)
                      ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}
                    ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
                  }
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{label}</span>}
                </NavLink>

                {!isSidebarCollapsed && subItems && isActiveParent && (
                  <div className="ml-5 flex flex-col mt-1 mb-2 relative">
                    {/* Linha vertical principal */}
                    <div className="absolute left-[9px] top-0 bottom-3 w-px bg-gray-300 dark:bg-gray-800"></div>

                    {subItems.map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={() => {
                          const strictlyActive = location.search && location.search.includes(sub.to.split('?')[1] || 'impossible');
                          return `relative text-xs py-1.5 pl-8 pr-2 rounded-md transition-all duration-150 flex items-center gap-2 ${strictlyActive ? 'text-blue-600 bg-gray-100 dark:text-blue-400 dark:bg-gray-800/80 font-medium' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800/30'}`;
                        }}
                      >
                        {/* Linha horizontal conectando (L-Tree) */}
                        <div className="absolute left-[9px] top-1/2 w-4 h-px bg-gray-300 dark:bg-gray-800"></div>

                        <div className={`w-1.5 h-1.5 rounded-full ${sub.label === 'Concluídos' ? 'bg-emerald-500' : sub.label === 'Cancelados' ? 'bg-red-500' : sub.label === 'Perdidos' ? 'bg-orange-500' : sub.label === 'Em Atendimento' ? 'bg-violet-500' : sub.label === 'Check-in' ? 'bg-cyan-500' : 'bg-blue-500'}`}></div>
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      <nav className="px-3 py-4 border-t border-gray-200 dark:border-gray-800/50 space-y-1">
        {bottomNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
              ${isActive
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'}
              ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isSidebarCollapsed ? label : undefined}
          >
            <Icon size={17} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
        {/* Toggle Theme Component */}
        <button 
          onClick={() => setIsDark((prev: boolean) => !prev)} 
          title={isSidebarCollapsed ? (isDark ? 'Modo Claro' : 'Modo Escuro') : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
        >
          {isDark ? <Sun size={17} className="flex-shrink-0" /> : <Moon size={17} className="flex-shrink-0" />}
          {!isSidebarCollapsed && <span className="truncate">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>
      </nav>

      {/* Status Footer */}
      <div className={`px-4 py-3 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 transition-colors duration-300 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-2 text-xs text-gray-500" title={isSidebarCollapsed ? 'Todos os serviços ativos' : undefined}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          {!isSidebarCollapsed && <span className="truncate">Todos os serviços ativos</span>}
        </div>
      </div>
    </aside>

    <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pt-[72px] md:pt-0 w-full min-w-0 max-w-full h-full flex flex-col">
      <div className="flex-1 h-full overflow-y-auto">
        <Outlet />
      </div>
    </main>
  </div>
  )
}
