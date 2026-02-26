import { useState } from 'react'
import { Phone, Mic, Image as ImageIcon, MessageSquare, ChevronRight, Activity, CalendarClock } from 'lucide-react'
import { SlidePanel } from '../components/SlidePanel'

const conversations = [
  {
    id: '1', phone: '+55 11 9 8765-4321', nome: 'João Silva', intent: 'Compra 0km',
    interesse: 'Corolla Cross', score: 82, classification: 'sql',
    lastMsg: 'Quero ver ele pessoalmente ainda essa semana', tempo: '2min',
    hasAudio: true, hasImage: false, tenant: 'Auto Premium'
  },
  {
    id: '2', phone: '+55 21 9 9988-7766', nome: 'Maria Costa', intent: 'Troca',
    interesse: 'Compass', score: 61, classification: 'mql',
    lastMsg: 'Mandei a foto do meu carro — ele tá em bom estado', tempo: '8min',
    hasAudio: false, hasImage: true, tenant: 'Garage Motors'
  },
  {
    id: '3', phone: '+55 11 9 3344-5566', nome: 'Pedro Lima', intent: 'Simulação',
    interesse: 'T-Cross', score: 33, classification: 'cold',
    lastMsg: 'Só quero ver quanto fica a parcela', tempo: '15min',
    hasAudio: false, hasImage: false, tenant: 'Centro Auto'
  },
  {
    id: '4', phone: '+55 31 9 7788-9900', nome: 'Ana Souza', intent: 'Compra Seminovo',
    interesse: 'Creta', score: 75, classification: 'sql',
    lastMsg: 'Posso ir amanhã de manhã', tempo: '22min',
    hasAudio: true, hasImage: false, tenant: 'Auto Premium'
  },
]

const classColor: Record<string, string> = {
  sql:  'bg-green-500/10 text-green-500 dark:text-green-400 border-green-500/20',
  mql:  'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
  cold: 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600',
}

export default function Leads() {
  const [selectedLead, setSelectedLead] = useState<typeof conversations[0] | null>(null)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads & Conversas</h1>
        <p className="text-sm text-gray-500 mt-1">Feed live de interações com BANT score calculado</p>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 custom-scrollbar">
        {['Todos', 'SQL', 'MQL', 'Cold'].map(f => (
          <button key={f} className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ${f === 'Todos' ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-300'}`}>
            {f}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-600">{conversations.length} conversas ativas</div>
      </div>

      {/* Lead cards */}
      <div className="space-y-3">
        {conversations.map(c => (
          <div 
            key={c.id} 
            onClick={() => setSelectedLead(c)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-xl p-4 md:p-5 cursor-pointer transition-all group shadow-sm"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                {c.nome.charAt(0)}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.nome}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-600">
                    <Phone size={10} className="inline mr-1" />{c.phone}
                  </span>
                  {/* Media badges */}
                  {c.hasAudio && <span className="flex items-center gap-1 text-xs text-violet-500 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded"><Mic size={10} /> Áudio</span>}
                  {c.hasImage && <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded"><ImageIcon size={10} /> Foto</span>}
                  <span className="md:ml-auto text-xs text-gray-500 dark:text-gray-600">{c.tempo} atrás</span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  <MessageSquare size={12} className="inline mr-1.5 text-gray-400 dark:text-gray-600" />
                  {c.lastMsg}
                </p>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 mt-3">
                  <span className="text-xs text-gray-500 dark:text-gray-600">Interesse: <span className="text-gray-900 dark:text-gray-300 font-medium">{c.interesse}</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-600">Intenção: <span className="text-gray-900 dark:text-gray-300 font-medium">{c.intent}</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-600">{c.tenant}</span>
                </div>
              </div>

              {/* Score + Classification */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border uppercase tracking-wide ${classColor[c.classification]}`}>
                  {c.classification}
                </span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.score}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-600">BANT Score</p>
                </div>
                {/* Score bar */}
                <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.score >= 70 ? 'bg-green-500' : c.score >= 40 ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              </div>

              <ChevronRight size={16} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors self-center shrink-0 hidden md:block" />
            </div>
          </div>
        ))}
      </div>
      <SlidePanel 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)}
        title="Detalhes do Lead"
      >
        {selectedLead && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl">
                {selectedLead.nome.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedLead.nome}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-mono text-sm mt-1">{selectedLead.phone}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide ${classColor[selectedLead.classification]}`}>
                    {selectedLead.classification}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                    Loja: {selectedLead.tenant}
                  </span>
                </div>
              </div>
            </div>

            {/* BANT & Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-1">BANT Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedLead.score}</p>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${selectedLead.score >= 70 ? 'bg-green-500' : selectedLead.score >= 40 ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-500'}`} style={{ width: `${selectedLead.score}%` }} />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Interesse Central</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedLead.interesse}</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 flex items-center gap-1"><Activity size={12} /> {selectedLead.intent}</p>
              </div>
            </div>

            {/* AI Context Analysis */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} /> Análise Multimodal IA
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
                {selectedLead.hasAudio && (
                  <div className="relative pl-4 border-l-2 border-violet-400 dark:border-violet-500/50">
                    <p className="text-xs font-mono text-violet-600 dark:text-violet-400 mb-1 flex items-center gap-1"><Mic size={12}/> Whisper ASR</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"Gostaria de saber se aceitam troca no meu veículo atual."</p>
                  </div>
                )}
                
                {selectedLead.hasImage && (
                  <div className="relative pl-4 border-l-2 border-blue-400 dark:border-blue-500/50">
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><ImageIcon size={12}/> LLaVA Vision</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Veículo Compass preto. Lataria em bom estado. Não apresenta marcas severas no pára-choque frontal visível.</p>
                  </div>
                )}

                <div className="relative pl-4 border-l-2 border-green-400 dark:border-green-500/50">
                  <p className="text-xs font-mono text-green-600 dark:text-green-400 mb-1 flex items-center gap-1"><Activity size={12}/> GLiNER Extraction</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Intenção forte capturada. Orçamento inferido condiz com a faixa do {selectedLead.interesse}.</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <MessageSquare size={16} /> Abrir Chatwoot
              </button>
              <button className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 transition-colors">
                <CalendarClock size={16} /> Agendar Visita
              </button>
            </div>
            
          </div>
        )}
      </SlidePanel>

    </div>
  )
}
