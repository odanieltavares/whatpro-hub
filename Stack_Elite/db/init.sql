-- =================================================================================
-- INITIALIZATION SCRIPT FOR POSTGRES (com extensão pgvector)
-- Este banco armazena multitenancy, inventário (com vetores) e dados de auditoria
-- =================================================================================
-- 1. Cria a extensão pgvector para permitir buscas semânticas (RAG)
CREATE EXTENSION IF NOT EXISTS vector;
-- 2. Habilita pgcrypto se precisar de hashing local (opcional/útil)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- =================================================================================
-- TABELA 1: TENANTS (Configuração Multi-Tenant dinâmica por loja)
-- =================================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_loja VARCHAR(255) NOT NULL,
    tom_de_voz VARCHAR(50) DEFAULT 'Profissional',
    -- Este JSON dita as regras dinâmicas no pipeline (Quais módulos estão ativos, ex: aceita áudio?)
    config_json JSONB DEFAULT '{}'::jsonb,
    -- Regras de negócio restritas
    trade_in_policy JSONB DEFAULT '{"aceita": true, "ano_minimo": 2012, "marcas_proibidas": []}',
    financiamento_policy JSONB DEFAULT '{"entrada_minima_percentual": 20.0, "score_baixo_aceito": false}',
    gliner_active_labels TEXT [] DEFAULT '{"INTENCAO", "VEICULO_INTERESSE", "VEICULO_TROCA", "ORCAMENTO", "CONDICAO_VEICULO"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- =================================================================================
-- TABELA 2: VEHICLES (Estoque com Busca Semântica via pgvector)
-- =================================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- Dados determinísticos de catálogo
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    versao VARCHAR(255),
    ano_fabricacao INT,
    ano_modelo INT,
    cor VARCHAR(50),
    preco NUMERIC(15, 2),
    -- NUNCA DEIXE A IA INVENTAR - LEIA DAQUI
    quilometragem INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DISPONIVEL',
    -- Regra rígida: IA só oferece DISPONIVEL
    interest_count INT DEFAULT 0,
    -- Contador de leads no veículo
    reservation_details JSONB,
    -- { "salesperson": "...", "client": "...", "date": "...", "has_downpayment": false }
    -- Imagem/URLs caso a IA precise enviar fotos ou referenciar visualmente
    fotos_urls TEXT [],
    -- Dados textuais ricos para RAG
    descricao_tecnica TEXT,
    -- O Vetor Gerado pelo FastEmbed para Semantic Search
    veiculo_vetor vector(384),
    -- Assumindo que BGE-small / FastEmbed gera dimensão 384
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índice HNSW para performance na busca de vetores por Similaridade Cosine (Cos)
CREATE INDEX ON vehicles USING hnsw (veiculo_vetor vector_cosine_ops);
-- Função de Row-Level Security (RLS) opcional para o Metabase
-- Evita explicitamente que um Tenant veja inventário de outro.
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY isolation_policy_vehicles ON vehicles USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);
-- =================================================================================
-- TABELA 3: INTERACTIONS (Memória de longo prazo e Auditoria LangFuse)
-- =================================================================================
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sessao_id VARCHAR(255) NOT NULL,
    -- Pode ser o telefone ou o ID Chatwoot
    tipo_entrada VARCHAR(20) DEFAULT 'TEXTO',
    -- Pode ser AUDIO, IMAGEM, TEXTO
    input_usuario TEXT NOT NULL,
    -- Se audio/imagem, o Whisper/LLaVA/Docling preenche essa transcrição
    output_ia TEXT,
    -- Observabilidade 
    langfuse_trace_id VARCHAR(255),
    -- Ligação direta com o Log detalhado da requisição LLM 
    -- Inteligência Estruturada Extraída no momento (Audit trail para o Metabase)
    gliner_entities JSONB DEFAULT '{}'::jsonb,
    sentiment_score NUMERIC(5, 4),
    -- Monitoramento de SLAs
    spam_score NUMERIC(5, 4),
    -- O TextStat achou que era spam?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índices de performance nas buscas rotineiras
CREATE INDEX idx_interactions_sessao ON interactions(sessao_id);
CREATE INDEX idx_interactions_tenant_data ON interactions(tenant_id, created_at DESC);
-- Habilitando RLS também aqui (Crítico para BI Multitenant - Metabase)
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY isolation_policy_interactions ON interactions USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);
-- =================================================================================
-- TABELA 4: SESSIONS_AUDIT_BIBLIA (Notas geradas pelo Módulo Fechamento - Gemini)
-- =================================================================================
CREATE TABLE IF NOT EXISTS sessions_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sessao_id VARCHAR(255) NOT NULL,
    resumo_analitico_gemini TEXT,
    -- A avaliação do Flash 1.5 ao final da triagem
    status_lead VARCHAR(50),
    -- MQL, SQL, TRASH, SPAM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- =================================================================================
-- TABELA 5: APPOINTMENTS (Agendamentos e Visitas)
-- =================================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_contact VARCHAR(255) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE
    SET NULL,
        salesperson VARCHAR(255) DEFAULT 'A Definir',
        appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (
            status IN ('SCHEDULED', 'DONE', 'NO_SHOW', 'CANCELED')
        ),
        has_downpayment BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY isolation_policy_appointments ON appointments USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);
-- =================================================================================
-- TABELA 6: API_KEYS (Autenticação dos Webhooks / Evolução SaaS)
-- =================================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE
);
-- =================================================================================
-- TABELA 7: CHATWOOT_CONNECTIONS (Isolamento de Contas e Inboxes por Tenant)
-- =================================================================================
CREATE TABLE IF NOT EXISTS chatwoot_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chatwoot_account_id INT NOT NULL,
    chatwoot_inbox_id INT NOT NULL,
    chatwoot_api_token VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(chatwoot_account_id, chatwoot_inbox_id)
);
ALTER TABLE chatwoot_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY isolation_policy_chatwoot_connections ON chatwoot_connections USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);
-- =================================================================================
-- Exemplo Opcional de Inserção Inicial Base
-- =================================================================================
-- INSERT INTO tenants (nome_loja, tom_de_voz) VALUES ('Auto Premium Elite', 'Consultivo e Acolhedor');