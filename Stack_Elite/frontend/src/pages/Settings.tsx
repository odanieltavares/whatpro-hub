import { useState } from 'react'
import { Save, Webhook, Link2, Key, MessageSquare, Plus, Trash2 } from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('chatwoot')

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações & Integrações</h1>
          <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">Gerencie chaves de API, webhooks e provedores</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 custom-scrollbar">
            <button
              onClick={() => setActiveTab('chatwoot')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'chatwoot'
                  ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              <MessageSquare size={18} /> Chatwoot
            </button>
            <button
              onClick={() => setActiveTab('agent_tools')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'agent_tools'
                  ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              <Webhook size={18} /> Ferramentas do Agente
            </button>
            <button
              disabled
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed border border-transparent whitespace-nowrap"
            >
              <Key size={18} /> API Keys Internas <span className="text-[10px] ml-auto bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">Em breve</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:p-6 shadow-sm overflow-hidden">
          {activeTab === 'chatwoot' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="text-blue-500 dark:text-blue-400" /> API Chatwoot (Global)
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">Configuração necessária para o mcp-chatwoot operar as respostas e labels.</p>
                </div>
              </div>

              <div className="space-y-5">
                 <div>
                   <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Chatwoot Base URL</label>
                   <input 
                      type="url" 
                      placeholder="https://chat.suaempresa.com.br" 
                      defaultValue="http://localhost:3000"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" 
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Platform Access Token (Bot Token)</label>
                   <input 
                      type="password" 
                      placeholder="w7xyz..." 
                      defaultValue="dummy_token_123"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" 
                   />
                   <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">Found in Profile Settings &gt; Access Token.</p>
                 </div>

                 <div className="pt-2">
                   <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Mapeamento de Bot por Tenant</h3>
                   <p className="text-xs text-gray-600 dark:text-gray-500 mb-3">Mapeie qual Agent Bot (Inbox) do Chatwoot responde por qual Loja (Tenant) na nossa aplicação.</p>
                   
                   <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden overflow-x-auto custom-scrollbar">
                     <table className="w-full text-sm min-w-[500px]">
                        <thead className="bg-gray-100 dark:bg-gray-800/50">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">Tenant (Loja ID)</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">Chatwoot Account ID</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">Chatwoot Inbox ID</th>
                            <th className="w-16 border-b border-gray-200 dark:border-gray-800"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50 bg-white dark:bg-gray-900">
                          <tr>
                            <td className="px-4 py-2">
                              <select className="w-full bg-transparent border-0 text-gray-900 dark:text-gray-300 focus:ring-0 p-0 text-sm">
                                <option>Auto Premium Elite (1)</option>
                                <option>Garage Motors SP (2)</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                               <input type="text" defaultValue="1" className="w-full bg-transparent border-0 text-gray-900 dark:text-gray-300 focus:ring-0 p-0 text-sm" />
                            </td>
                            <td className="px-4 py-2">
                               <input type="text" defaultValue="15" className="w-full bg-transparent border-0 text-gray-900 dark:text-gray-300 focus:ring-0 p-0 text-sm" />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14}/></button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">
                              <select className="w-full bg-transparent border-0 text-gray-900 dark:text-gray-300 focus:ring-0 p-0 text-sm">
                                <option>Garage Motors SP (2)</option>
                                <option>Auto Premium Elite (1)</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                               <input type="text" defaultValue="1" className="w-full bg-transparent border-0 text-gray-900 dark:text-gray-300 focus:ring-0 p-0 text-sm" />
                            </td>
                            <td className="px-4 py-2">
                               <input type="text" defaultValue="18" className="w-full bg-transparent border-0 text-gray-900 dark:text-gray-300 focus:ring-0 p-0 text-sm" />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14}/></button>
                            </td>
                          </tr>
                        </tbody>
                     </table>
                     <div className="bg-gray-50 dark:bg-gray-800/30 px-4 py-2 border-t border-gray-200 dark:border-gray-800">
                       <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-medium">
                         <Plus size={14} /> Adicionar Mapeamento
                       </button>
                     </div>
                   </div>
                 </div>

                 <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <Save size={16} /> Salvar Parâmetros
                    </button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'agent_tools' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Webhook className="text-purple-500 dark:text-purple-400" /> Integrações e Capacidades do SDR
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">Habilite ferramentas externas para o seu Agente utilizar durante as conversas (via MCP).</p>
                </div>
              </div>

              {/* Integração: Google Calendar */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 space-y-5 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agendamento Automático (Google Calendar)</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">O Agente poderá buscar horários livres, sugerir datas e marcar reuniões/test-drives diretamente na agenda.</p>
                  </div>
                  {/* Fake Shadcn Switch */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">ID da Agenda Principal (Email)</label>
                    <input 
                      type="text" 
                      placeholder="agenda@sualoja.com.br" 
                      defaultValue="comercial@sualoja.com.br"
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Duração Padrão Evento (minutos)</label>
                    <input 
                      type="number" 
                      placeholder="60" 
                      defaultValue="60"
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <a href="#" className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-400 transition-colors">
                    <Link2 size={13} /> Conectar Conta do Google Pessoal
                  </a>
                </div>
              </div>

              {/* Integração: Google Maps */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 space-y-5 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Geolocalização (Google Maps)</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Permite ao agente gerar e enviar links de rotas/mapa exato da loja sob demanda.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Endereço Físico Completo (Para Router/GPS)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Av. das Américas, 3000 - Barra da Tijuca, Rio de Janeiro" 
                    defaultValue="Av. das Américas, 3000 - Barra da Tijuca, Rio de Janeiro"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:outline-none" 
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">Este endereço será atrelado à Tool 'get_store_location' para orientar os clientes.</p>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Save size={16} /> Salvar MCP Tools
                </button>
              </div>

            </div>
          )}
      </div>
    </div>
    </div>
  )
}
