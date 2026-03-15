import { useState } from 'react'
import {
  Users, TrendingUp, ShieldCheck, AlertTriangle,
  Clock, Phone, User, X, ChevronRight, Calendar, ThumbsDown, ArrowRight
} from 'lucide-react'
import { SlidePanel } from '../components/SlidePanel'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardData {
  id: string
  title: string
  contactName: string
  contactPhone: string
  labels: string[]
  customAttributes: {
    score_bant?: number
    vendedor_responsavel?: string
    motivo_perda?: string
    data_retorno?: string
    veiculo_troca?: string
    valor_sinal?: number
    parcela_alvo?: number
    utm_source?: string
    utm_campaign?: string
  }
  stageId: string
  stageName: string
  lastMessage: string
  lastMessageAt: string
  priority: string
  createdAt: string
}

interface StageData {
  id: string
  name: string
  color: string
  position: number
  slaHours: number | null
  cards: CardData[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// TODO: conectar ao Go API `GET /accounts/1/boards` para dados reais

const mockStages: StageData[] = [
  {
    id: 's1', name: 'Novo Contato', color: '#8B5CF6', position: 0, slaHours: 2,
    cards: [
      {
        id: 'c1', title: 'João Silva', contactName: 'João Silva', contactPhone: '+55 11 9 8765-4321',
        labels: ['Novo Contato', 'Robô Iniciou'],
        customAttributes: { score_bant: 15, utm_source: 'meta_ads', utm_campaign: 'compass_fev2025' },
        stageId: 's1', stageName: 'Novo Contato',
        lastMessage: 'Olá, vi o anúncio do Compass', lastMessageAt: '5min',
        priority: 'medium', createdAt: '2025-02-27T09:00:00Z',
      },
      {
        id: 'c2', title: 'Ana Beatriz', contactName: 'Ana Beatriz', contactPhone: '+55 21 9 9988-7766',
        labels: ['Novo Contato', 'Aguardando Resposta'],
        customAttributes: { score_bant: 8 },
        stageId: 's1', stageName: 'Novo Contato',
        lastMessage: 'Quero saber mais sobre financiamento', lastMessageAt: '12min',
        priority: 'low', createdAt: '2025-02-27T09:15:00Z',
      },
    ],
  },
  {
    id: 's2', name: 'Leads', color: '#A855F7', position: 1, slaHours: 4,
    cards: [
      {
        id: 'c3', title: 'Carlos Mendes', contactName: 'Carlos Mendes', contactPhone: '+55 31 9 7788-9900',
        labels: ['Leads', 'Interesse: SUV', 'Sondando Troca'],
        customAttributes: { score_bant: 45, parcela_alvo: 1800 },
        stageId: 's2', stageName: 'Leads',
        lastMessage: 'Gostaria de dar o meu na troca', lastMessageAt: '22min',
        priority: 'medium', createdAt: '2025-02-27T08:30:00Z',
      },
    ],
  },
  {
    id: 's3', name: 'Pré-Qualificado', color: '#3B82F6', position: 2, slaHours: 24,
    cards: [
      {
        id: 'c4', title: 'Fernanda Lima', contactName: 'Fernanda Lima', contactPhone: '+55 11 9 3344-5566',
        labels: ['Pré-Qualificado', 'Tem Usado', 'Orçamento Definido'],
        customAttributes: { score_bant: 78, veiculo_troca: 'Honda Civic 2018' },
        stageId: 's3', stageName: 'Pré-Qualificado',
        lastMessage: 'Consigo pagar no máximo R$ 2.000', lastMessageAt: '35min',
        priority: 'high', createdAt: '2025-02-27T08:00:00Z',
      },
      {
        id: 'c5', title: 'Roberto Alves', contactName: 'Roberto Alves', contactPhone: '+55 11 9 5566-7788',
        labels: ['Pré-Qualificado', 'Sem Troca', 'Orçamento Definido'],
        customAttributes: { score_bant: 52 },
        stageId: 's3', stageName: 'Pré-Qualificado',
        lastMessage: 'Vou comprar à vista', lastMessageAt: '1h',
        priority: 'medium', createdAt: '2025-02-27T07:45:00Z',
      },
    ],
  },
  {
    id: 's4', name: 'Aguardando Vendedor', color: '#06B6D4', position: 3, slaHours: 1,
    cards: [
      {
        id: 'c6', title: 'Patrícia Souza', contactName: 'Patrícia Souza', contactPhone: '+55 21 9 1122-3344',
        labels: ['Aguardando Vendedor', 'Alerta de Atraso'],
        customAttributes: { score_bant: 81, parcela_alvo: 2200 },
        stageId: 's4', stageName: 'Aguardando Vendedor',
        lastMessage: 'Alguém pode me ligar?', lastMessageAt: '8min',
        priority: 'urgent', createdAt: '2025-02-27T06:50:00Z',
      },
    ],
  },
  {
    id: 's5', name: 'Agendamentos', color: '#10B981', position: 4, slaHours: 48,
    cards: [
      {
        id: 'c7', title: 'Diego Ferreira', contactName: 'Diego Ferreira', contactPhone: '+55 41 9 9900-1122',
        labels: ['Agendamento', 'Agendado'],
        customAttributes: { score_bant: 88, vendedor_responsavel: 'Marcos Silva', data_retorno: '2025-02-28' },
        stageId: 's5', stageName: 'Agendamentos',
        lastMessage: 'Confirmado para amanhã às 10h', lastMessageAt: '2h',
        priority: 'high', createdAt: '2025-02-27T07:00:00Z',
      },
      {
        id: 'c12', title: 'Ricardo Nunes', contactName: 'Ricardo Nunes', contactPhone: '+55 41 9 8811-2233',
        labels: ['Agendamento', 'No-Show'],
        customAttributes: { score_bant: 60, vendedor_responsavel: 'Marcos Silva' },
        stageId: 's5', stageName: 'Agendamentos',
        lastMessage: 'Tive um imprevisto hoje...', lastMessageAt: '1h',
        priority: 'medium', createdAt: '2025-02-27T07:15:00Z',
      },
    ],
  },
  {
    id: 's6', name: 'Em Negociação', color: '#EAB308', position: 5, slaHours: null,
    cards: [
      {
        id: 'c8', title: 'Mariana Costa', contactName: 'Mariana Costa', contactPhone: '+55 51 9 3300-4455',
        labels: ['Em Negociação', 'Avaliando Usado'],
        customAttributes: { score_bant: 92, vendedor_responsavel: 'Julia Costa', veiculo_troca: 'Ford Ka 2020' },
        stageId: 's6', stageName: 'Em Negociação',
        lastMessage: 'O perito já olhou meu carro?', lastMessageAt: '30min',
        priority: 'urgent', createdAt: '2025-02-27T09:00:00Z',
      },
      {
        id: 'c9', title: 'Thiago Ramos', contactName: 'Thiago Ramos', contactPhone: '+55 61 9 8877-6655',
        labels: ['Em Negociação', 'Ficha em Análise'],
        customAttributes: { score_bant: 65, vendedor_responsavel: 'Marcos Silva', valor_sinal: 2000 },
        stageId: 's6', stageName: 'Em Negociação',
        lastMessage: 'Ficha enviada para análise no banco', lastMessageAt: '4h',
        priority: 'high', createdAt: '2025-02-26T14:00:00Z',
      },
    ],
  },
  {
    id: 's7', name: 'Vendidos', color: '#22C55E', position: 6, slaHours: null,
    cards: [
      {
        id: 'c10', title: 'Luciana Pereira', contactName: 'Luciana Pereira', contactPhone: '+55 11 9 6677-8899',
        labels: ['Vendidos', 'Aguardando Assinatura'],
        customAttributes: { score_bant: 95, vendedor_responsavel: 'Julia Costa', valor_sinal: 3000 },
        stageId: 's7', stageName: 'Vendidos',
        lastMessage: 'Sinal pago! Aguardando o contrato', lastMessageAt: '1d',
        priority: 'medium', createdAt: '2025-02-26T10:00:00Z',
      },
    ],
  },
  {
    id: 's8', name: 'Vendas Perdidas', color: '#EF4444', position: 7, slaHours: null,
    cards: [
      {
        id: 'c11', title: 'Paulo Nascimento', contactName: 'Paulo Nascimento', contactPhone: '+55 11 9 0011-2233',
        labels: ['Perdidos', 'Motivo: Sem Crédito'],
        customAttributes: { score_bant: 20, motivo_perda: 'Sem Crédito' },
        stageId: 's8', stageName: 'Vendas Perdidas',
        lastMessage: 'Banco reprovou o financiamento', lastMessageAt: '2d',
        priority: 'low', createdAt: '2025-02-25T16:00:00Z',
      },
    ],
  },
]

const motivosPerdaOptions = [
  'Sem Crédito',
  'Preço/Taxa',
  'Concorrente',
  'Desistiu',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTemperatureBadge(labels: string[]): { icon: string; color: string } | null {
  if (labels.includes('🔥 Quente')) return { icon: '🔥', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
  if (labels.includes('🟡 Morno'))  return { icon: '🟡', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' }
  if (labels.includes('❄️ Frio'))   return { icon: '❄️', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
  return null
}

function getActionLabels(labels: string[]): string[] {
  const skipLabels = new Set(['Suspect', 'Lead Identificado', 'MQL', 'SAL', 'Agendamento',
    'Visita/OPP', 'Negociação', 'Fechamento', 'Pós-Venda', 'Fidelização',
    '🔥 Quente', '🟡 Morno', '❄️ Frio', 'Venda Realizada', 'Perdido'])
  return labels.filter(l => !skipLabels.has(l))
}

function getBantBarColor(score: number): string {
  if (score >= 70) return '#22C55E'
  if (score >= 40) return '#3B82F6'
  return '#6B7280'
}

function getSlaStatus(stage: StageData, card: CardData): 'ok' | 'warning' | 'overdue' {
  if (!stage.slaHours) return 'ok'
  const created = new Date(card.createdAt).getTime()
  const now = Date.now()
  const hoursElapsed = (now - created) / 3600000
  if (hoursElapsed > stage.slaHours) return 'overdue'
  if (hoursElapsed > stage.slaHours * 0.8) return 'warning'
  return 'ok'
}

const slaStatusColors: Record<string, string> = {
  ok:      'text-green-400',
  warning: 'text-yellow-400',
  overdue: 'text-red-400 animate-pulse',
}

// ─── KPI Calculation ──────────────────────────────────────────────────────────

function computeKPIs(stages: StageData[]) {
  const allCards = stages.flatMap(s => s.cards)
  const totalActive = allCards.filter(c => !c.labels.includes('Perdido') && !c.labels.includes('Venda Realizada')).length
  const wonCards = stages.find(s => s.position === 7)?.cards.length ?? 0
  const sqlCards = stages.find(s => s.position === 4)?.cards.length ?? 0
  const conversion = sqlCards > 0 ? Math.round((wonCards / sqlCards) * 100) : 0
  const riskCards = allCards.filter(c => c.labels.includes('SLA Estourado') || c.labels.includes('[SLA Estourado]')).length
  const stagesWithSla = stages.filter(s => s.slaHours)
  const compliantStages = stagesWithSla.filter(s =>
    s.cards.every(c => getSlaStatus(s, c) === 'ok')
  ).length
  const slaCompliance = stagesWithSla.length > 0
    ? Math.round((compliantStages / stagesWithSla.length) * 100)
    : 100
  return { totalActive, conversion, slaCompliance, riskCards }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KanbanCard({ card, stage, onClick }: { card: CardData; stage: StageData; onClick: () => void }) {
  const temp = getTemperatureBadge(card.labels)
  const actionLabels = getActionLabels(card.labels)
  const score = card.customAttributes.score_bant ?? 0
  const slaStatus = getSlaStatus(stage, card)
  const isSlaOverdue = slaStatus === 'overdue'

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 text-left ${
        isSlaOverdue
          ? 'border-red-500/60 shadow-red-500/20 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {/* Row 1: Temperature + action labels */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {temp && (
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${temp.color}`}>
            {temp.icon}
          </span>
        )}
        {actionLabels.slice(0, 2).map(l => (
          <span key={l} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
            {l}
          </span>
        ))}
        {actionLabels.length > 2 && (
          <span className="text-xs text-gray-400">+{actionLabels.length - 2}</span>
        )}
      </div>

      {/* Row 2: Name + BANT score */}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">
          {card.contactName}
        </p>
        <span className="text-xs font-bold text-gray-500 shrink-0">
          {score > 0 ? `BANT: ${score}` : '—'}
        </span>
      </div>

      {/* BANT bar */}
      {score > 0 && (
        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full mb-2">
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${score}%`, backgroundColor: getBantBarColor(score) }}
          />
        </div>
      )}

      {/* Vehicle interest */}
      {(card.customAttributes.veiculo_troca || card.customAttributes.utm_campaign) && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">
          🚗 {card.customAttributes.veiculo_troca ?? card.customAttributes.utm_campaign}
        </p>
      )}

      {/* Row 3: Time + Vendedor */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {card.lastMessageAt} atrás
        </span>
        {card.customAttributes.vendedor_responsavel && (
          <span className="truncate ml-2 max-w-[80px]">
            {card.customAttributes.vendedor_responsavel.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  )
}

function SlaStageBadge({ stage }: { stage: StageData }) {
  if (!stage.slaHours) return null
  const hasOverdue = stage.cards.some(c => getSlaStatus(stage, c) === 'overdue')
  const hasWarning = stage.cards.some(c => getSlaStatus(stage, c) === 'warning')
  const status = hasOverdue ? 'overdue' : hasWarning ? 'warning' : 'ok'
  return (
    <span className={`text-xs ${slaStatusColors[status]}`}>
      {status === 'overdue' ? '🔴' : status === 'warning' ? '🟡' : '🟢'} SLA {stage.slaHours}h
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FunilAvancado() {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [editAttrs, setEditAttrs] = useState<CardData['customAttributes']>({})

  function openCard(card: CardData) {
    setSelectedCard(card)
    setEditAttrs({ ...card.customAttributes })
  }

  const kpis = computeKPIs(mockStages)

  const kpiCards = [
    {
      label: 'Total no Funil', value: kpis.totalActive.toString(),
      delta: 'leads ativos', icon: Users, color: 'blue',
    },
    {
      label: 'Conversão SQL→Won', value: `${kpis.conversion}%`,
      delta: 'taxa de fechamento', icon: TrendingUp, color: 'green',
    },
    {
      label: 'SLA Compliance', value: `${kpis.slaCompliance}%`,
      delta: 'dentro do prazo', icon: ShieldCheck, color: 'violet',
    },
    {
      label: 'Leads em Risco', value: kpis.riskCards.toString(),
      delta: 'SLA estourado', icon: AlertTriangle, color: 'orange',
    },
  ]

  const colorMap: Record<string, string> = {
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }

  // removed funnelData (horizontal bar logic)

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Funil Avançado</h1>
        <p className="text-sm text-gray-500 mt-1">
          Jornada completa — 12 estágios · Sistema 3 Camadas de Tags · Integração Chatwoot
        </p>
      </div>

      {/* ── Seção 1: KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, delta, icon: Icon, color }) => (
          <div key={label} className={`relative rounded-xl border p-5 ${colorMap[color]}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                <p className="text-xs text-gray-400 mt-2">{delta}</p>
              </div>
              <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Seção 2: Gráfico de Funil (SVG Customizado) ─────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </span>
            Sales Funnel Analytics
          </h2>
          <select className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 outline-none hover:bg-gray-50 dark:hover:bg-gray-700">
            <option>Esta Semana</option>
            <option>Mês Passado</option>
          </select>
        </div>

        <div className="relative w-full overflow-x-auto custom-scrollbar pb-6">
          {/* Header Row: Metrics */}
          <div className="grid grid-cols-7 min-w-[900px] mb-4">
            {mockStages.slice(0, 7).map((stage, i) => (
              <div key={stage.id} className="flex flex-col pl-4 border-l border-gray-100 dark:border-gray-800 first:border-l-0">
                <span className="text-xs font-medium text-gray-500 mb-1 truncate pr-2">{stage.name}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stage.cards.length}</span>
                  <span className={`text-xs font-semibold ${i % 2 === 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {i % 2 === 0 ? `↑ ${Math.floor(Math.random() * 15) + 5}%` : `↓ ${Math.floor(Math.random() * 10) + 2}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Percentage Row */}
          <div className="grid grid-cols-7 min-w-[900px] h-6 mb-2">
            {mockStages.slice(0, 7).map((stage, i) => {
              const prevCards = i === 0 ? stage.cards.length : mockStages[i - 1].cards.length;
              const rate = prevCards > 0 ? Math.round((stage.cards.length / prevCards) * 100) : 0;
              return (
                <div key={`pct-${stage.id}`} className="relative">
                  {i > 0 && (
                    <span className="absolute -left-4 top-0 text-xs font-semibold text-gray-400">
                      {rate}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* SVG Funnel Shape */}
          <div className="relative w-full min-w-[900px] h-32">
            <svg viewBox={`0 0 ${7 * 100} 100`} width="100%" height="100%" preserveAspectRatio="none" className="drop-shadow-md">
              {mockStages.slice(0, 7).map((stage, i, arr) => {
                const maxCount = Math.max(...arr.map(s => s.cards.length), 1);
                const count = stage.cards.length;
                const nextStage = arr[i + 1];
                const nextCount = nextStage ? nextStage.cards.length : count;
                
                // Colors for gradient transition
                const currentColor = stage.color || '#3B82F6';
                const nextColor = nextStage ? (nextStage.color || currentColor) : currentColor;
                const gradId = `grad-${stage.id}`;
                
                // Calculando proporções (mínimo de 10% de altura)
                const h1 = Math.max((count / maxCount) * 100, 10);
                const h2 = Math.max((nextCount / maxCount) * 100, 10);

                const w = 100;
                const x1 = i * w;
                const x2 = (i + 1) * w;
                
                // Centered Y points
                const y1_top = 50 - (h1 / 2);
                const y1_bottom = 50 + (h1 / 2);
                const y2_top = 50 - (h2 / 2);
                const y2_bottom = 50 + (h2 / 2);

                return (
                  <g key={`poly-group-${stage.id}`}>
                    <defs>
                      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={currentColor} />
                        <stop offset="100%" stopColor={nextColor} />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`${x1},${y1_top} ${x2},${y2_top} ${x2},${y2_bottom} ${x1},${y1_bottom}`}
                      fill={`url(#${gradId})`}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="0.5"
                      className="transition-all duration-500 hover:opacity-90"
                    />
                  </g>
                );
              })}
            </svg>
            
            {/* Background grid lines matching the borders */}
            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
              {mockStages.slice(0, 7).map((stage) => (
                <div key={`grid-${stage.id}`} className="border-l border-white/20 dark:border-gray-800/50 first:border-l-0" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Seção 3: Kanban Visual ────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-4">
          Kanban — Visão Operacional
        </p>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {mockStages.map(stage => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-col"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate flex-1">
                    {stage.name.replace(' ✅', '').replace(' ❌', '')}
                  </p>
                  <span className="text-xs font-bold text-gray-500 shrink-0 ml-auto">
                    {stage.cards.length}
                  </span>
                </div>
                <SlaStageBadge stage={stage} />
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-96 custom-scrollbar">
                {stage.cards.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                    Nenhum lead
                  </p>
                ) : (
                  stage.cards.map(card => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      stage={stage}
                      onClick={() => openCard(card)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SlidePanel: Card Detail ───────────────────────────────────────── */}
      <SlidePanel
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title={selectedCard?.contactName ?? ''}
      >
        {selectedCard && (
          <div className="p-5 space-y-6">
            {/* Contact Info */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Contato
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold">
                  {selectedCard.contactName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {selectedCard.contactName}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone size={10} /> {selectedCard.contactPhone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <ArrowRight size={10} />
                  {selectedCard.stageName}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                "{selectedCard.lastMessage}"
              </p>
            </div>

            {/* BANT Score */}
            {(selectedCard.customAttributes.score_bant ?? 0) > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  BANT Score
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: getBantBarColor(selectedCard.customAttributes.score_bant ?? 0) }}
                  >
                    {selectedCard.customAttributes.score_bant}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${selectedCard.customAttributes.score_bant}%`,
                          backgroundColor: getBantBarColor(selectedCard.customAttributes.score_bant ?? 0),
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {(selectedCard.customAttributes.score_bant ?? 0) >= 70
                        ? 'Lead qualificado para abordagem'
                        : (selectedCard.customAttributes.score_bant ?? 0) >= 40
                        ? 'Potencial — continuar qualificando'
                        : 'Perfil frio — nutrir com conteúdo'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Labels */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Tags Ativas
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCard.labels.map(label => (
                  <span
                    key={label}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700"
                  >
                    {label}
                    <button className="text-gray-400 hover:text-red-400 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Campos Customizados
              </h3>

              {/* Vendedor */}
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <User size={10} /> Vendedor Responsável
                </label>
                <input
                  type="text"
                  value={editAttrs.vendedor_responsavel ?? ''}
                  onChange={e => setEditAttrs(p => ({ ...p, vendedor_responsavel: e.target.value }))}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nome do vendedor"
                />
              </div>

              {/* Data de Retorno */}
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={10} /> Data de Retorno
                </label>
                <input
                  type="date"
                  value={editAttrs.data_retorno ?? ''}
                  onChange={e => setEditAttrs(p => ({ ...p, data_retorno: e.target.value }))}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Motivo da Perda (only show for relevant stages) */}
              {selectedCard.labels.includes('Perdido') && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <ThumbsDown size={10} /> Motivo da Perda
                  </label>
                  <select
                    value={editAttrs.motivo_perda ?? ''}
                    onChange={e => setEditAttrs(p => ({ ...p, motivo_perda: e.target.value }))}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecionar motivo...</option>
                    {motivosPerdaOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parcela Alvo */}
              {(editAttrs.parcela_alvo || selectedCard.labels.some(l => l.includes('Parcela'))) && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Parcela Alvo (R$)</label>
                  <input
                    type="number"
                    value={editAttrs.parcela_alvo ?? ''}
                    onChange={e => setEditAttrs(p => ({ ...p, parcela_alvo: Number(e.target.value) }))}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: 1800"
                  />
                </div>
              )}

              {/* Sinal Pago */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sinal Pago (R$)</label>
                <input
                  type="number"
                  value={editAttrs.valor_sinal ?? ''}
                  onChange={e => setEditAttrs(p => ({ ...p, valor_sinal: Number(e.target.value) }))}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: 1000"
                />
              </div>

              {/* UTM Source (read-only) */}
              {editAttrs.utm_source && (
                <div className="text-xs text-gray-500 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <span className="font-medium">Origem:</span>
                  <span>{editAttrs.utm_source}</span>
                  {editAttrs.utm_campaign && (
                    <>
                      <ChevronRight size={10} />
                      <span>{editAttrs.utm_campaign}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* History (static preview) */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Histórico de Movimentações
              </h3>
              <div className="space-y-2">
                {[
                  { action: 'Criado via webhook Chatwoot', stage: 'Suspect (Opt-in)', time: '2 dias atrás' },
                  { action: 'Movido para', stage: selectedCard.stageName, time: '1 dia atrás' },
                ].map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <span>{h.action} </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{h.stage}</span>
                      <span className="text-gray-400 ml-1">· {h.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Ações Rápidas
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Agendar Visita', icon: Calendar, color: 'text-green-400 border-green-500/30 hover:bg-green-500/10' },
                  { label: 'Marcar No-Show', icon: ThumbsDown, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10' },
                  { label: 'Passar para Vendas', icon: ArrowRight, color: 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10' },
                ].map(({ label, icon: Icon, color }) => (
                  <button
                    key={label}
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors ${color} bg-transparent`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button className="w-full text-sm py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
              Salvar Alterações
            </button>
          </div>
        )}
      </SlidePanel>
    </div>
  )
}
