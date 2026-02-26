import { useState } from 'react'
import { Users, Car, Handshake, TrendingUp, Activity, ArrowUp, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { SlidePanel } from '../components/SlidePanel'

const kpis = [
  { label: 'Leads Hoje', value: '47', delta: '+12%', icon: Users, color: 'blue' },
  { label: 'Score Médio BANT', value: '68', delta: '+5pts', icon: TrendingUp, color: 'green' },
  { label: 'SQLs Gerados', value: '11', delta: '+3', icon: Handshake, color: 'violet' },
  { label: 'Veículos Ofertados', value: '134', delta: '98% disponíveis', icon: Car, color: 'orange' },
]

const areaData = [
  { day: 'Seg', leads: 28, sqls: 6 },
  { day: 'Ter', leads: 35, sqls: 9 },
  { day: 'Qua', leads: 42, sqls: 11 },
  { day: 'Qui', leads: 30, sqls: 7 },
  { day: 'Sex', leads: 51, sqls: 14 },
  { day: 'Sab', leads: 22, sqls: 5 },
  { day: 'Dom', leads: 14, sqls: 3 },
]

const intentData = [
  { intent: 'Compra 0km', count: 39 },
  { intent: 'Seminovo', count: 25 },
  { intent: 'Troca', count: 18 },
  { intent: 'Financiamento', count: 28 },
  { intent: 'Consulta', count: 12 },
]

const colorMap: Record<string, string> = {
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState<{time: string, event: string, tenant: string, score: number} | null>(null)

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral em tempo real — todas as lojas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, delta, icon: Icon, color }) => (
          <div key={label} className={`relative rounded-xl border p-5 ${colorMap[color]}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                  <ArrowUp size={12} />
                  {delta}
                </div>
              </div>
              <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-8">
        {/* Area Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-4">Leads vs SQLs — Últimos 7 dias</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSQLs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Area type="monotone" dataKey="leads" stroke="#3b82f6" fill="url(#colorLeads)" strokeWidth={2} name="Leads" />
              <Area type="monotone" dataKey="sqls" stroke="#8b5cf6" fill="url(#colorSQLs)" strokeWidth={2} name="SQLs" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart — Intent */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-4">Intenções Detectadas</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={intentData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="intent" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-green-500 dark:text-green-400" />
          <p className="text-sm font-medium text-gray-800 dark:text-gray-300">Atividade Recente</p>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-600">Live</span>
        </div>
        <div className="space-y-3">
          {[
            { time: '11:38', event: 'Lead qualificado como SQL', tenant: 'Auto Premium', score: 82 },
            { time: '11:35', event: 'Áudio transcrito via Whisper', tenant: 'Garage Motors', score: 55 },
            { time: '11:30', event: 'Handoff disparado para consultor', tenant: 'Auto Premium', score: 88 },
            { time: '11:22', event: 'Imagem de troca analisada (LLaVA)', tenant: 'Centro Auto', score: 71 },
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedEvent(item)}
              className="flex items-center gap-4 py-2 border-t border-gray-100 dark:border-gray-800 first:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-xs text-gray-500 dark:text-gray-600 w-12 shrink-0">{item.time}</span>
              <p className="text-sm text-gray-800 dark:text-gray-300 flex-1">{item.event}</p>
              <span className="text-xs text-gray-500 shrink-0">{item.tenant}</span>
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${item.score >= 70 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                Score {item.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SlidePanel
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Trace de Evento"
      >
         {selectedEvent && (
            <div className="space-y-6">
              <div className="flex gap-4 items-start border-b border-gray-200 dark:border-gray-800 pb-4">
                 <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-blue-500 dark:text-blue-400">
                   <Zap size={24} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{selectedEvent.event}</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedEvent.time} • Loja: {selectedEvent.tenant}</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <h4 className="text-sm font-semibold text-gray-900 dark:text-white">LangFuse Trace Details</h4>
                 <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
{`{
  "traceId": "trc_${Math.random().toString(36).substr(2, 9)}",
  "eventName": "${selectedEvent.event}",
  "timestamp": "2024-10-24T${selectedEvent.time}:00Z",
  "actor": {
    "type": "AI Agent",
    "model": "gpt-4o-mini"
  },
  "metrics": {
    "latency_ms": ${Math.floor(Math.random() * 800) + 200},
    "tokens": ${Math.floor(Math.random() * 50) + 15}
  },
  "metadata": {
    "score_impact": "+${Math.floor(Math.random() * 15)}",
    "tenant": "${selectedEvent.tenant}"
  }
}`}
                    </pre>
                 </div>
                 <p className="text-xs text-gray-500 italic mt-2">Os logs detalhados de observabilidade podem ser visualizados no backend via console do LangFuse.</p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                 <button className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-2 rounded-lg transition-colors border border-gray-300 dark:border-gray-700">
                    Ver Lead Associado
                 </button>
              </div>
            </div>
         )}
      </SlidePanel>

    </div>
  )
}
