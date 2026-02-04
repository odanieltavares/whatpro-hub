import React, { useState } from 'react';
import { PRISMA_SCHEMA_SPEC } from '../backend_specs/prismaSchema';
import { SYNC_SERVICE_CODE } from '../backend_specs/syncService';
import { ANTI_GRAVITY_CODE } from '../backend_specs/antiGravity';
import { Copy, Check, Database, Activity, ShieldAlert } from 'lucide-react';

const CodeBlock = ({ code, language = 'typescript' }: { code: string, language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-slate-900 text-slate-50 mt-4">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          title="Copiar código"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

export const ArchitectureViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schema' | 'sync' | 'antigravity'>('schema');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Especificações de Arquitetura Backend</h2>
        <p className="text-gray-600 mt-2">
          Abaixo estão os artefatos técnicos gerados para a implementação do middleware (Node.js/Prisma).
        </p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-3 px-4 flex items-center space-x-2 font-medium transition-colors border-b-2 ${
            activeTab === 'schema' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={18} />
          <span>Step 1: Prisma Schema</span>
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-3 px-4 flex items-center space-x-2 font-medium transition-colors border-b-2 ${
            activeTab === 'sync' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity size={18} />
          <span>Step 2 & 4: Sync & Notes</span>
        </button>
        <button
          onClick={() => setActiveTab('antigravity')}
          className={`pb-3 px-4 flex items-center space-x-2 font-medium transition-colors border-b-2 ${
            activeTab === 'antigravity' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert size={18} />
          <span>Step 3: Anti-Gravity</span>
        </button>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'schema' && (
          <div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h3 className="font-semibold text-blue-900">Estratégia de Shadow Database</h3>
              <p className="text-sm text-blue-800">
                O modelo <code>Card</code> replica o estado da conversa localmente, permitindo consultas rápidas para o Kanban sem sobrecarregar a API do Chatwoot.
              </p>
            </div>
            <CodeBlock code={PRISMA_SCHEMA_SPEC} language="prisma" />
          </div>
        )}

        {activeTab === 'sync' && (
          <div>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <h3 className="font-semibold text-green-900">Sincronização Bidirecional</h3>
              <p className="text-sm text-green-800">
                O <code>ChatwootSyncService</code> lida com Webhooks recebidos. Observe o método <code>determineColumnByTags</code> que implementa a lógica: <strong>IF tag == 'x' THEN move column</strong>.
              </p>
            </div>
            <CodeBlock code={SYNC_SERVICE_CODE} />
          </div>
        )}

        {activeTab === 'antigravity' && (
          <div>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
              <h3 className="font-semibold text-amber-900">Resiliência (Anti-Gravity)</h3>
              <p className="text-sm text-amber-800">
                Implementação de fila com <strong>Retry Pattern</strong> e <strong>Exponential Backoff</strong>. Garante que se o Chatwoot estiver fora do ar, o estado do Kanban não é perdido.
              </p>
            </div>
            <CodeBlock code={ANTI_GRAVITY_CODE} />
          </div>
        )}
      </div>
    </div>
  );
};
