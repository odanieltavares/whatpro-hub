import { useState } from 'react'
import { Search, Plus, Check, Clock, Users, User, ShieldCheck } from 'lucide-react'
import { SlidePanel } from '../components/SlidePanel'
import { Modal } from '../components/Modal'

const vehicles = [
  { id: '1', marca: 'Toyota', modelo: 'Corolla Cross', versao: 'XRE 2.0', ano: 2024, cor: 'Prata', preco: 'R$ 175.990', km: 0, status: 'DISPONIVEL', interest_count: 3, interested_clients: ['João', 'Maria', 'Pedro'] },
  { id: '2', marca: 'Volkswagen', modelo: 'T-Cross', versao: 'Comfortline 1.4', ano: 2023, cor: 'Branco', preco: 'R$ 138.500', km: 12400, status: 'DISPONIVEL', interest_count: 1, interested_clients: ['Lucas'] },
  { id: '3', marca: 'Jeep', modelo: 'Compass', versao: 'Limited Diesel', ano: 2023, cor: 'Preto', preco: 'R$ 229.990', km: 8000, status: 'DISPONIVEL', interest_count: 0, interested_clients: [] },
  { id: '4', marca: 'Chevrolet', modelo: 'Onix', versao: 'LTZ 1.0 Turbo', ano: 2024, cor: 'Vermelho', preco: 'R$ 97.990', km: 0, status: 'RESERVADO', interest_count: 4, reservation: { client: 'Ana Souza', salesperson: 'Carlos', has_downpayment: true } },
  { id: '5', marca: 'Hyundai', modelo: 'Creta', versao: 'Ultimate 2.0', ano: 2023, cor: 'Azul', preco: 'R$ 168.900', km: 22100, status: 'DISPONIVEL', interest_count: 2, interested_clients: ['Rafael', 'Juliana'] },
]

export default function Inventory() {
  const [selectedVehicle, setSelectedVehicle] = useState<typeof vehicles[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque de Veículos</h1>
          <p className="text-sm text-gray-500 mt-1">Veículos indexados no pgvector para busca semântica</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Adicionar Veículo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          placeholder="Busca semântica (ex: SUV espaçoso até 180k prata...)"
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3">Veículo</th>
              <th className="text-left px-5 py-3">Versão</th>
              <th className="text-left px-5 py-3">Ano / KM</th>
              <th className="text-left px-5 py-3">Preço</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Interesse / Reserva</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr 
                key={v.id} 
                onClick={() => setSelectedVehicle(v)}
                className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{v.marca} {v.modelo}</div>
                  <div className="text-xs text-gray-500">{v.cor}</div>
                </td>
                <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{v.versao}</td>
                <td className="px-5 py-4">
                  <div className="text-gray-800 dark:text-gray-300">{v.ano}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-600">{v.km === 0 ? '0 km' : `${v.km.toLocaleString('pt-BR')} km`}</div>
                </td>
                <td className="px-5 py-4 font-medium text-green-600 dark:text-green-400">{v.preco}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                    v.status === 'DISPONIVEL'
                      ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                      : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20'
                  }`}>
                    {v.status === 'DISPONIVEL' ? <Check size={11} /> : <Clock size={11} />}
                    {v.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {v.status === 'RESERVADO' && v.reservation ? (
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                        <User size={12} className="text-blue-500 dark:text-blue-400" />
                        {v.reservation.client}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Vendedor: {v.reservation.salesperson}</div>
                      {v.reservation.has_downpayment && <div className="text-emerald-600 dark:text-emerald-400 font-medium">Sinal Pago</div>}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Users size={12} className={v.interest_count > 0 ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"}/>
                        {v.interest_count} interessados
                      </div>
                      {v.interest_count > 0 && (
                        <div className="text-gray-500 truncate max-w-[150px]">
                          {v.interested_clients?.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-600 text-center">5 veículos carregados — conectar ao mcp-stock para dados reais</p>
      
      {/* Detalhes do Veículo (Slide Panel) */}
      <SlidePanel
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title="Ficha do Veículo"
      >
        {selectedVehicle && (
          <div className="space-y-8">
            {/* Cabecalho Veículo */}
            <div className="flex gap-4 items-start border-b border-gray-200 dark:border-gray-800 pb-6">
               <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-2xl text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                {selectedVehicle.marca.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedVehicle.marca} {selectedVehicle.modelo}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedVehicle.versao}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono border border-gray-300 dark:border-gray-700">{selectedVehicle.ano}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono border border-gray-300 dark:border-gray-700">{selectedVehicle.km.toLocaleString('pt-BR')} km</span>
                </div>
              </div>
            </div>

            {/* Status e Preço */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Valor Venda</p>
                <p className="text-2xl font-bold text-green-500 dark:text-green-400">{selectedVehicle.preco}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                 <p className="text-xs text-gray-500 mb-1">Status</p>
                 <span className={`inline-flex w-fit items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                    selectedVehicle.status === 'DISPONIVEL'
                      ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                      : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20'
                  }`}>
                    {selectedVehicle.status === 'DISPONIVEL' ? <Check size={11} /> : <Clock size={11} />}
                    {selectedVehicle.status}
                  </span>
              </div>
            </div>

            {/* Fila de Interessados / Reserva */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                <Users size={16} className="text-blue-500 dark:text-blue-400" /> Pipeline de Interessados ({selectedVehicle.interest_count})
              </h4>

              {selectedVehicle.status === 'RESERVADO' && selectedVehicle.reservation ? (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 p-4 rounded-xl">
                   <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2 mb-2"><ShieldCheck size={16}/> Em Negociação Exclusiva</p>
                   <div className="space-y-2 mt-3 text-sm">
                      <div className="flex justify-between border-b border-yellow-200/50 dark:border-yellow-500/10 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                        <span className="text-gray-900 dark:text-gray-200 font-medium">{selectedVehicle.reservation.client}</span>
                      </div>
                      <div className="flex justify-between border-b border-yellow-200/50 dark:border-yellow-500/10 pb-2">
                        <span className="text-gray-600 dark:text-gray-400">Vendedor Relacionado:</span>
                        <span className="text-gray-900 dark:text-gray-200">{selectedVehicle.reservation.salesperson}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status Sinal:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Lançado no CRM</span>
                      </div>
                   </div>
                </div>
              ) : selectedVehicle.interest_count > 0 ? (
                <div className="space-y-2">
                  {selectedVehicle.interested_clients?.map((cl, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">{cl.charAt(0)}</div>
                        <span className="text-sm text-gray-900 dark:text-gray-200">{cl}</span>
                      </div>
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Ver Proposta</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                   Nenhum lead quente para este veículo ainda.
                </div>
              )}
            </div>

          </div>
        )}
      </SlidePanel>

      {/* Modal Adicionar Veículo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Carga de Veículo (MCP)"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Para adicionar veículos, utilize o endpoint de batch via n8n ou registre o JSON com as características do carro. Ele será processado pelo pgvector e bge-reranker.</p>
          <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
            <pre className="text-xs font-mono text-gray-600 dark:text-gray-400">
{`{
  "marca": "Nova Marca",
  "modelo": "Novo Modelo",
  "ano": 2024,
  "descritivo": "Para embedding semântico...",
  "tenant": "id-loja"
}`}
            </pre>
          </div>
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-4"
            onClick={() => setIsModalOpen(false)}
          >
            Entendido
          </button>
        </div>
      </Modal>

    </div>
  )
}
