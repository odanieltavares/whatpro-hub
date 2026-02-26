# 🧠 SDR Automotivo de Elite — Arquitetura Completa, System Prompt & Workflow

> Documento definitivo combinando: Análise de Frameworks, System Prompt Parametrizado, Workflow n8n detalhado e Schema do Banco de Dados.

---

# PARTE 1 — ANÁLISE PROFUNDA: SINGLE-AGENT vs MULTI-AGENT

## 1.1. O Dilema Central

A pergunta fundamental: **Um único agente LLM pode fazer tudo (qualificar, consultar FIPE, atualizar CRM, agendar) ou precisamos de múltiplos agentes especializados?**

### Veredicto Antecipado: **Hybrid Multi-Agent com Orquestrador Central**

A resposta não é binária. O design ideal combina:
- **1 Agente LLM principal** (SDR Frontline) que conversa com o cliente
- **Lógica determinística** (sem LLM) para scoring, roteamento e CRM
- **RAG Engine** separado para consultas de estoque/FIPE
- **n8n** como orquestrador central (barramento de eventos)

---

## 1.2. Comparativo dos 6 Frameworks

### Matriz de Decisão

| Critério | n8n | CrewAI | LangGraph | Google ADK | Agno | Evo AI |
|----------|-----|--------|-----------|------------|------|--------|
| **Tipo** | Low-code Workflow | Python Multi-Agent | Python Graph-State | Python Multi-Agent | Python Agent | Plataforma Visual |
| **Curva de Aprendizado** | 🟢 Baixa | 🟡 Média | 🔴 Alta | 🟡 Média | 🟢 Baixa | 🟢 Baixa |
| **Multi-Agent** | Via sub-workflows | ✅ Nativo (Crews) | ✅ Nativo (Grafos) | ✅ Nativo (Hierarchy) | ✅ Nativo | ✅ Nativo |
| **WhatsApp Nativo** | ✅ Via Evolution API | ❌ Precisa wrapper | ❌ Precisa wrapper | ❌ Precisa wrapper | ❌ Precisa wrapper | ✅ Nativo |
| **Chatwoot Nativo** | ✅ Webhook direto | ❌ Custom code | ❌ Custom code | ❌ Custom code | ❌ Custom code | ✅ Via integração |
| **Tool Calling** | ✅ HTTP nodes | ✅ Python tools | ✅ Python tools | ✅ Tools nativs | ✅ Tools built-in | ✅ Integrations |
| **Memória** | Via DB externo | ✅ Built-in | ✅ State management | ✅ Session state | ✅ Built-in PgVector | Via DB externo |
| **RAG** | Via API externa | ✅ Built-in | ✅ Built-in | ✅ Vertex AI Search | ✅ Built-in | ✅ LangGraph |
| **Observabilidade** | ✅ Logs visuais | 🟡 Langfuse | ✅ LangSmith | ✅ Cloud Trace | ✅ Monitoring | 🟡 Logs |
| **Custo Operacional** | 🟢 Self-hosted free | 🟢 Open source | 🟢 Open source | 🟡 GCP pricing | 🟢 Open source | 🟡 Pricing TBD |
| **Performance** | 🟡 Node.js | 🟡 Python | 🟡 Python | 🟡 Python | 🟢 2μs/agent | 🟡 Python |
| **Humanização (delays)** | ✅ Wait nodes | ❌ Custom sleep | ❌ Custom sleep | ❌ Custom | ❌ Custom | ❌ Custom |
| **Deploy** | ✅ Docker ready | 🟡 Needs infra | 🟡 Needs infra | ✅ Cloud Run | 🟡 Docker/K8s | ✅ Docker ready |
| **Comunidade BR** | 🟢 Enorme | 🟡 Crescendo | 🟡 Dev-focused | 🟡 Enterprise | 🟡 Pequena | 🟢 Grande |

### Pontuação Final (SDR Automotivo WhatsApp)

| Framework | Score (0-100) | Melhor Para |
|-----------|--------------|-------------|
| **n8n + Evolution API** | 🏆 **92/100** | Orquestração central, webhooks, Chatwoot, humanização |
| **Evo AI** | 85/100 | Plataforma visual com WhatsApp nativo e multi-agent |
| **Agno** | 78/100 | Performance extrema, mas precisa de wrapper WhatsApp |
| **LangGraph** | 75/100 | Fluxos complexos com estado, mas overengineering para SDR |
| **CrewAI** | 72/100 | Multi-agent bonito, mas latência alta para chat real-time |
| **Google ADK** | 70/100 | Enterprise com GCP, mas vendor lock-in |

---

## 1.3. Arquitetura Recomendada: n8n como Orquestrador Central

### Por que n8n vence para SDR Automotivo?

1. **WhatsApp nativo** via Evolution API (sem code)
2. **Chatwoot webhooks** nativos (sem adapter)
3. **Humanização** com Wait nodes (delays de digitação)
4. **Splitter de mensagens** via Code nodes
5. **Tool calling visual** (HTTP Request nodes para FIPE, estoque)
6. **Deploy simples** (Docker, já temos no WhatPro Hub)
7. **Comunidade brasileira massiva** (suporte e templates)
8. **Custo zero** (self-hosted)

### Quando NÃO usar n8n sozinho

| Cenário | Solução Complementar |
|---------|---------------------|
| RAG complexo com vetores | **Agno** ou **LangGraph** como microserviço |
| Multi-agent autônomo com decisões ramificadas | **CrewAI** ou **LangGraph** encapsulado no n8n |
| Escalabilidade > 10.000 conversas/dia | **Agno** (2μs/agent) como backend LLM |
| Enterprise com GCP obrigatório | **Google ADK** com Cloud Run |

### Arquitetura Híbrida Final

```
┌───────────────────────────────────────────────────────────┐
│                     CHATWOOT                              │
│           (Omnichannel: WhatsApp + Webchat)               │
│                                                           │
│  Webhooks ──→ message_created, conversation_updated       │
└──────────────────────┬────────────────────────────────────┘
                       │ POST /webhook
                       ▼
┌───────────────────────────────────────────────────────────┐
│                    n8n (ORQUESTRADOR)                     │
│                                                           │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Webhook  │→│ Router   │→│ LLM Node │→│ Splitter  │ │
│  │ Trigger  │  │ (IF/SW)  │  │ (GPT-4o) │  │ + Delay   │ │
│  └─────────┘  └──────────┘  └──────────┘  └───────────┘ │
│                     │              │              │        │
│              ┌──────▼──────┐ ┌────▼────┐  ┌─────▼──────┐│
│              │ Score Engine│ │RAG Query│  │ Chatwoot   ││
│              │ (Code Node) │ │(HTTP)   │  │ API Send   ││
│              └─────────────┘ └─────────┘  └────────────┘│
│                     │                                     │
│              ┌──────▼──────┐                             │
│              │ Handoff /   │                             │
│              │ Calendar    │                             │
│              └─────────────┘                             │
└───────────────────────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │PostgreSQL│ │ FIPE API │ │ Cal.com  │
   │(Leads,   │ │          │ │ Google   │
   │ Scores,  │ │          │ │ Calendar │
   │ Tenants) │ │          │ │          │
   └──────────┘ └──────────┘ └──────────┘
```

---

# PARTE 2 — SYSTEM PROMPT PARAMETRIZADO

## 2.1. Template do System Prompt (Completo)

> Este prompt deve ser inserido no nó "AI Agent" ou "OpenAI Chat" do n8n.
> As variáveis entre `{{chaves}}` são preenchidas dinamicamente pelo n8n.

```markdown
# IDENTIDADE E PERSONA

Você é {{agent_persona_name}}, {{agent_persona_role}} da {{company_name}}, localizada em {{company_city}}/{{company_state}}.
Você trabalha no atendimento via WhatsApp e seu objetivo é qualificar leads interessados em veículos e agendar visitas presenciais.

Seu tom de voz é {{brand_tone}}. Você é {{agent_personality_traits}}.

# REGRAS INVIOLÁVEIS (NUNCA QUEBRE ESTAS REGRAS)

1. NUNCA invente informações sobre veículos, preços ou disponibilidade. Se não sabe, diga que vai verificar.
2. NUNCA passe o preço final exato de nenhum veículo via chat. Use faixas ou diga "a partir de R$...".
3. NUNCA passe a avaliação exata do veículo usado do cliente. Diga que precisa de avaliação presencial.
4. NUNCA solicite CPF, RG ou documentos sensíveis antes de estabelecer confiança (mínimo 5 interações).
5. NUNCA envie mensagens com mais de {{max_message_length}} caracteres. Divida em mensagens menores.
6. NUNCA ignore uma menção a veículo de troca/retoma. SEMPRE pergunte detalhes.
7. NUNCA encerre a conversa sem oferecer um próximo passo concreto (agendar visita, enviar mais info).
8. SEMPRE responda na mesma língua do cliente.
9. SEMPRE trate o cliente pelo primeiro nome após descobri-lo.
10. SEMPRE registre informações descobertas nos campos de dados (cidade, modelo de interesse, etc).

# CONHECIMENTO DA EMPRESA

Segmentos que trabalhamos: {{vehicle_segments}}
Marcas disponíveis: {{available_brands}}
Horário de funcionamento: {{working_hours}}
Endereço: {{company_address}}
Diferenciais: {{company_differentials}}

# FRAMEWORKS DE VENDAS (USE EM BACKGROUND, NUNCA VERBALIZE)

## BANT (Budget, Authority, Need, Timeline)
- Budget: Investigue modalidade de pagamento. Pergunte SEMPRE sobre veículo na troca.
- Authority: Descubra sutilmente se é o decisor (compra individual, familiar, CNPJ).
- Need: Mapeie a necessidade real (família, trabalho, lazer, status).
- Timeline: Avalie urgência ("para quando precisa?", "seu carro atual está dando problema?").

## SPIN Selling
- Situação: "Como é sua rotina com o carro atual?"
- Problema: "O que mais te incomoda no seu veículo hoje?"
- Implicação: "Isso já te causou algum transtorno?"
- Necessidade: "Se pudesse resolver isso, como seria o carro ideal?"

## Challenger Sale
- Ensine algo novo ao cliente sobre o mercado quando apropriado.
- Ex: "Sabia que os SUVs compactos tiveram a menor desvalorização do mercado este ano?"

# GATILHOS MENTAIS (USE COM NATURALIDADE)

1. **Curiosidade**: "Seu carro é muito procurado aqui. Nossos avaliadores costumam valorizar acima da FIPE..."
2. **Ancoragem**: Foque nos benefícios e segurança ANTES de falar de valores.
3. **Escassez**: "Temos poucas unidades com essa condição especial."
4. **Prova Social**: "Muitos clientes que vinham com a mesma dúvida ficaram surpresos com..."
5. **Reciprocidade**: Ofereça informação útil gratuitamente antes de pedir dados.

# PROTOCOLO DE QUALIFICAÇÃO (LEAD SCORING)

Ao longo da conversa, avalie mentalmente:
- [ ] Tem veículo para troca? (+{{score_has_trade_in}} pontos)
- [ ] Sabe quanto quer investir? (+{{score_financing_ready}} pontos)
- [ ] Tem urgência? (+{{score_urgency_high}} pontos)
- [ ] É o decisor? (+15 pontos)
- [ ] Está na região? (+10 pontos)
- [ ] Modelo específico em mente? (+10 pontos)

Classificação:
- 0-{{score_threshold_mql}}: Lead Frio → Continuar nutrindo
- {{score_threshold_mql}}-{{score_threshold_sql}}: MQL → Investigar mais
- Acima de {{score_threshold_sql}}: SQL → Preparar para handoff ao vendedor

# PROTOCOLO DE HUMANIZAÇÃO

1. Escreva mensagens curtas (máximo {{max_message_length}} caracteres cada).
2. Divida respostas longas em 2-3 mensagens separadas.
3. Use emojis com moderação (nível: {{emoji_usage}}).
4. Adapte seu vocabulário ao perfil do cliente:
   - Cliente direto/informal → Seja mais descontraído
   - Cliente formal/executivo → Seja mais consultivo e sofisticado
   - Cliente inseguro → Seja mais acolhedor e didático
5. Use o nome do cliente quando possível.

# PROTOCOLO DE TROCA/RETOMA (OBRIGATÓRIO)

Quando o cliente mencionar OU NÃO mencionar um veículo atual:
1. SEMPRE pergunte: "Você tem um veículo que gostaria de avaliar na troca?"
2. Se sim, colete: Marca, Modelo, Ano, KM aproximada, estado geral.
3. NÃO dê valor de avaliação. Diga: "Nossos avaliadores presenciais costumam encontrar diferenciais que valorizam acima da média. Que tal trazê-lo para uma avaliação sem compromisso?"

# PROTOCOLO DE AGENDAMENTO

Quando o lead estiver qualificado (score > {{score_threshold_sql}}):
1. Ofereça horários: "Temos disponibilidade {{available_slots}}. Qual fica melhor para você?"
2. Confirme: Nome, telefone, veículo de interesse, se trará carro para avaliação.
3. Finalize: "Perfeito! Agendei sua visita com o consultor {{assigned_consultant}}. Protocolo #{{protocol_number}}."

# PROTOCOLO DE FOLLOW-UP

Se o cliente não responder após {{ghosting_threshold_hours}} horas:
- 1º Follow-up: [Contextual] "{{client_name}}, conseguiu pensar sobre o {{vehicle_interest}}?"
- 2º Follow-up (após + {{follow_up_delay_hours}}h): [Valor] "Separei uma informação que pode te interessar sobre {{topic}}..."
- 3º Follow-up: [Escassez] "{{client_name}}, as condições que conversamos estão com prazo limitado..."
- Após {{max_follow_ups}} tentativas: Encerrar com mensagem de porta aberta.

# PROTOCOLO DE HANDOFF (TRANSFERÊNCIA AO VENDEDOR)

Quando for transferir ao vendedor humano:
1. Envie ao cliente: "{{client_name}}, vou te conectar com nosso consultor especialista, {{consultant_name}}. Ele já está por dentro de tudo que conversamos. Protocolo #{{protocol_number}}."
2. Crie uma NOTA PRIVADA detalhada com:
   - 🔴/🟡/🟢 Nível de intenção
   - Veículo de interesse
   - Veículo de troca (marca/modelo/ano/km)
   - Modalidade de pagamento
   - Objeções identificadas
   - Sugestão de abordagem
   - Score BANT: B[_] A[_] N[_] T[_]

# LGPD E CONSENTIMENTO

{{#if lgpd_opt_in_required}}
Antes de solicitar CPF ou documentos de veículo para simulação:
"Para prosseguir com a simulação de financiamento, preciso de alguns dados pessoais. 
Garanto que suas informações serão tratadas com total segurança, conforme a Lei Geral de Proteção de Dados (LGPD). 
Posso prosseguir? ✅"
Só continue após confirmação explícita do cliente.
{{/if}}

# AUTO-VERIFICAÇÃO (ANTES DE CADA RESPOSTA)

Antes de enviar qualquer mensagem, verifique:
1. ❓ Estou quebrando alguma regra inviolável?
2. ❓ A mensagem tem mais de {{max_message_length}} caracteres? → Dividir
3. ❓ Estou dando preço final? → Reformular
4. ❓ Estou dando avaliação exata do usado? → Reformular
5. ❓ O tom está adequado ao perfil do cliente?
6. ❓ Existe um próximo passo claro na mensagem?
```

---

# PARTE 3 — WORKFLOW n8n DETALHADO (NÓ A NÓ)

## 3.1. Visão Geral dos Workflows

O sistema é composto por **4 workflows independentes** no n8n:

| # | Workflow | Trigger | Frequência |
|---|----------|---------|------------|
| 1 | **SDR Principal** | Webhook Chatwoot (message_created) | Cada mensagem |
| 2 | **Follow-Up Engine** | Cron (a cada 1h) | Hourly |
| 3 | **Score Updater** | Webhook Chatwoot (conversation_updated) | Cada update |
| 4 | **Analytics Collector** | Cron (diário) | Daily |

---

## 3.2. Workflow 1 — SDR Principal (Detalhado)

```
[Webhook Trigger] ──→ [Filter Bot Messages] ──→ [Load Context]
       │                                              │
       │                                    ┌─────────▼─────────┐
       │                                    │ HTTP: GET Contact  │
       │                                    │ Chatwoot API       │
       │                                    │ /contacts/{id}     │
       │                                    └─────────┬─────────┘
       │                                              │
       │                                    ┌─────────▼─────────┐
       │                                    │ HTTP: GET History  │
       │                                    │ /conversations/    │
       │                                    │  {id}/messages     │
       │                                    └─────────┬─────────┘
       │                                              │
       │                                    ┌─────────▼─────────┐
       │                                    │ Code: Build Prompt │
       │                                    │ (inject variables, │
       │                                    │  history, contact  │
       │                                    │  attributes)       │
       │                                    └─────────┬─────────┘
       │                                              │
       │                                    ┌─────────▼─────────┐
       │                                    │ OpenAI Chat:       │
       │                                    │ System Prompt +    │
       │                                    │ User Message +     │
       │                                    │ Tool Definitions   │
       │                                    └─────────┬─────────┘
       │                                              │
       │                              ┌───────────────┼───────────────┐
       │                              │               │               │
       │                    ┌─────────▼───┐  ┌───────▼───────┐  ┌───▼────────┐
       │                    │ Tool Call:  │  │ Tool Call:    │  │ Text Reply │
       │                    │ query_fipe  │  │ check_stock   │  │ (no tool)  │
       │                    └─────────┬───┘  └───────┬───────┘  └───┬────────┘
       │                              │              │              │
       │                              └──────────────┼──────────────┘
       │                                             │
       │                                   ┌─────────▼─────────┐
       │                                   │ Code: Split Msgs   │
       │                                   │ (divide em 2-3     │
       │                                   │  mensagens curtas) │
       │                                   └─────────┬─────────┘
       │                                             │
       │                                   ┌─────────▼─────────┐
       │                                   │ Loop: For Each Msg │
       │                                   └─────────┬─────────┘
       │                                             │
       │                                ┌────────────▼────────────┐
       │                                │ HTTP: POST typing_on   │
       │                                │ Chatwoot API            │
       │                                └────────────┬────────────┘
       │                                             │
       │                                ┌────────────▼────────────┐
       │                                │ Wait: Random 2-5 sec   │
       │                                │ (humanization delay)    │
       │                                └────────────┬────────────┘
       │                                             │
       │                                ┌────────────▼────────────┐
       │                                │ HTTP: POST message      │
       │                                │ Chatwoot API            │
       │                                │ /conversations/{id}/    │
       │                                │  messages               │
       │                                └────────────┬────────────┘
       │                                             │
       │                                ┌────────────▼────────────┐
       │                                │ Code: Update Score      │
       │                                │ + Update Contact Attrs  │
       │                                └────────────┬────────────┘
       │                                             │
       │                                ┌────────────▼────────────┐
       │                                │ IF: score >= SQL_THRESH │
       │                                ├─── YES ─→ [Handoff]    │
       │                                └─── NO ──→ [End]        │
       │                                             │
       │                                ┌────────────▼────────────┐
       │                                │ HANDOFF FLOW:           │
       │                                │ 1. POST Private Note    │
       │                                │ 2. Assign to Team       │
       │                                │ 3. Add Label "SQL"      │
       │                                │ 4. Generate Protocol #  │
       │                                │ 5. POST msg to client   │
       │                                │ 6. Log to Analytics DB  │
       │                                └─────────────────────────┘
```

### Nós Detalhados

#### Nó 1: Webhook Trigger
```json
{
  "type": "webhook",
  "path": "/chatwoot-webhook",
  "method": "POST",
  "authentication": "headerAuth",
  "headerName": "X-Webhook-Secret",
  "headerValue": "{{webhook_secret}}"
}
```

#### Nó 2: Filter Bot Messages
```javascript
// Code Node - Filtra apenas mensagens de clientes (não do bot)
const event = $input.first().json;

if (event.event !== 'message_created') return [];
if (event.message_type !== 'incoming') return [];
if (event.conversation?.status === 'resolved') return [];

return [{
  json: {
    conversation_id: event.conversation.id,
    contact_id: event.sender?.id,
    contact_name: event.sender?.name,
    message: event.content,
    inbox_id: event.inbox?.id,
    account_id: event.account?.id,
    timestamp: event.created_at
  }
}];
```

#### Nó 3: Build Prompt (Code Node)
```javascript
// Injeta variáveis do tenant + histórico + atributos do contato
const contact = $('Load Contact').first().json;
const history = $('Load History').all().map(m => ({
  role: m.json.message_type === 'incoming' ? 'user' : 'assistant',
  content: m.json.content
}));

const tenantConfig = {
  company_name: '{{TENANT_COMPANY_NAME}}',
  agent_persona_name: '{{TENANT_AGENT_NAME}}',
  brand_tone: '{{TENANT_BRAND_TONE}}',
  max_message_length: {{TENANT_MAX_MSG_LENGTH}},
  score_threshold_sql: {{TENANT_SQL_THRESHOLD}},
  // ... todas as variáveis do tenant
};

const systemPrompt = buildSystemPrompt(tenantConfig, contact);

return [{
  json: {
    systemPrompt,
    messages: history,
    userMessage: $input.first().json.message,
    contactAttributes: contact.custom_attributes || {}
  }
}];
```

#### Nó 4: Message Splitter (Code Node)
```javascript
// Divide a resposta do LLM em mensagens curtas
const response = $input.first().json.text;
const maxLen = {{TENANT_MAX_MSG_LENGTH}};

// Divide por parágrafos primeiro, depois por tamanho
const paragraphs = response.split('\n\n').filter(p => p.trim());
const messages = [];
let current = '';

for (const p of paragraphs) {
  if ((current + '\n\n' + p).length > maxLen && current) {
    messages.push(current.trim());
    current = p;
  } else {
    current = current ? current + '\n\n' + p : p;
  }
}
if (current) messages.push(current.trim());

return messages.map((msg, i) => ({
  json: { text: msg, index: i, total: messages.length }
}));
```

#### Nó 5: Humanization Delay (Wait Node)
```json
{
  "type": "wait",
  "amount": "={{Math.floor(Math.random() * 3) + 2}}",
  "unit": "seconds"
}
```

---

## 3.3. Workflow 2 — Follow-Up Engine

```
[Cron: cada 1h] ──→ [DB Query: Leads sem resposta]
                          │
                    ┌─────▼──────┐
                    │ Para cada   │
                    │ lead:       │
                    │ - last_msg  │
                    │ - follow_ct │
                    │ - score     │
                    └─────┬──────┘
                          │
                    ┌─────▼──────────────┐
                    │ IF follow_count    │
                    │ < max_follow_ups   │
                    ├── YES ──→ [LLM: Generate Follow-up]
                    │           ──→ [Send via Chatwoot]
                    │           ──→ [Update follow_count]
                    └── NO ───→ [Label: "Nurture"]
                                ──→ [Close conversation]
```

---

## 3.4. Tool Definitions (Function Calling)

O nó LLM do n8n deve ter estas tools definidas:

```json
{
  "tools": [
    {
      "name": "query_fipe",
      "description": "Consulta o valor FIPE de um veículo. Use quando o cliente mencionar que tem um carro para trocar. NÃO informe o valor exato ao cliente.",
      "parameters": {
        "brand": "string - Marca do veículo (ex: Hyundai)",
        "model": "string - Modelo (ex: HB20)",
        "year": "integer - Ano/modelo (ex: 2020)"
      }
    },
    {
      "name": "check_stock",
      "description": "Verifica disponibilidade de veículos no estoque da loja. Use quando o cliente perguntar sobre um modelo específico.",
      "parameters": {
        "model": "string - Modelo desejado",
        "category": "string - 0km, seminovo, ou ambos",
        "max_price": "number - Preço máximo (opcional)"
      }
    },
    {
      "name": "schedule_visit",
      "description": "Agenda uma visita/test-drive para o cliente. Use quando o lead estiver qualificado e pronto para agendar.",
      "parameters": {
        "client_name": "string",
        "phone": "string",
        "preferred_date": "string - Data preferida",
        "preferred_time": "string - Horário preferido",
        "vehicle_interest": "string",
        "has_trade_in": "boolean"
      }
    },
    {
      "name": "update_lead_score",
      "description": "Atualiza o score do lead com novas informações descobertas na conversa.",
      "parameters": {
        "has_trade_in": "boolean",
        "knows_budget": "boolean",
        "urgency": "string - high, medium, low",
        "is_decision_maker": "boolean",
        "city": "string",
        "vehicle_interest": "string"
      }
    },
    {
      "name": "request_handoff",
      "description": "Solicita transferência para vendedor humano. Use quando o lead atingir score SQL.",
      "parameters": {
        "summary": "string - Resumo executivo do lead",
        "score": "number - Score atual",
        "objections": "string - Objeções identificadas",
        "suggested_approach": "string - Sugestão de abordagem"
      }
    }
  ]
}
```

---

# PARTE 4 — SCHEMA DO BANCO DE DADOS

## 4.1. Diagrama ER

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   tenants   │────<│    leads     │────<│ conversations │
└─────────────┘     └──────────────┘     └───────────────┘
       │                   │                      │
       │            ┌──────▼──────┐        ┌──────▼──────┐
       │            │ lead_scores │        │  messages   │
       │            └─────────────┘        └─────────────┘
       │                   │
       │            ┌──────▼──────┐
       │            │ lead_events │
       │            └─────────────┘
       │
       ├─────<┌──────────────┐
       │      │   vehicles   │ (estoque)
       │      └──────────────┘
       │
       ├─────<┌──────────────┐
       │      │  consultants │
       │      └──────────────┘
       │
       └─────<┌──────────────┐
              │  token_usage │
              └──────────────┘
```

## 4.2. SQL Schema (PostgreSQL)

```sql
-- ======================
-- TABELA: tenants
-- Cada empresa/concessionária
-- ======================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Identidade
    company_address TEXT,
    company_city VARCHAR(100),
    company_state VARCHAR(2),
    working_hours JSONB DEFAULT '{"start":"08:00","end":"18:00","days":[1,2,3,4,5,6]}',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Persona do Agente
    agent_persona_name VARCHAR(50) DEFAULT 'Ana',
    agent_persona_role VARCHAR(100) DEFAULT 'Consultora Digital',
    agent_personality_traits TEXT DEFAULT 'simpática, consultiva, proativa',
    brand_tone VARCHAR(20) DEFAULT 'casual' CHECK (brand_tone IN ('formal','casual','premium')),
    
    -- Vendas
    vehicle_segments TEXT[] DEFAULT '{"0km","seminovos"}',
    available_brands TEXT[] DEFAULT '{}',
    price_disclosure_policy VARCHAR(20) DEFAULT 'never' CHECK (price_disclosure_policy IN ('never','range_only','full')),
    trade_in_policy VARCHAR(20) DEFAULT 'always_ask',
    drive_to_store_priority VARCHAR(10) DEFAULT 'high',
    max_messages_before_handoff INTEGER DEFAULT 15,
    company_differentials TEXT,
    
    -- Scoring
    score_has_trade_in INTEGER DEFAULT 30,
    score_financing_ready INTEGER DEFAULT 20,
    score_urgency_high INTEGER DEFAULT 25,
    score_is_decision_maker INTEGER DEFAULT 15,
    score_in_region INTEGER DEFAULT 10,
    score_specific_model INTEGER DEFAULT 10,
    score_threshold_mql INTEGER DEFAULT 30,
    score_threshold_sql INTEGER DEFAULT 70,
    
    -- Humanização
    typing_delay_min_ms INTEGER DEFAULT 2000,
    typing_delay_max_ms INTEGER DEFAULT 5000,
    max_message_length INTEGER DEFAULT 300,
    message_split_enabled BOOLEAN DEFAULT true,
    emoji_usage VARCHAR(10) DEFAULT 'moderate',
    mirroring_enabled BOOLEAN DEFAULT true,
    
    -- Follow-up
    follow_up_delay_hours INTEGER DEFAULT 24,
    max_follow_ups INTEGER DEFAULT 3,
    ghosting_threshold_hours INTEGER DEFAULT 24,
    business_days_only BOOLEAN DEFAULT true,
    
    -- LGPD
    lgpd_opt_in_required BOOLEAN DEFAULT true,
    lgpd_opt_in_message TEXT,
    
    -- Integrações
    chatwoot_account_id INTEGER,
    chatwoot_api_key TEXT,
    chatwoot_inbox_id INTEGER,
    llm_provider VARCHAR(20) DEFAULT 'openai',
    llm_model VARCHAR(50) DEFAULT 'gpt-4o',
    llm_temperature DECIMAL(2,1) DEFAULT 0.7,
    llm_max_tokens INTEGER DEFAULT 500,
    calendar_provider VARCHAR(20) DEFAULT 'none',
    calendar_api_key TEXT,
    fipe_api_enabled BOOLEAN DEFAULT true,
    webhook_secret TEXT,
    
    -- Lost Reasons
    lost_reason_categories TEXT[] DEFAULT '{"preço","crédito","timing","concorrência","desistência"}',
    protocol_number_prefix VARCHAR(10) DEFAULT 'PRT',
    
    -- Handoff
    handoff_round_robin BOOLEAN DEFAULT true,
    handoff_team_id INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================
-- TABELA: leads
-- Cada contato/cliente
-- ======================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identificação
    chatwoot_contact_id INTEGER,
    chatwoot_conversation_id INTEGER,
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    
    -- Qualificação BANT
    budget_range VARCHAR(50),
    has_trade_in BOOLEAN DEFAULT false,
    trade_in_brand VARCHAR(50),
    trade_in_model VARCHAR(50),
    trade_in_year INTEGER,
    trade_in_km INTEGER,
    trade_in_fipe_value DECIMAL(10,2),
    financing_modality VARCHAR(50),
    is_decision_maker BOOLEAN,
    vehicle_interest VARCHAR(255),
    vehicle_category VARCHAR(20),
    need_description TEXT,
    urgency VARCHAR(10) DEFAULT 'low' CHECK (urgency IN ('high','medium','low')),
    timeline VARCHAR(50),
    
    -- Scoring
    current_score INTEGER DEFAULT 0,
    classification VARCHAR(10) DEFAULT 'cold' CHECK (classification IN ('cold','mql','sql','won','lost')),
    
    -- Marketing
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    entry_message TEXT,
    deep_link_id VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','follow_up','handed_off','scheduled','won','lost','nurture')),
    follow_up_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    handed_off_at TIMESTAMPTZ,
    assigned_consultant_id UUID,
    protocol_number VARCHAR(20),
    
    -- Lost
    lost_reason VARCHAR(100),
    lost_notes TEXT,
    
    -- LGPD
    lgpd_consent_given BOOLEAN DEFAULT false,
    lgpd_consent_at TIMESTAMPTZ,
    cpf_encrypted TEXT,
    
    -- Profile
    client_profile VARCHAR(20) DEFAULT 'standard' CHECK (client_profile IN ('rural','executive','young','family','standard')),
    sentiment_score DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_score ON leads(tenant_id, current_score DESC);
CREATE INDEX idx_leads_chatwoot ON leads(tenant_id, chatwoot_conversation_id);

-- ======================
-- TABELA: lead_scores
-- Histórico de scoring
-- ======================
CREATE TABLE lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    score_before INTEGER,
    score_after INTEGER,
    score_delta INTEGER,
    reason VARCHAR(255),
    triggered_by VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================
-- TABELA: lead_events 
-- Event Sourcing / Audit Trail
-- ======================
CREATE TABLE lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL,
    -- tipos: message_received, message_sent, score_updated, 
    --        handoff_initiated, visit_scheduled, follow_up_sent,
    --        consent_given, lost_marked, won_marked
    
    event_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_lead ON lead_events(lead_id, created_at DESC);
CREATE INDEX idx_events_type ON lead_events(tenant_id, event_type, created_at DESC);

-- ======================
-- TABELA: consultants
-- Vendedores humanos
-- ======================
CREATE TABLE consultants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    chatwoot_agent_id INTEGER,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT true,
    round_robin_order INTEGER DEFAULT 0,
    last_assigned_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================
-- TABELA: token_usage
-- Custo de tokens por conversa
-- ======================
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    conversation_id INTEGER,
    
    llm_model VARCHAR(50),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost_usd DECIMAL(8,6),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_tenant ON token_usage(tenant_id, created_at DESC);

-- ======================
-- TABELA: vehicles (estoque)
-- ======================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    brand VARCHAR(50),
    model VARCHAR(100),
    version VARCHAR(100),
    year_model INTEGER,
    year_manufacture INTEGER,
    category VARCHAR(20) CHECK (category IN ('0km','seminovo','moto')),
    color VARCHAR(50),
    km INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    price_range VARCHAR(50),
    fipe_value DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    features TEXT[],
    image_urls TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_search ON vehicles(tenant_id, is_available, category, brand);

-- ======================
-- VIEW: dashboard_kpis
-- KPIs em tempo real
-- ======================
CREATE VIEW dashboard_kpis AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '30 days') as leads_30d,
    COUNT(DISTINCT l.id) FILTER (WHERE l.classification = 'mql' AND l.created_at > NOW() - INTERVAL '30 days') as mqls_30d,
    COUNT(DISTINCT l.id) FILTER (WHERE l.classification = 'sql' AND l.created_at > NOW() - INTERVAL '30 days') as sqls_30d,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'won' AND l.created_at > NOW() - INTERVAL '30 days') as won_30d,
    ROUND(
        COUNT(DISTINCT l.id) FILTER (WHERE l.classification = 'sql')::DECIMAL / 
        NULLIF(COUNT(DISTINCT l.id) FILTER (WHERE l.classification IN ('mql','sql')), 0) * 100, 
    2) as mql_to_sql_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM (le.created_at - l.created_at)))::DECIMAL, 2) as avg_first_response_seconds,
    SUM(tu.estimated_cost_usd) FILTER (WHERE tu.created_at > NOW() - INTERVAL '30 days') as total_cost_30d
FROM tenants t
LEFT JOIN leads l ON l.tenant_id = t.id
LEFT JOIN lead_events le ON le.lead_id = l.id AND le.event_type = 'message_sent'
LEFT JOIN token_usage tu ON tu.tenant_id = t.id
GROUP BY t.id, t.name;
```

---

# PARTE 5 — RECOMENDAÇÃO ESTRATÉGICA FINAL

## Cenário Recomendado: **n8n + PostgreSQL + GPT-4o**

### Para Escala Pequena-Média (até 1.000 conversas/dia)

| Componente | Tecnologia | Justificativa |
|-----------|-----------|---------------|
| Orquestrador | **n8n** (self-hosted) | Visual, Chatwoot nativo, delays |
| LLM | **GPT-4o** via API | Melhor custo-benefício para português |
| WhatsApp | **Evolution API** | Open source, Chatwoot integrado |
| CRM | **Chatwoot** | Labels, notas, atributos, webhooks |
| DB | **PostgreSQL** | Robusto, views, JSON, full-text |
| Agenda | **Cal.com** ou **Google Calendar** | API aberta |
| Observabilidade | **Langfuse** (opcional) | Traces do LLM |

### Para Escala Grande (> 1.000 conversas/dia)

| Componente | Mudança | Justificativa |
|-----------|---------|---------------|
| LLM Backend | **Agno** como microserviço | 2μs/agent, 50x menos memória |
| Queue | **Redis + BullMQ** | Fila de mensagens para picos |
| Cache | **Redis** | Cache de prompts e respostas similares |
| RAG | **pgvector** + embeddings | Estoque vivo + manuais vetorizados |

### Quando Mudar de Framework

| Sinal | Ação |
|-------|------|
| n8n ficando lento (> 5s/resposta) | Extrair LLM para Agno microservice |
| Precisa de logic branches complexos | Adicionar LangGraph para decisões |
| Precisa de 5+ agentes autônomos | Migrar orquestração para CrewAI |
| Cliente enterprise exige GCP | Usar Google ADK + Cloud Run |

---

## TL;DR — Resposta Final

> **Use n8n como orquestrador central com um único agente LLM (GPT-4o) + tools.**
> NÃO comece com multi-agent. Comece simples.
> Adicione complexidade APENAS quando a escala ou a qualidade da conversa exigir.
> O segredo está no **System Prompt bem parametrizado** + **Tool Calling** + **Humanização** (delays, splits).
> Multi-agent só compensa quando o custo de tokens + latência justificar a separação.

---

# PARTE 6 — CAMADA MCP (MODEL CONTEXT PROTOCOL)

## 6.1. O Que é MCP e Por Que Usar

O **Model Context Protocol (MCP)** é o padrão aberto (criado pela Anthropic, adotado pela indústria) que padroniza como modelos de IA se conectam a ferramentas e dados externos. Em vez de HTTP requests ad-hoc, cada integração vira um **MCP Server** com schema tipado, autodocumentado e reutilizável.

### Benefícios para o SDR Automotivo

| Sem MCP | Com MCP |
|---------|---------|
| Cada tool é um HTTP Request node no n8n com URL hardcoded | Cada tool é um MCP Server declarado uma vez, usado em qualquer lugar |
| LLM precisa de descrição manual de cada ferramenta | MCP Server se autodeclara com schema e exemplos |
| Trocar de LLM exige reescrever tool definitions | MCP é agnóstico ao modelo — funciona com GPT, Claude, Gemini |
| Difícil de testar ferramentas isoladamente | Cada MCP Server é testável independentemente |
| Sem padrão de autenticação | MCP define auth flow padronizado |

## 6.2. Arquitetura MCP para o SDR

```
┌─────────────────────────────────────────────────────────┐
│                    LLM AGENT (GPT-4o)                   │
│              com MCP Client integrado                   │
└──────────┬──────┬──────┬──────┬──────┬──────┬───────────┘
           │      │      │      │      │      │
    ┌──────▼──┐ ┌─▼────┐ ┌▼────┐ ┌──▼──┐ ┌──▼───┐ ┌──▼──────┐
    │MCP:     │ │MCP:  │ │MCP: │ │MCP: │ │MCP:  │ │MCP:     │
    │Chatwoot │ │FIPE  │ │Cal  │ │Score│ │Stock │ │Database │
    │Server   │ │Server│ │Srv  │ │Srv  │ │Srv   │ │Server   │
    └─────────┘ └──────┘ └─────┘ └─────┘ └──────┘ └─────────┘
```

## 6.3. MCP Servers Detalhados

### MCP Server 1: `mcp-chatwoot` (CRM Operations)

Este é o **mais crítico**. Encapsula TODA interação com a API do Chatwoot.

```typescript
// mcp-chatwoot/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server";

const server = new McpServer({
  name: "mcp-chatwoot",
  version: "1.0.0",
  description: "Chatwoot CRM operations for SDR agent"
});

// === TOOLS ===

// 1. Enviar mensagem ao cliente
server.tool("send_message", {
  description: "Envia uma mensagem para o cliente na conversa atual do Chatwoot",
  inputSchema: {
    type: "object",
    properties: {
      conversation_id: { type: "number", description: "ID da conversa" },
      content: { type: "string", description: "Texto da mensagem" },
      message_type: { type: "string", enum: ["outgoing"], default: "outgoing" },
      private: { type: "boolean", default: false, description: "Se true, é nota interna" }
    },
    required: ["conversation_id", "content"]
  }
}, async ({ conversation_id, content, message_type, private: isPrivate }) => {
  const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversation_id}/messages`, {
    method: "POST",
    headers: { "api_access_token": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ content, message_type, private: isPrivate })
  });
  return { content: [{ type: "text", text: `Message sent: ${res.status}` }] };
});

// 2. Criar Nota Privada (para handoff)
server.tool("create_private_note", {
  description: "Cria uma nota privada na conversa. Invisível ao cliente. Use para handoff com resumo tático.",
  inputSchema: {
    type: "object",
    properties: {
      conversation_id: { type: "number" },
      content: { type: "string", description: "Conteúdo da nota com resumo BANT, objeções, sugestão" },
      mention_agent_id: { type: "number", description: "ID do agente/consultor a mencionar" }
    },
    required: ["conversation_id", "content"]
  }
});

// 3. Atualizar atributos do contato
server.tool("update_contact_attributes", {
  description: "Atualiza atributos custom do contato no Chatwoot (cidade, veículo interesse, etc)",
  inputSchema: {
    type: "object",
    properties: {
      contact_id: { type: "number" },
      custom_attributes: {
        type: "object",
        properties: {
          cidade: { type: "string" },
          veiculo_interesse: { type: "string" },
          tem_retoma: { type: "boolean" },
          retoma_modelo: { type: "string" },
          perfil_compra: { type: "string" },
          score: { type: "number" },
          classificacao: { type: "string", enum: ["cold", "mql", "sql"] }
        }
      }
    },
    required: ["contact_id", "custom_attributes"]
  }
});

// 4. Aplicar Label na conversa
server.tool("apply_label", {
  description: "Aplica uma etiqueta na conversa. Use para classificar: Alta_Intenção, Aguardando_FIPE, etc",
  inputSchema: {
    type: "object",
    properties: {
      conversation_id: { type: "number" },
      labels: { type: "array", items: { type: "string" } }
    },
    required: ["conversation_id", "labels"]
  }
});

// 5. Atribuir conversa a um agente/time
server.tool("assign_conversation", {
  description: "Transfere a conversa para um consultor humano ou time no Chatwoot (handoff)",
  inputSchema: {
    type: "object",
    properties: {
      conversation_id: { type: "number" },
      assignee_id: { type: "number", description: "ID do agente humano" },
      team_id: { type: "number", description: "ID do time (ex: Vendas_0km)" }
    },
    required: ["conversation_id"]
  }
});

// 6. Buscar histórico da conversa
server.tool("get_conversation_history", {
  description: "Busca as últimas N mensagens da conversa para manter contexto",
  inputSchema: {
    type: "object",
    properties: {
      conversation_id: { type: "number" },
      limit: { type: "number", default: 20 }
    },
    required: ["conversation_id"]
  }
});

// === RESOURCES (dados estáticos/contextuais) ===

// Dados do tenant (injetados como contexto)
server.resource("tenant_config", {
  uri: "chatwoot://tenant/config",
  description: "Configurações do tenant atual (empresa, persona, regras)",
  mimeType: "application/json"
});

// Lista de agentes/consultores disponíveis
server.resource("available_agents", {
  uri: "chatwoot://agents/available",
  description: "Lista de consultores humanos disponíveis para handoff"
});
```

### MCP Server 2: `mcp-fipe` (Consulta Veicular)

```typescript
// mcp-fipe/server.ts
const server = new McpServer({
  name: "mcp-fipe",
  version: "1.0.0",
  description: "Consulta Tabela FIPE e dados veiculares"
});

server.tool("query_fipe_value", {
  description: "Consulta o valor FIPE de um veículo. ATENÇÃO: NÃO informe o valor exato ao cliente. Use internamente para avaliar viabilidade da negociação.",
  inputSchema: {
    type: "object",
    properties: {
      brand: { type: "string", description: "Marca (ex: Hyundai, Toyota, Fiat)" },
      model: { type: "string", description: "Modelo (ex: HB20, Corolla)" },
      year: { type: "number", description: "Ano/modelo (ex: 2020)" },
      fuel_type: { type: "string", enum: ["gasoline", "flex", "diesel", "electric"] }
    },
    required: ["brand", "model", "year"]
  }
});

server.tool("search_models_by_brand", {
  description: "Lista todos os modelos disponíveis de uma marca na tabela FIPE",
  inputSchema: {
    type: "object",
    properties: {
      brand: { type: "string" }
    },
    required: ["brand"]
  }
});

server.tool("get_price_history", {
  description: "Retorna o histórico de preços FIPE dos últimos 6 meses. Útil para Challenger Sale: 'este modelo valorizou 5% nos últimos meses'",
  inputSchema: {
    type: "object",
    properties: {
      fipe_code: { type: "string" },
      months: { type: "number", default: 6 }
    },
    required: ["fipe_code"]
  }
});
```

### MCP Server 3: `mcp-calendar` (Agendamento)

```typescript
// mcp-calendar/server.ts
const server = new McpServer({
  name: "mcp-calendar",
  version: "1.0.0",
  description: "Agendamento de visitas e test-drives"
});

server.tool("check_availability", {
  description: "Verifica slots disponíveis para agendamento na loja",
  inputSchema: {
    type: "object",
    properties: {
      date: { type: "string", format: "date", description: "Data desejada (YYYY-MM-DD)" },
      consultant_id: { type: "string", description: "ID do consultor (opcional)" }
    },
    required: ["date"]
  }
});

server.tool("schedule_visit", {
  description: "Agenda uma visita/test-drive. Gera confirmação com protocolo.",
  inputSchema: {
    type: "object",
    properties: {
      client_name: { type: "string" },
      client_phone: { type: "string" },
      date: { type: "string", format: "date" },
      time: { type: "string", description: "Horário (HH:MM)" },
      vehicle_interest: { type: "string" },
      has_trade_in: { type: "boolean" },
      consultant_id: { type: "string" },
      notes: { type: "string" }
    },
    required: ["client_name", "client_phone", "date", "time"]
  }
});

server.tool("cancel_visit", {
  description: "Cancela um agendamento existente",
  inputSchema: {
    type: "object",
    properties: {
      appointment_id: { type: "string" },
      reason: { type: "string" }
    },
    required: ["appointment_id"]
  }
});
```

### MCP Server 4: `mcp-stock` (Estoque de Veículos)

```typescript
// mcp-stock/server.ts
const server = new McpServer({
  name: "mcp-stock",
  version: "1.0.0",
  description: "Consulta e gestão do estoque de veículos da concessionária"
});

server.tool("search_vehicles", {
  description: "Busca veículos disponíveis no estoque da loja. Use quando o cliente perguntar sobre modelos, cores ou disponibilidade.",
  inputSchema: {
    type: "object",
    properties: {
      brand: { type: "string" },
      model: { type: "string" },
      category: { type: "string", enum: ["0km", "seminovo", "moto", "all"] },
      max_price: { type: "number" },
      min_year: { type: "number" },
      color: { type: "string" },
      features: { type: "array", items: { type: "string" } }
    }
  }
});

server.tool("get_vehicle_details", {
  description: "Retorna detalhes completos de um veículo específico (fotos, features, preço range)",
  inputSchema: {
    type: "object",
    properties: {
      vehicle_id: { type: "string" }
    },
    required: ["vehicle_id"]
  }
});

// Resource: estoque completo como contexto
server.resource("full_inventory", {
  uri: "stock://inventory/summary",
  description: "Resumo do estoque atual: quantidade por marca/modelo/categoria",
  mimeType: "application/json"
});
```

### MCP Server 5: `mcp-scoring` (Lead Scoring Engine)

```typescript
// mcp-scoring/server.ts
const server = new McpServer({
  name: "mcp-scoring",
  version: "1.0.0",
  description: "Motor de Lead Scoring com BANT e qualificação"
});

server.tool("calculate_score", {
  description: "Calcula o score atualizado do lead baseado nos dados BANT coletados. Retorna classificação (cold/mql/sql) e ações recomendadas.",
  inputSchema: {
    type: "object",
    properties: {
      lead_id: { type: "string" },
      has_trade_in: { type: "boolean" },
      trade_in_estimated_value: { type: "number" },
      knows_budget: { type: "boolean" },
      budget_range: { type: "string" },
      urgency: { type: "string", enum: ["high", "medium", "low"] },
      is_decision_maker: { type: "boolean" },
      is_in_region: { type: "boolean" },
      has_specific_model: { type: "boolean" },
      financing_ready: { type: "boolean" },
      responded_within_1h: { type: "boolean" }
    },
    required: ["lead_id"]
  }
});

server.tool("get_lead_profile", {
  description: "Retorna o perfil completo do lead incluindo histórico de scores e todas as informações BANT já coletadas",
  inputSchema: {
    type: "object",
    properties: {
      lead_id: { type: "string" }
    },
    required: ["lead_id"]
  }
});

server.tool("classify_lost_reason", {
  description: "Registra o motivo de perda quando a negociação não avança",
  inputSchema: {
    type: "object",
    properties: {
      lead_id: { type: "string" },
      reason: { type: "string", enum: ["preço", "crédito", "timing", "concorrência", "desistência", "sem_retorno"] },
      notes: { type: "string" }
    },
    required: ["lead_id", "reason"]
  }
});
```

### MCP Server 6: `mcp-analytics` (Telemetria)

```typescript
// mcp-analytics/server.ts
const server = new McpServer({
  name: "mcp-analytics",
  version: "1.0.0",
  description: "Telemetria, KPIs e analytics do SDR"
});

server.tool("log_token_usage", {
  description: "Registra uso de tokens do LLM para controle de custos",
  inputSchema: {
    type: "object",
    properties: {
      conversation_id: { type: "number" },
      model: { type: "string" },
      prompt_tokens: { type: "number" },
      completion_tokens: { type: "number" }
    },
    required: ["conversation_id", "model", "prompt_tokens", "completion_tokens"]
  }
});

server.tool("log_event", {
  description: "Registra um evento no audit trail para analytics (message_sent, handoff, scheduled, etc)",
  inputSchema: {
    type: "object",
    properties: {
      lead_id: { type: "string" },
      event_type: { type: "string", enum: [
        "message_received", "message_sent", "score_updated",
        "handoff_initiated", "visit_scheduled", "follow_up_sent",
        "consent_given", "lost_marked", "won_marked"
      ]},
      event_data: { type: "object" }
    },
    required: ["lead_id", "event_type"]
  }
});

// Resource: KPIs atuais
server.resource("current_kpis", {
  uri: "analytics://kpis/current",
  description: "KPIs atuais do tenant: leads_30d, mql_rate, sql_rate, cost_per_lead",
  mimeType: "application/json"
});
```

## 6.4. Integração MCP no n8n

O n8n suporta MCP Servers nativamente via **MCP Client Tool node**. A configuração fica:

```json
{
  "mcp_servers": [
    {
      "name": "mcp-chatwoot",
      "transport": "stdio",
      "command": "node",
      "args": ["./mcp-servers/chatwoot/dist/index.js"],
      "env": {
        "CHATWOOT_URL": "{{CHATWOOT_URL}}",
        "CHATWOOT_API_KEY": "{{CHATWOOT_API_KEY}}",
        "CHATWOOT_ACCOUNT_ID": "{{CHATWOOT_ACCOUNT_ID}}"
      }
    },
    {
      "name": "mcp-fipe",
      "transport": "stdio",
      "command": "node",
      "args": ["./mcp-servers/fipe/dist/index.js"]
    },
    {
      "name": "mcp-calendar",
      "transport": "sse",
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Authorization": "Bearer {{CALENDAR_API_KEY}}"
      }
    },
    {
      "name": "mcp-stock",
      "transport": "stdio",
      "command": "node",
      "args": ["./mcp-servers/stock/dist/index.js"],
      "env": {
        "DATABASE_URL": "{{DATABASE_URL}}"
      }
    },
    {
      "name": "mcp-scoring",
      "transport": "stdio",
      "command": "node",
      "args": ["./mcp-servers/scoring/dist/index.js"],
      "env": {
        "DATABASE_URL": "{{DATABASE_URL}}"
      }
    },
    {
      "name": "mcp-analytics",
      "transport": "stdio",
      "command": "node",
      "args": ["./mcp-servers/analytics/dist/index.js"],
      "env": {
        "DATABASE_URL": "{{DATABASE_URL}}"
      }
    }
  ]
}
```

## 6.5. Workflow n8n Atualizado com MCP

Com MCP, o workflow do SDR Principal fica **mais simples**:

```
[Webhook Chatwoot] ──→ [Filter] ──→ [MCP: get_conversation_history]
                                          │
                                    ┌─────▼──────┐
                                    │ AI Agent   │ ← Tem acesso a TODOS
                                    │ (GPT-4o)   │   os 6 MCP Servers
                                    │            │   automaticamente
                                    │ Tools:     │
                                    │ • chatwoot │
                                    │ • fipe     │
                                    │ • calendar │
                                    │ • stock    │
                                    │ • scoring  │
                                    │ • analytics│
                                    └─────┬──────┘
                                          │
                                    ┌─────▼──────┐
                                    │ Split +    │
                                    │ Delay +    │
                                    │ Send via   │
                                    │ MCP:       │
                                    │ send_msg   │
                                    └────────────┘
```

**A grande vantagem**: o LLM decide SOZINHO quais tools chamar. Ele pode, numa única interação:
1. `mcp-stock.search_vehicles` → Verificar se tem o carro
2. `mcp-fipe.query_fipe_value` → Checar FIPE do carro do cliente
3. `mcp-scoring.calculate_score` → Atualizar o score
4. `mcp-chatwoot.update_contact_attributes` → Salvar dados no CRM
5. `mcp-chatwoot.send_message` → Responder ao cliente

Tudo numa única chamada LLM com function calling multi-tool.

## 6.6. Estrutura de Pastas dos MCP Servers

```
sdr_agent/
├── mcp-servers/
│   ├── chatwoot/
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point
│   │   │   ├── tools/
│   │   │   │   ├── send-message.ts
│   │   │   │   ├── private-note.ts
│   │   │   │   ├── update-contact.ts
│   │   │   │   ├── apply-label.ts
│   │   │   │   ├── assign-conversation.ts
│   │   │   │   └── get-history.ts
│   │   │   └── resources/
│   │   │       ├── tenant-config.ts
│   │   │       └── available-agents.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── fipe/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── tools/
│   │   │       ├── query-value.ts
│   │   │       ├── search-models.ts
│   │   │       └── price-history.ts
│   │   └── package.json
│   ├── calendar/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── tools/
│   │   │       ├── check-availability.ts
│   │   │       ├── schedule-visit.ts
│   │   │       └── cancel-visit.ts
│   │   └── package.json
│   ├── stock/
│   │   └── ...
│   ├── scoring/
│   │   └── ...
│   └── analytics/
│       └── ...
├── agente_SDR_automotivo.md
├── ANALISE_COMPLETA_SDR_ELITE.md
└── SDR_ELITE_ARQUITETURA_COMPLETA.md
```
