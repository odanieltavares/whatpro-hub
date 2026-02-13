# 🎯 Guia Completo de Features - WhatPro Chat Demo Generator

## 📚 Índice
1. [Recursos do Chatwoot](#recursos-do-chatwoot)
2. [Features Implementadas](#features-implementadas)
3. [Como Cada Feature Funciona](#como-cada-feature-funciona)
4. [Endpoints da API Utilizados](#endpoints-da-api-utilizados)
5. [Limitações e Considerações](#limitações-e-considerações)

---

## 🏗️ Recursos do Chatwoot

O Chatwoot é uma plataforma completa de atendimento ao cliente. Veja todos os recursos disponíveis:

### ✅ Implementados no Script

| Feature | Versão | Descrição |
|---------|--------|-----------|
| **Conversas** | Básica/PRO | Conversas mockadas entre clientes e agentes |
| **Contatos** | Básica/PRO | Base de contatos com dados realistas |
| **Mensagens** | Básica/PRO | Histórico de mensagens por conversa |
| **Inboxes** | Básica/PRO | Canais de atendimento (Website, WhatsApp, etc) |
| **Labels** | Básica/PRO | Etiquetas para categorizar conversas |
| **Status** | Básica/PRO | Estados: Open, Pending, Resolved, Snoozed |
| **Times** | PRO | Equipes organizacionais (Vendas, Suporte, etc) |
| **Agentes** | PRO | Usuários com diferentes roles |
| **Roles** | PRO | Admin, Supervisor, Agent |
| **Prioridades** | PRO | Low, Medium, High, Urgent |
| **Notas Privadas** | PRO | Comentários internos da equipe |
| **Canned Responses** | PRO | Respostas prontas/templates |
| **Automações** | PRO | Regras de workflow automático |
| **CSAT** | PRO | Pesquisas de satisfação |
| **Atribuições** | PRO | Conversas atribuídas a agentes |
| **Custom Attributes** | Básica/PRO | Campos personalizados |

### 🔜 Não Implementados (Ainda)

| Feature | Complexidade | Motivo |
|---------|--------------|--------|
| **Macros** | Média | Requer configuração manual posterior |
| **Webhooks ativos** | Alta | Precisa de servidor externo |
| **Integrações** | Alta | APIs de terceiros (Slack, WhatsApp oficial) |
| **Relatórios** | Média | Dados gerados automaticamente com o uso |
| **Business Hours** | Baixa | Configuração global da conta |
| **Chatbots** | Alta | Requer treinamento de modelo |
| **Campaigns** | Média | Envio em massa, requer validação |
| **Artigos (Help Center)** | Média | Conteúdo extenso, específico por nicho |

---

## 🔧 Como Cada Feature Funciona

### 1. **Conversas (Conversations)**

**O que é:**
Interações entre clientes e agentes.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/conversations
{
  "inbox_id": 123,
  "contact_id": 456,
  "status": "open",
  "priority": "high",
  "assignee_id": 789
}
```

**Campos importantes:**
- `status`: open, pending, resolved, snoozed
- `priority`: null, low, medium, high, urgent
- `assignee_id`: ID do agente responsável
- `team_id`: ID do time responsável

**Na demo:**
- 30-45 conversas mockadas
- Distribuídas entre diferentes status
- Algumas com prioridade alta/urgente
- Atribuídas a agentes específicos

---

### 2. **Contatos (Contacts)**

**O que é:**
Base de clientes/leads.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/contacts
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "phone_number": "+5511999999999",
  "custom_attributes": {
    "cidade": "São Paulo",
    "interesse": "Produto X"
  }
}
```

**Campos importantes:**
- Dados básicos: name, email, phone
- `custom_attributes`: campos personalizados por nicho
- Avatar (gerado automaticamente)

**Na demo:**
- 25-30 contatos com dados realistas
- Nomes brasileiros (via Faker)
- Atributos customizados do nicho
- Emails e telefones válidos

---

### 3. **Mensagens (Messages)**

**O que é:**
Conteúdo das conversas.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/conversations/{conv_id}/messages
{
  "content": "Olá! Como posso ajudar?",
  "message_type": "outgoing",  # ou "incoming"
  "private": false  # true para notas privadas
}
```

**Tipos:**
- `incoming`: Mensagem do cliente
- `outgoing`: Mensagem do agente
- `private`: Nota interna (só equipe vê)

**Na demo:**
- 3-8 mensagens por conversa
- Alternância cliente/agente realista
- Contextualizadas por nicho
- Algumas com notas privadas

---

### 4. **Times/Equipes (Teams)**

**O que é:**
Organização de agentes em departamentos.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/teams
{
  "name": "Vendas",
  "description": "Equipe de vendas e conversão",
  "allow_auto_assign": true
}
```

**Campos importantes:**
- `name`: Nome do time
- `description`: Descrição/função
- `allow_auto_assign`: Permite atribuição automática

**Na demo:**
Exemplos criados:
- 🎯 Atendimento
- 💰 Vendas
- 📦 Pós-Venda
- 🔧 Suporte Técnico
- 💳 Financeiro

---

### 5. **Agentes (Agents)**

**O que é:**
Usuários que atendem clientes.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/agents
{
  "name": "Maria Santos",
  "email": "maria@empresa.com",
  "role": "agent"  # admin, agent, supervisor
}
```

**Roles disponíveis:**

| Role | Permissões | Ícone |
|------|-----------|-------|
| **Admin** | Acesso total, configurações | 👑 |
| **Supervisor** | Gerenciar equipe, ver todas conversas | 👨‍💼 |
| **Agent** | Atender conversas atribuídas | 👤 |

**Na demo:**
- 5-10 agentes mockados
- Mix de roles
- Nomes realistas brasileiros
- Atribuídos a times específicos

---

### 6. **Prioridades**

**O que é:**
Nível de urgência da conversa.

**Como usamos:**
```python
# Ao criar conversa
{
  "priority": "high"  # null, low, medium, high, urgent
}
```

**Níveis:**
- `null`: Sem prioridade (padrão)
- `low`: Baixa prioridade
- `medium`: Média prioridade
- `high`: Alta prioridade
- `urgent`: Urgente

**Na demo:**
Distribuição automática:
- 50% sem prioridade
- 20% baixa/média
- 20% alta
- 10% urgente

---

### 7. **Notas Privadas (Private Notes)**

**O que é:**
Comentários internos da equipe, não visíveis ao cliente.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/conversations/{conv_id}/messages
{
  "content": "Cliente VIP, dar prioridade",
  "message_type": "outgoing",
  "private": true  # <-- Isso torna privada
}
```

**Uso:**
- Passar informações entre agentes
- Registrar observações
- Alertas internos

**Na demo:**
Exemplos de notas criadas:
- "Cliente VIP, dar prioridade"
- "Lead quente, agendar retorno"
- "Problema recorrente, escalar"
- "Já comprou antes, verificar histórico"

30% das conversas recebem notas.

---

### 8. **Labels/Etiquetas**

**O que é:**
Tags para categorizar conversas.

**Como criamos:**
```python
# 1. Criar label
POST /api/v1/accounts/{account_id}/labels
{
  "title": "urgente",
  "color": "#FF6B6B"
}

# 2. Aplicar em conversa
POST /api/v1/accounts/{account_id}/conversations/{conv_id}/labels
{
  "labels": ["urgente", "vip"]
}
```

**Na demo:**
- 10-15 labels por nicho
- Cores aleatórias
- Aplicadas automaticamente
- Específicas do contexto

---

### 9. **Respostas Prontas (Canned Responses)**

**O que é:**
Templates de mensagens rápidas.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/canned_responses
{
  "short_code": "ola",
  "content": "Olá! Seja bem-vindo. Como posso ajudar?"
}
```

**Uso no Chatwoot:**
Agente digita `/ola` e a mensagem completa aparece.

**Na demo:**
Exemplos criados:
- `/ola` → Boas-vindas
- `/rastreio` → Template rastreamento
- `/troca` → Processo de troca
- `/cupom` → Cupons disponíveis
- `/despedida` → Encerramento

---

### 10. **Automações (Automation Rules)**

**O que é:**
Regras que executam ações automaticamente baseadas em eventos.

**Como criamos:**
```python
POST /api/v1/accounts/{account_id}/automation_rules
{
  "name": "Auto-assign Vendas",
  "event_name": "conversation_created",
  "conditions": [
    {
      "attribute_key": "status",
      "filter_operator": "equal_to",
      "values": ["open"]
    }
  ],
  "actions": [
    {
      "action_name": "assign_team",
      "action_params": [team_id]
    }
  ]
}
```

**Componentes:**

1. **Evento** (quando executar):
   - `conversation_created`
   - `message_created`
   - `conversation_updated`

2. **Condições** (se):
   - Status da conversa
   - Conteúdo da mensagem
   - Atributos do contato
   - Labels presentes

3. **Ações** (então):
   - Atribuir a time/agente
   - Adicionar/remover label
   - Mudar status
   - Mudar prioridade
   - Enviar mensagem

**Na demo:**
Exemplos criados:
- Auto-assign novas conversas
- Priorizar clientes VIP
- Encaminhar trocas para pós-venda
- Adicionar labels automaticamente

---

### 11. **CSAT (Customer Satisfaction)**

**O que é:**
Pesquisa de satisfação ao finalizar atendimento.

**Como simulamos:**
```python
# Enviar como mensagem especial
POST /api/v1/accounts/{account_id}/conversations/{conv_id}/messages
{
  "content": "Avaliação: 5 estrelas\nFeedback: Ótimo atendimento!",
  "message_type": "incoming",
  "content_attributes": {
    "submitted_values": [{
      "name": "csat_survey_response",
      "value": "5"
    }]
  }
}
```

**Ratings:**
- ⭐ (1 estrela) - Muito insatisfeito
- ⭐⭐ (2 estrelas) - Insatisfeito
- ⭐⭐⭐ (3 estrelas) - Neutro
- ⭐⭐⭐⭐ (4 estrelas) - Satisfeito
- ⭐⭐⭐⭐⭐ (5 estrelas) - Muito satisfeito

**Na demo:**
- 40% das conversas resolvidas têm CSAT
- Mix de ratings (1-5)
- Feedback textual mockado
- Distribuição realista

---

### 12. **Atributos Customizados**

**O que é:**
Campos personalizados para contatos e conversas.

**Tipos:**

**De Contato:**
```python
{
  "custom_attributes": {
    "cidade": "São Paulo",
    "interesse": "Produto X",
    "score": "hot",
    "origem": "Instagram"
  }
}
```

**De Conversa:**
```python
{
  "custom_attributes": {
    "valor_pedido": "R$ 1.500,00",
    "produto": "Notebook Dell",
    "urgencia": "alta"
  }
}
```

**Na demo:**
Específicos por nicho:
- **E-commerce**: status_pedido, valor_ticket, categoria
- **Saúde**: tipo_consulta, convenio, urgencia
- **Educação**: serie, periodo, responsavel

---

## 📡 Endpoints da API Utilizados

### Autenticação
```
Header: api_access_token: {sua_chave}
```

### Principais Endpoints

| Recurso | Endpoint | Método |
|---------|----------|--------|
| Conversations | `/api/v1/accounts/{id}/conversations` | GET, POST, PUT |
| Messages | `/api/v1/accounts/{id}/conversations/{cid}/messages` | GET, POST |
| Contacts | `/api/v1/accounts/{id}/contacts` | GET, POST, PUT |
| Teams | `/api/v1/accounts/{id}/teams` | GET, POST, PUT |
| Agents | `/api/v1/accounts/{id}/agents` | GET, POST, PUT |
| Labels | `/api/v1/accounts/{id}/labels` | GET, POST |
| Canned Responses | `/api/v1/accounts/{id}/canned_responses` | GET, POST |
| Automation Rules | `/api/v1/accounts/{id}/automation_rules` | GET, POST |
| Inboxes | `/api/v1/accounts/{id}/inboxes` | GET, POST |

---

## ⚠️ Limitações e Considerações

### Rate Limiting
- **100 requisições/minuto** por API key
- Script PRO faz ~350 requisições
- Implementado retry com backoff exponencial

### Dados Mockados
- **Não são dados reais** - apenas demonstração
- Contatos com emails fake (usar domínio @demo.com)
- Telefones válidos mas não reais
- Conversas simuladas, não autênticas

### Features Não Disponíveis
- **WhatsApp oficial**: Requer contrato Meta Business
- **Envio de emails**: Requer configuração SMTP
- **Chatbots treinados**: Requer machine learning
- **Integrações reais**: APIs de terceiros

### Limpeza
- **Sempre limpar** após demonstração
- Dados de teste não devem ficar na produção
- Use `limpar_demo.py` ou `limpar_demo_pro.py`

### Performance
- Versão básica: ~5 minutos
- Versão PRO: ~12-15 minutos
- Depende da velocidade da API
- Network latency pode impactar

---

## 🎯 Melhores Práticas

### Antes de Gerar
1. ✅ Verificar credenciais da API
2. ✅ Confirmar template do nicho existe
3. ✅ Definir nome da empresa
4. ✅ Escolher versão (básica vs PRO)

### Durante Geração
1. ✅ Não interromper o processo
2. ✅ Monitorar erros no console
3. ✅ Aguardar conclusão completa

### Após Geração
1. ✅ Verificar dados no Chatwoot
2. ✅ Testar features criadas
3. ✅ Preparar roteiro de apresentação

### Após Demonstração
1. ✅ Limpar dados mockados
2. ✅ Documentar feedback do cliente
3. ✅ Planejar próxima demo se necessário

---

## 📚 Recursos Adicionais

- **API Docs**: https://www.chatwoot.com/developers/api/
- **GitHub**: https://github.com/chatwoot/chatwoot
- **Community**: https://discord.gg/cJXdrwS

---

**Desenvolvido para WhatPro Chat**

🎯 Sistema completo de geração de demos mockadas com todas as features do Chatwoot!
