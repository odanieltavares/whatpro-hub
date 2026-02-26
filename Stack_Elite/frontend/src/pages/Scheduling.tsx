import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, User, Car, CheckCircle2, XCircle, AlertCircle, Phone, ArrowRight, Building2, Handshake, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import { SlidePanel } from '../components/SlidePanel';
import { Calendar as BigCalendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format, parse, startOfWeek, getDay, isSameMonth, isSameWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuração do DateFns para o React Big Calendar
const locales = {
  'pt-BR': ptBR,
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Inicia na Segunda
  getDay,
  locales,
})

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  vehicle: string;
  tenant: string;
  salesperson: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'DONE' | 'NO_SHOW' | 'CANCELED' | 'CHECK_IN' | 'IN_PROGRESS';
  has_downpayment: boolean;
}

const STATUS_CONFIG = {
  SCHEDULED: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500', bgCal: '#1e3a8a', label: 'Agendado' },
  CHECK_IN: { icon: Clock, color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500', bgCal: '#0891b2', label: 'Check-in' },
  IN_PROGRESS: { icon: UserCheck, color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500', bgCal: '#4c1d95', label: 'Em Atendimento' },
  DONE: { icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500', bgCal: '#064e3b', label: 'Finalizado' },
  NO_SHOW: { icon: AlertCircle, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500', bgCal: '#78350f', label: 'No Show' },
  CANCELED: { icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500', bgCal: '#7f1d1d', label: 'Cancelado' }
};

// Dados Simulados Expandidos (Alta Intensidade p/ Testes de UX) Lincado a Leads reais.
const MOCK_APPOINTMENTS: Appointment[] = [
  // --- ONTENS / PASSADO ---
  { id: "u-p1", client_name: "Silvia Lima (Lead FB)", client_phone: "(21) 98877-6655", vehicle: "Hyundai Creta", tenant: "Mega Veículos", salesperson: "A Definir", date: "Ontem", time: "09:30", status: "DONE", has_downpayment: false },
  { id: "u-p2", client_name: "Kauan Rocha (Web)", client_phone: "(31) 97766-5544", vehicle: "Peugeot Tiggo 8", tenant: "Auto Premium Elite", salesperson: "Carlos Vendedor", date: "Ontem", time: "13:00", status: "NO_SHOW", has_downpayment: true },
  { id: "u-p3", client_name: "Leticia Souza", client_phone: "(11) 99333-4444", vehicle: "Honda Civic", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Hoje-2", time: "10:00", status: "DONE", has_downpayment: true },
  { id: "u-p4", client_name: "Bruno Almeida (Lead Insta)", client_phone: "(41) 91111-2222", vehicle: "Polo Highline", tenant: "Auto Premium Elite", salesperson: "Roberto Mendes", date: "Hoje-3", time: "15:00", status: "CANCELED", has_downpayment: false },
  { id: "u-p5", client_name: "Ricardo Mendes", client_phone: "(31) 95555-1111", vehicle: "Tracker Volcano", tenant: "Mega Veículos", salesperson: "Carlos Vendedor", date: "Ontem", time: "16:00", status: "DONE", has_downpayment: false },
  
  // --- HOJE (Massivo para overlaps) ---
  { id: "u-1", client_name: "João Silva (OLX)", client_phone: "(11) 98888-1111", vehicle: "Corolla Cross XRE", tenant: "Auto Premium Elite", salesperson: "Carlos Vendedor", date: "Hoje", time: "08:00", status: "IN_PROGRESS", has_downpayment: true },
  { id: "u-2", client_name: "Maria Costa", client_phone: "(21) 97777-2222", vehicle: "Honda HR-V Platinum", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Hoje", time: "08:00", status: "SCHEDULED", has_downpayment: false }, // Overlap 08:00
  { id: "u-3", client_name: "Carla Matos (Lead Google)", client_phone: "(31) 96111-2222", vehicle: "VW Nivus Highline", tenant: "Mega Veículos", salesperson: "Roberto Mendes", date: "Hoje", time: "08:30", status: "DONE", has_downpayment: false }, // Overlap 08:30
  
  { id: "u-c1", client_name: "Fernando Dias", client_phone: "(51) 91111-5555", vehicle: "Toyota Yaris", tenant: "Seminovo Rápido", salesperson: "Carlos Vendedor", date: "Hoje", time: "09:00", status: "CHECK_IN", has_downpayment: false }, // CHECK_IN Hoje
  { id: "u-c2", client_name: "Amanda Lima", client_phone: "(11) 92222-7777", vehicle: "Jeep Renegade", tenant: "Auto Premium Elite", salesperson: "Roberto Mendes", date: "Hoje", time: "09:30", status: "SCHEDULED", has_downpayment: true },
  { id: "u-c3", client_name: "Jorge Campos", client_phone: "(11) 94444-1234", vehicle: "Fiat Strada", tenant: "Mega Veículos", salesperson: "Ana Consultora", date: "Hoje", time: "09:30", status: "CANCELED", has_downpayment: false }, 
  
  { id: "u-4", client_name: "Pedro Alves (Portal)", client_phone: "(31) 96666-3333", vehicle: "Jeep Compass Touring", tenant: "Auto Premium Elite", salesperson: "Carlos Vendedor", date: "Hoje", time: "14:00", status: "DONE", has_downpayment: false },
  { id: "u-5", client_name: "Lucas Ferreira (Web)", client_phone: "(41) 95555-4444", vehicle: "VW T-Cross", tenant: "Mega Veículos", salesperson: "A Definir", date: "Hoje", time: "14:00", status: "NO_SHOW", has_downpayment: false }, // Overlap 14:00
  { id: "u-6", client_name: "Sonia Marques", client_phone: "(51) 99999-5555", vehicle: "BMW X1", tenant: "Auto Premium Elite", salesperson: "Roberto Mendes", date: "Hoje", time: "16:30", status: "CANCELED", has_downpayment: true },
  { id: "u-6b", client_name: "Felipe Nunes (Web Motors)", client_phone: "(21) 97777-6666", vehicle: "Volvo XC60", tenant: "Mega Veículos", salesperson: "Ana Consultora", date: "Hoje", time: "16:30", status: "CHECK_IN", has_downpayment: false }, // Overlap 16:30
  
  // --- AMANHÃ E FUTUROS ---
  { id: "u-7", client_name: "Antonio Dias (Tiktok)", client_phone: "(61) 94444-3333", vehicle: "Porsche Macan", tenant: "Auto Premium Elite", salesperson: "Carlos Vendedor", date: "Amanhã", time: "09:00", status: "SCHEDULED", has_downpayment: true },
  { id: "u-8", client_name: "Juliana Silva", client_phone: "(71) 93333-2222", vehicle: "Audi Q3", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Amanhã", time: "09:00", status: "SCHEDULED", has_downpayment: false }, // Overlap amanhã transp
  { id: "u-9", client_name: "Beto Soares (Indicação)", client_phone: "(81) 92222-1111", vehicle: "Fiat Taos", tenant: "Mega Veículos", salesperson: "Roberto Mendes", date: "Amanhã", time: "11:00", status: "SCHEDULED", has_downpayment: false },
  { id: "u-10", client_name: "Monica Rute", client_phone: "(91) 91111-0000", vehicle: "Renault Fastback", tenant: "Auto Premium Elite", salesperson: "Carlos Vendedor", date: "Amanhã", time: "11:00", status: "SCHEDULED", has_downpayment: true },
  { id: "u-11", client_name: "Renato Diniz", client_phone: "(11) 90000-9999", vehicle: "Ford Pulse", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Amanhã", time: "15:00", status: "SCHEDULED", has_downpayment: false },
  { id: "u-11b", client_name: "Carolina G.", client_phone: "(21) 91234-9999", vehicle: "VW Jetta", tenant: "Mega Veículos", salesperson: "A Definir", date: "Amanhã", time: "15:30", status: "SCHEDULED", has_downpayment: false },
  
  // --- OUTROS DIAS (+2, +3, etc) ---
  { id: "u-f1", client_name: "Luiza Melo", client_phone: "(41) 96655-4433", vehicle: "Cherry Kicks", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Hoje+2", time: "10:00", status: "SCHEDULED", has_downpayment: false },
  { id: "u-f2", client_name: "Douglas T (Icarros)", client_phone: "(51) 95544-3322", vehicle: "Chevrolet Bronco", tenant: "Mega Veículos", salesperson: "Roberto Mendes", date: "Hoje+2", time: "14:00", status: "SCHEDULED", has_downpayment: true },
  { id: "u-f3", client_name: "Henrique F.", client_phone: "(11) 91234-5678", vehicle: "BYD Dolphin", tenant: "Auto Premium Elite", salesperson: "Carlos Vendedor", date: "Hoje+3", time: "09:00", status: "SCHEDULED", has_downpayment: false },
  { id: "u-f3b", client_name: "Vitoria Regis", client_phone: "(11) 90000-1111", vehicle: "Peugeot 208", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Hoje+3", time: "09:00", status: "SCHEDULED", has_downpayment: false },
  { id: "u-f4", client_name: "Viviane K. (Web)", client_phone: "(31) 98765-4321", vehicle: "GWM Ora", tenant: "Auto Premium Elite", salesperson: "A Definir", date: "Hoje+4", time: "11:00", status: "SCHEDULED", has_downpayment: true },
  { id: "u-f5", client_name: "Rafael B. (Lead Insta)", client_phone: "(11) 99887-7665", vehicle: "Fiat Toro", tenant: "Mega Veículos", salesperson: "Roberto Mendes", date: "Hoje+5", time: "10:30", status: "SCHEDULED", has_downpayment: false },
  { id: "u-f6", client_name: "Vanessa W.", client_phone: "(21) 91122-3344", vehicle: "Jeep Commander", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Hoje+6", time: "16:00", status: "SCHEDULED", has_downpayment: false },
  { id: "u-f7", client_name: "Leandro L.", client_phone: "(21) 95555-5555", vehicle: "Audi A4", tenant: "Auto Premium Elite", salesperson: "Carlos Vendedor", date: "Hoje+7", time: "09:30", status: "SCHEDULED", has_downpayment: true },
  { id: "u-f8", client_name: "Marcio G.", client_phone: "(11) 96666-4444", vehicle: "BMW 320i", tenant: "Mega Veículos", salesperson: "Roberto Mendes", date: "Hoje+8", time: "13:00", status: "SCHEDULED", has_downpayment: false },
  { id: "u-f9", client_name: "Renata F.", client_phone: "(41) 93333-3333", vehicle: "Mercedes X1", tenant: "Seminovo Rápido", salesperson: "Ana Consultora", date: "Hoje+10", time: "10:00", status: "SCHEDULED", has_downpayment: false },
];

// O React Big Calendar espera objetos Date nativos com start e end.
const parseDateString = (dateStr: string, timeStr: string) => {
  const now = new Date();
  let targetDate = new Date();
  
  if (dateStr === 'Ontem') targetDate = subDays(now, 1);
  else if (dateStr === 'Amanhã') targetDate = addDays(now, 1);
  else if (dateStr.startsWith('Hoje+')) {
    const days = parseInt(dateStr.split('+')[1], 10);
    targetDate = addDays(now, days);
  } else if (dateStr.startsWith('Hoje-')) {
    const days = parseInt(dateStr.split('-')[1], 10);
    targetDate = subDays(now, days);
  }
  // Se for "Hoje" ou indefinido, mantem today

  const [hours, minutes] = timeStr.split(':').map(Number);
  targetDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(targetDate);
  endDate.setHours(hours + 1); // 1 hora de duração padrão
  
  return { start: targetDate, end: endDate };
};

const CustomEvent = ({ event, view }: any) => {
  const app = event.resource as Appointment;
  const isDone = app.status === 'DONE';
  const isNoShow = app.status === 'NO_SHOW';
  const isCheckIn = app.status === 'CHECK_IN';
  const isMonthView = view === 'month';
  
  const colors = [
    'bg-blue-100 dark:bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-100',
    'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500 text-emerald-900 dark:text-emerald-100',
    'bg-pink-100 dark:bg-pink-500/20 border-pink-500 text-pink-900 dark:text-pink-100',
    'bg-orange-100 dark:bg-orange-500/20 border-orange-500 text-orange-900 dark:text-orange-100',
    'bg-violet-100 dark:bg-violet-500/20 border-violet-500 text-violet-900 dark:text-violet-100',
    'bg-amber-100 dark:bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-100',
  ];
  let hash = 0;
  for (let i = 0; i < app.salesperson.length; i++) hash = app.salesperson.charCodeAt(i) + ((hash << 5) - hash);
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div className={`flex flex-col h-full w-full justify-start p-1.5 overflow-hidden box-border group rounded-md border-l-4 border-y-transparent border-r-transparent ${colorClass} hover:brightness-105 transition-all duration-200`}>
      <div className={`font-semibold transition-colors flex items-center leading-tight mb-0.5 ${isMonthView ? 'text-xs truncate' : 'text-[9.5px] sm:text-[11px] break-words line-clamp-2'}`}>
         {(isDone || isCheckIn) && <CheckCircle2 className={`${isMonthView ? 'w-3 h-3' : 'w-2.5 h-2.5'} mr-1 inline flex-shrink-0 opacity-90`} />}
        {isNoShow && <AlertCircle className={`${isMonthView ? 'w-3 h-3' : 'w-2.5 h-2.5'} mr-1 inline text-red-500 dark:text-red-400 flex-shrink-0`} />}
        <span className="truncate w-full">{app.client_name}</span>
      </div>
      
      <div className={`uppercase tracking-wider flex items-center gap-1 opacity-80 truncate ${isMonthView ? 'text-[10px] font-semibold' : 'text-[7.5px] sm:text-[9px] font-bold'}`}>
        <User className="w-2.5 h-2.5 flex-shrink-0" /> 
        <span className="truncate">{app.salesperson.split(' ').slice(0, 2).join(' ')}</span>
      </div>
      
      <div className={`flex items-center gap-1 opacity-80 mt-0.5 truncate ${isMonthView ? 'text-[11px]' : 'text-[8px] sm:text-[9.5px]'}`}>
        <Car className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="truncate">{app.vehicle}</span>
      </div>

      {app.has_downpayment && (
        <div className="mt-auto pt-0.5 flex justify-start">
           <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" title="Sinal Pago"></span>
        </div>
      )}
    </div>
  );
};

const calendarComponents = {
  event: CustomEvent,
};

const customEventPropGetter = (_event: any) => {
  return {
    style: {
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0
    },
    className: `custom-rbc-event-wrapper`
  };
};

export default function Scheduling() {

  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<'CALENDAR'|'LIST'>('LIST'); // Padrao = Lista
  
  // Custom Navigation
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(date);
    if (action === 'TODAY') {
      newDate = new Date();
    } else if (action === 'PREV') {
      if (view === 'month') newDate = subMonths(newDate, 1);
      else if (view === 'week') newDate = subWeeks(newDate, 1);
      else newDate = subDays(newDate, 1);
    } else if (action === 'NEXT') {
      if (view === 'month') newDate = addMonths(newDate, 1);
      else if (view === 'week') newDate = addWeeks(newDate, 1);
      else newDate = addDays(newDate, 1);
    }
    setDate(newDate);
  };

  // Filtros
  const [salespersonFilter, setSalespersonFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');

  // Ao alterar o filtro no submenu, sempre volta a visao pra 'Mês' 
  useEffect(() => {
    if (statusFilter) {
      setView(Views.MONTH);
    }
  }, [statusFilter]);

  // Deriva extrações para Select de Vendedores
  const salespersons = useMemo(() => {
    const list = MOCK_APPOINTMENTS.map(a => a.salesperson);
    return Array.from(new Set(list));
  }, []);

  // Transforma os agendamentos nos eventos do tipo 'BigCalendar'
  const calendarEvents = useMemo(() => {
    return MOCK_APPOINTMENTS
      .filter(app => {
        const matchSales = salespersonFilter === 'ALL' || app.salesperson === salespersonFilter;
        const matchStatus = !statusFilter || app.status === statusFilter;
        const matchSearch = searchQuery === "" || app.client_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            app.client_phone.includes(searchQuery);
        return matchSales && matchStatus && matchSearch;
      })
      .map(app => {
        const { start, end } = parseDateString(app.date, app.time);
        return {
          ...app,
          title: `${app.client_name} - ${app.vehicle}`,
          start,
          end,
          resource: app
        };
      });
  }, [salespersonFilter, statusFilter, searchQuery]);

  // Lista os eventos filtrados pelo RANGE (Semana/Mês/Dia) baseado no state Global 'date'.
  const listModeEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      const eventDate = event.start as Date;
      if (view === 'month') return isSameMonth(eventDate, date);
      if (view === 'week') return isSameWeek(eventDate, date, { weekStartsOn: 1 });
      if (view === 'day') return isSameDay(eventDate, date);
      return true;
    }).sort((a, b) => a.start.getTime() - b.start.getTime()); // Organiza por ordem de horário
  }, [calendarEvents, view, date]);

  const handleSelectEvent = (event: any) => {
    setSelectedApp(event.resource);
  };

  return (
    <div className="p-3 md:p-6 h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 md:mb-6 gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Agendamentos & Visitas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Controle de calendários corporativos e de vendedores.</p>
        </div>
        
        {/* Toggle Mode and Global Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-center">
            {/* Toggle Button Group Shadcn-style */}
            <div className="flex bg-gray-100 dark:bg-[#1c1c1f] p-0.5 rounded-lg border border-gray-300 dark:border-gray-800 shadow-inner w-full sm:w-auto">
              <button 
                onClick={() => setDisplayMode('LIST')}
                className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-3 py-1 rounded-[5px] text-[11px] md:text-xs font-medium transition-all duration-200 ${displayMode === 'LIST' ? 'bg-white dark:bg-[#2c2c30] text-gray-900 dark:text-white shadow shadow-black/10 dark:shadow-black/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2c2c30]/50'}`}
              >
                Lista
              </button>
              <button 
                onClick={() => setDisplayMode('CALENDAR')}
                className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-3 py-1 rounded-[5px] text-[11px] md:text-xs font-medium transition-all duration-200 ${displayMode === 'CALENDAR' ? 'bg-white dark:bg-[#2c2c30] text-gray-900 dark:text-white shadow shadow-black/10 dark:shadow-black/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2c2c30]/50'}`}
              >
                Calendário
              </button>
            </div>

            <div className="hidden lg:block h-6 w-px bg-gray-300 dark:bg-gray-800 mx-1"></div>

            {/* Mês Semana Dia */}
            <div className="flex bg-gray-100 dark:bg-[#1c1c1f] p-0.5 rounded-lg border border-gray-300 dark:border-gray-800 shadow-inner w-full md:w-auto">
              <button onClick={() => setView('month')} className={`flex-1 md:flex-none px-2 py-1 rounded-[5px] text-[10px] md:text-[11px] font-medium transition-all duration-200 ${view === 'month' ? 'bg-white dark:bg-[#2c2c30] text-gray-900 dark:text-white shadow shadow-black/10 dark:shadow-black/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2c2c30]/50'}`}>Mês</button>
              <button onClick={() => setView('week')} className={`flex-1 md:flex-none px-2 py-1 rounded-[5px] text-[10px] md:text-[11px] font-medium transition-all duration-200 ${view === 'week' ? 'bg-white dark:bg-[#2c2c30] text-gray-900 dark:text-white shadow shadow-black/10 dark:shadow-black/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2c2c30]/50'}`}>Semana</button>
              <button onClick={() => setView('day')} className={`flex-1 md:flex-none px-2 py-1 rounded-[5px] text-[10px] md:text-[11px] font-medium transition-all duration-200 ${view === 'day' ? 'bg-white dark:bg-[#2c2c30] text-gray-900 dark:text-white shadow shadow-black/10 dark:shadow-black/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2c2c30]/50'}`}>Dia</button>
            </div>

            <div className="hidden lg:block h-6 w-px bg-gray-300 dark:bg-gray-800 mx-1"></div>
            
            <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="flex items-center bg-white dark:bg-[#1c1c1f] border border-gray-300 dark:border-gray-800 rounded-lg shadow-sm hover:border-gray-400 dark:hover:border-gray-700 transition-colors w-full md:w-auto px-2.5 py-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 text-gray-900 dark:text-white text-xs font-medium focus:ring-0 py-0.5 ml-2 focus:outline-none w-full md:w-[120px]"
                />
              </div>

              <div className="flex items-center bg-white dark:bg-[#1c1c1f] border border-gray-300 dark:border-gray-800 rounded-lg py-1 px-2 shadow-sm min-w-0 md:min-w-[140px] w-full md:w-auto hover:border-gray-400 dark:hover:border-gray-700 transition-colors">
                <User className="w-3.5 h-3.5 text-blue-500 mr-2 flex-shrink-0" />
                <select 
                  title="seller selector"
                  value={salespersonFilter}
                  onChange={(e) => setSalespersonFilter(e.target.value)}
                  className="bg-transparent border-0 text-gray-900 dark:text-white text-xs font-medium focus:ring-0 py-0.5 focus:outline-none w-full cursor-pointer appearance-none"
                >
                  <option value="ALL" className="bg-white dark:bg-[#1c1c1f] text-gray-900 dark:text-white">Todos os Vendedores</option>
                  {salespersons.map(s => <option key={s} value={s} className="bg-white dark:bg-[#1c1c1f] text-gray-900 dark:text-white">{s}</option>)}
                </select>
              </div>
            </div>
        </div>
      </div>

      {/* Date Navigation Global Centralizado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-[#11131a] border border-gray-300 dark:border-gray-800 p-3 md:p-4 rounded-t-xl mb-0 z-10 w-full mt-2 gap-4">
        
        {/* Custom Date Widget Component */}
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1c1c1f] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden w-12 md:w-14 shadow-sm flex-shrink-0">
            <div className="bg-gray-200/50 dark:bg-[#242428] w-full text-center py-1 border-b border-gray-200 dark:border-gray-800">
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest">{format(date, "MMM", { locale: ptBR }).replace('.', '')}</span>
            </div>
            <div className="py-1">
              <span className="text-base md:text-lg font-extrabold text-gray-900 dark:text-gray-100">{format(date, "dd")}</span>
            </div>
          </div>
          <div className="flex flex-col text-left min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 capitalize leading-tight mb-0.5 truncate">{format(date, "MMMM yyyy", { locale: ptBR })}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
              {view === 'month' ? `${format(new Date(date.getFullYear(), date.getMonth(), 1), "d 'de' MMM, yyyy", { locale: ptBR })} — ${format(new Date(date.getFullYear(), date.getMonth() + 1, 0), "d 'de' MMM, yyyy", { locale: ptBR })}` : 
               view === 'week' ? `${format(startOfWeek(date, { weekStartsOn: 1 }), "d 'de' MMM, yyyy", { locale: ptBR })} — ${format(addDays(startOfWeek(date, { weekStartsOn: 1 }), 6), "d 'de' MMM, yyyy", { locale: ptBR })}` : 
               format(date, "EEEE, d 'de' MMMM, yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Buttons Nav */}
        <div className="flex items-center rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#1c1c1f] shadow-sm w-full md:w-auto justify-center md:justify-start flex-shrink-0">
          <button onClick={() => handleNavigate('PREV')} className="px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2c2c30] dark:hover:text-white transition-colors border-r border-gray-300 dark:border-gray-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => handleNavigate('TODAY')} className="px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-[#2c2c30] dark:hover:text-white transition-colors border-r border-gray-300 dark:border-gray-800 tracking-wide uppercase">
            Hoje
          </button>
          <button onClick={() => handleNavigate('NEXT')} className="px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2c2c30] dark:hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {displayMode === 'CALENDAR' ? (
        <div className="flex-1 bg-white dark:bg-[#0f172a] border border-t-0 border-gray-200 dark:border-gray-800 rounded-b-xl p-2 md:p-4 min-h-0 overflow-y-auto flex flex-col custom-scrollbar rbc-calendar shadow-xl">
          <div className="min-h-[700px] flex-1">
            <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            toolbar={false}
            views={['month', 'week', 'day']}
            view={view}
            date={date}
            onView={(val) => setView(val)}
            onNavigate={(newDate) => setDate(newDate)}
            onSelectEvent={handleSelectEvent}
              culture="pt-BR"
              components={calendarComponents}
              eventPropGetter={customEventPropGetter}
              messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                noEventsInRange: "Não há agendamentos neste período.",
                showMore: total => `+ ${total} ver mais`
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-[#0f172a] border border-t-0 border-gray-200 dark:border-gray-800 rounded-b-xl p-4 md:p-6 overflow-y-auto custom-scrollbar shadow-xl min-h-0">
          <div className="grid grid-cols-1 gap-3 max-w-5xl mx-auto pb-20">
            {listModeEvents.map((event) => {
              const app = event.resource as Appointment;
              const StatusIcon = STATUS_CONFIG[app.status].icon;
              return (
                <div key={app.id} className="bg-white dark:bg-[#1c1c1f] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:items-center">
                  {/* Left Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${STATUS_CONFIG[app.status].color} bg-current`}></div>
                  
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-[#11131a] border border-gray-100 dark:border-gray-800/60 rounded-xl px-4 py-2 min-w-[90px] flex-shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">{app.date}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{app.time}</span>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        {app.client_name}
                        <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[app.status].color}`} />
                      </h3>
                      {app.has_downpayment && (
                         <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                           Sinal Pago
                         </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center"><Phone className="w-4 h-4 mr-1.5" /> {app.client_phone}</span>
                      <span className="flex items-center"><Car className="w-4 h-4 mr-1.5" /> {app.vehicle}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-100 dark:border-gray-800/60 sm:border-t-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Vendedor</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200 flex items-center sm:justify-end">
                        <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {app.salesperson}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="p-2 sm:p-2.5 bg-gray-50 dark:bg-[#11131a] sm:bg-transparent sm:dark:bg-transparent group-hover:bg-blue-50 shadow-sm sm:shadow-none dark:group-hover:bg-blue-500/10 rounded-lg transition-colors text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 border border-gray-200 dark:border-gray-800 sm:border-transparent flex-shrink-0"
                      title="Ver Detalhes"
                    >
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {listModeEvents.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 dark:bg-[#11131a] rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">Nenhum agendamento encontrado</h3>
                  <p className="text-sm text-gray-500 mt-1">Este vendedor não possui visitas cadastradas ou os filtros estão vazios.</p>
               </div>
            )}
          </div>
        </div>
      )}

      <SlidePanel 
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Detalhes da Visita"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-gray-200 dark:border-gray-800">
               <div className={`p-3.5 rounded-full ${STATUS_CONFIG[selectedApp?.status ?? 'SCHEDULED'].bg} ring-2 ring-white dark:ring-gray-900 shadow-lg`}>
                  {(() => {
                    const StatusIcon = STATUS_CONFIG[selectedApp?.status ?? 'SCHEDULED'].icon;
                    return <StatusIcon className={`w-7 h-7 ${STATUS_CONFIG[selectedApp?.status ?? 'SCHEDULED'].color}`} />;
                  })()}
                </div>
                <div>
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{selectedApp?.client_name}</h2>
                   <div className="flex items-center text-gray-500 dark:text-gray-400 font-mono text-sm">
                     <Phone className="w-3.5 h-3.5 mr-1.5" />
                     {selectedApp.client_phone}
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                  <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 mb-2" />
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Data e Hora</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{selectedApp.date} às {selectedApp.time}</p>
               </div>
               <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                  <Building2 className="w-4 h-4 text-violet-500 dark:text-violet-400 mb-2" />
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Loja / Stand</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{selectedApp.tenant}</p>
               </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl space-y-3 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
               <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-3">
                 <Car className="w-4 h-4 text-orange-400" /> Veículo Desejado
               </h4>
               <p className="text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800/80 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700/50 shadow-inner">{selectedApp.vehicle}</p>
               
               {selectedApp.has_downpayment && (
                 <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex items-start gap-3">
                    <div className="bg-emerald-500/20 p-1.5 rounded-md mt-0.5">
                      <Handshake className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">Reserva Confirmada (Sinal)</p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 leading-relaxed">Cliente já adiantou pagamento para reservar o modelo. Alta probabilidade de fechamento.</p>
                    </div>
                 </div>
               )}
            </div>

             <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-5 rounded-xl space-y-3">
               <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                 <User className="w-4 h-4 text-blue-500" /> Atribuição
               </h4>
               <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                 <span className="text-sm text-gray-600 dark:text-gray-400">Atendimento Responsável:</span>
                 <span className="text-sm text-gray-900 dark:text-white font-bold">{selectedApp?.salesperson}</span>
               </div>
            </div>

            <div className="pt-6 flex flex-col gap-3">
               <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Check-in (Registrar Chegada)
               </button>
               <div className="flex gap-3">
                 <button className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors text-sm">
                    Reagendar
                 </button>
                 <button className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors text-sm">
                    Cancelar
                 </button>
               </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
