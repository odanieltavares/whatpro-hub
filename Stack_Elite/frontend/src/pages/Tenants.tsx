import { useState } from 'react'
import { Plus, Settings, Wifi, Building2, Save } from 'lucide-react'
import { Modal } from '../components/Modal'
import { SlidePanel } from '../components/SlidePanel'

const mockTenants = [
  { id: '1', nome_loja: 'Auto Premium Elite', tom_de_voz: 'Consultivo', leads: 142, sqls: 29, status: 'active', whisper: true, vision: true },
  { id: '2', nome_loja: 'Garage Motors SP', tom_de_voz: 'Popular', leads: 98, sqls: 15, status: 'active', whisper: true, vision: false },
  { id: '3', nome_loja: 'Centro Auto Campinas', tom_de_voz: 'Agressivo', leads: 67, sqls: 8, status: 'active', whisper: false, vision: false },
]

export default function Tenants() {
  const [tenants] = useState(mockTenants)
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false)
  const [selectedTenantConfig, setSelectedTenantConfig] = useState<typeof mockTenants[0] | null>(null)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lojas (Tenants)</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie as concessionárias na plataforma</p>
        </div>
        <button 
          onClick={() => setIsNewTenantModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Nova Loja
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tenants.map(t => (
          <div key={t.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg flex items-center justify-center">
                  <Building2 size={22} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t.nome_loja}</h3>
                  <p className="text-sm text-gray-500">Tom de Voz: <span className="text-gray-900 dark:text-gray-300 font-medium">{t.tom_de_voz}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  ● Ativo
                </span>
                <button 
                  onClick={() => setSelectedTenantConfig(t)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Leads</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{t.leads}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">SQLs</p>
                <p className="text-xl font-bold text-green-500 dark:text-green-400">{t.sqls}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Conv. Rate</p>
                <p className="text-xl font-bold text-blue-500 dark:text-blue-400">{Math.round(t.sqls / t.leads * 100)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Módulos Ativos</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${t.whisper ? 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-500'}`}>
                    <Wifi size={11} /> Whisper
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${t.vision ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-500'}`}>
                    Vision
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SlidePanel Configuração do Tenant */}
      <SlidePanel
        isOpen={!!selectedTenantConfig}
        onClose={() => setSelectedTenantConfig(null)}
        title="Configurações da Loja"
      >
        {selectedTenantConfig && (
           <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
                 <Building2 className="w-8 h-8 text-blue-500 dark:text-blue-400 p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg" />
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTenantConfig.nome_loja}</h3>
                   <p className="text-xs text-green-500 dark:text-green-400">Status: Ativo</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div>
                   <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nome da Loja</label>
                   <input type="text" defaultValue={selectedTenantConfig.nome_loja} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tone of Voice (Estilo de Atendimento)</label>
                   <select defaultValue={selectedTenantConfig.tom_de_voz} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none">
                      <option>Consultivo</option>
                      <option>Agressivo</option>
                      <option>Popular</option>
                   </select>
                 </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                 <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Módulos Inteligentes Ativos</h4>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3">
                       <input type="checkbox" defaultChecked={selectedTenantConfig.whisper} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white dark:bg-gray-950 dark:border-gray-700" />
                       <span className="text-sm text-gray-700 dark:text-gray-300">Transcrição de Áudio (Whisper)</span>
                    </label>
                    <label className="flex items-center gap-3">
                       <input type="checkbox" defaultChecked={selectedTenantConfig.vision} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white dark:bg-gray-950 dark:border-gray-700" />
                       <span className="text-sm text-gray-700 dark:text-gray-300">Análise de Imagem (LLaVA)</span>
                    </label>
                 </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 mt-8 transition-colors">
                <Save size={16} /> Salvar Alterações
              </button>
           </div>
        )}
      </SlidePanel>

      {/* Modal Nova Loja */}
      <Modal
        isOpen={isNewTenantModalOpen}
        onClose={() => setIsNewTenantModalOpen(false)}
        title="Cadastrar Nova Loja"
      >
        <div className="space-y-4">
          <div>
             <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nome Fantasia</label>
             <input type="text" placeholder="Ex: Motors Auto" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
             <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">CNPJ</label>
             <input type="text" placeholder="00.000.000/0001-00" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" />
          </div>
          
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-4"
            onClick={() => setIsNewTenantModalOpen(false)}
          >
            Cadastrar Loja
          </button>
        </div>
      </Modal>

    </div>
  )
}
