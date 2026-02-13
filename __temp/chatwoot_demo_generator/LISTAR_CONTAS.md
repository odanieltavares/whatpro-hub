# 🔍 Listar Contas e Ver Informações

## 📋 Novos Scripts Disponíveis

Adicionamos 2 scripts úteis para você ver o que já existe no Chatwoot:

| Script | O que faz |
|--------|-----------|
| `listar_accounts.py` | Lista todas as contas/empresas que seu token tem acesso |
| `ver_conta.py` | Mostra informações detalhadas de uma conta específica |

---

## 🏢 LISTAR CONTAS/EMPRESAS

### **O que faz:**
Mostra todas as contas (accounts) que você tem permissão de acessar com seu token.

Isso é útil quando:
- ✅ Você tem acesso a múltiplas empresas
- ✅ Quer descobrir qual Account ID usar
- ✅ Quer ver informações básicas de cada conta

---

### **Como usar:**

**Windows:**
```cmd
python listar_accounts.py
```

**Linux/Mac:**
```bash
python3 listar_accounts.py
```

---

### **Exemplo de Saída:**

```
======================================================================
  📊 CONTAS/EMPRESAS DISPONÍVEIS (3)
======================================================================

[1] ✅ WhatPro Chat - Produção
    ID: 1
    Domínio: chat.whatpro.com.br
    Email: suporte@whatpro.com.br
    Idioma: pt_BR
    Status: active
    Features ativas: inbox_management, conversations, contacts

[2] ✅ WhatPro Chat - Testes
    ID: 2
    Domínio: test.whatpro.com.br
    Email: dev@whatpro.com.br
    Idioma: pt_BR
    Status: active

[3] ✅ Cliente Demo - Loja ABC
    ID: 5
    Domínio: demo.whatpro.com.br
    Email: demo@whatpro.com.br
    Idioma: pt_BR
    Status: active

======================================================================

💡 DICA: Use o ID da conta no seu .env:
   CHATWOOT_ACCOUNT_ID=1
```

---

### **Usar com argumentos:**

Se não tiver .env configurado:

```bash
# Windows
python listar_accounts.py --api-url https://chat.whatpro.com.br --api-key SUA_CHAVE

# Linux/Mac
python3 listar_accounts.py --api-url https://chat.whatpro.com.br --api-key SUA_CHAVE
```

---

### **Salvar em JSON:**

O script salva automaticamente em `accounts.json` com todas as informações:

```json
[
  {
    "id": 1,
    "name": "WhatPro Chat - Produção",
    "locale": "pt_BR",
    "domain": "chat.whatpro.com.br",
    "support_email": "suporte@whatpro.com.br",
    "status": "active",
    "features": {
      "inbox_management": true,
      "conversations": true,
      "contacts": true
    }
  }
]
```

---

## 📊 VER INFORMAÇÕES DA CONTA

### **O que faz:**
Mostra **TUDO** que existe na conta configurada no seu .env:
- Inboxes (canais)
- Agentes
- Times/Equipes
- Labels
- Respostas Prontas
- Automações
- Contatos
- Conversas

Útil para:
- ✅ Ver o que já existe antes de criar demo
- ✅ Verificar se a demo foi criada corretamente
- ✅ Auditar configurações da conta

---

### **Como usar:**

**Windows:**
```cmd
python ver_conta.py
```

**Linux/Mac:**
```bash
python3 ver_conta.py
```

---

### **Exemplo de Saída:**

```
======================================================================
  📊 INFORMAÇÕES DA CONTA - WhatPro Chat
======================================================================

🔗 URL: https://chat.whatpro.com.br
🆔 Account ID: 1

======================================================================
📥 INBOXES (Canais de Atendimento)
======================================================================

  [123] Loja ABC PRO
      Canal: website
      Status: ✅ Ativo

  [124] Atendimento WhatsApp
      Canal: whatsapp
      Status: ✅ Ativo

======================================================================
👥 AGENTES
======================================================================

  Total: 7 agentes
  👑 Admins: 1
  👤 Agents: 6

  🟢 👑 Maria Silva
      Email: maria@whatpro.com
  🟢 👤 João Pedro
      Email: joao@whatpro.com
  ⚪ 👤 Ana Costa
      Email: ana@whatpro.com

  ... e mais 4 agentes

======================================================================
👔 TIMES/EQUIPES
======================================================================

  Total: 3 times

  📁 Vendas
      Descrição: Time de vendas e conversão
      Auto-assign: ✅ Sim

  📁 Atendimento
      Descrição: Time de atendimento ao cliente
      Auto-assign: ✅ Sim

  📁 Pós-Venda
      Descrição: Trocas e devoluções
      Auto-assign: ❌ Não

======================================================================
🏷️  LABELS/ETIQUETAS
======================================================================

  Total: 15 labels

  • pedido (#FF6B6B)
  • rastreamento (#4ECDC4)
  • troca (#45B7D1)
  • vip (#FFA07A)
  • urgente (#F7DC6F)

  ... e mais 10 labels

======================================================================
💬 RESPOSTAS PRONTAS (Canned Responses)
======================================================================

  Total: 8 respostas

  /ola
      Olá! Seja bem-vindo. Como posso ajudar?...
  /rastreio
      Vou verificar o rastreamento agora mesmo!...
  /troca
      Fazemos trocas em até 7 dias após o recebimento...

======================================================================
⚙️  AUTOMAÇÕES
======================================================================

  Total: 3 automações

  ✅ Auto-assign Vendas
      Evento: conversation_created
  ✅ Priorizar VIPs
      Evento: conversation_created
  ❌ Encaminhar Trocas (Inativa)
      Evento: message_created

======================================================================
📇 CONTATOS
======================================================================

  Total visível: 30 contatos (mostrando primeiros 25)

======================================================================
💬 CONVERSAS
======================================================================

  Total visível: 45 conversas (mostrando primeiras 25)

  Por status:
    ✅ resolved: 27
    🟢 open: 12
    🟡 pending: 4
    💤 snoozed: 2

======================================================================

📊 RESUMO GERAL:
  • Inboxes: 2
  • Agentes: 7
  • Times: 3
  • Labels: 15
  • Respostas Prontas: 8
  • Automações: 3
  • Contatos: 30+
  • Conversas: 45+

======================================================================
```

---

## 🎯 CASOS DE USO

### **Caso 1: Descobrir Account ID**

Se você tem acesso a múltiplas contas:

```bash
# 1. Listar contas
python listar_accounts.py

# Resultado:
# [1] WhatPro - Produção (ID: 1)
# [2] WhatPro - Testes (ID: 2)

# 2. Escolher qual usar
# Editar .env:
CHATWOOT_ACCOUNT_ID=1
```

---

### **Caso 2: Verificar se demo foi criada**

Após gerar uma demo:

```bash
# Gerar demo
python gerar_demo_pro.py --nicho ecommerce --empresa "Loja Teste"

# Verificar se foi criada
python ver_conta.py

# Deve mostrar:
# Inboxes: "Loja Teste" ✅
# Agentes: 7 (incluindo os mockados) ✅
# Times: 3 ✅
# etc.
```

---

### **Caso 3: Ver o que existe antes de criar demo**

Para não criar coisas duplicadas:

```bash
# Ver o que já existe
python ver_conta.py

# Resultado:
# Inboxes: 5 já existem
# Agentes: 3 já existem

# Criar demo em conta diferente ou limpar primeiro
python limpar_demo.py --inbox "Demo Antiga"
```

---

### **Caso 4: Auditoria/Documentação**

Para documentar configurações:

```bash
# Ver tudo
python ver_conta.py > relatorio_conta.txt

# OU salvar JSON
python listar_accounts.py --json > accounts.json
```

---

## 🔑 INFORMAÇÕES SOBRE API DO CHATWOOT

### **Endpoint usado em listar_accounts.py:**

```
GET /api/v1/accounts
```

**Retorna:**
```json
[
  {
    "id": 1,
    "name": "WhatPro Chat",
    "locale": "pt_BR",
    "domain": "chat.whatpro.com.br",
    "support_email": "suporte@whatpro.com.br",
    "status": "active",
    "features": {...}
  }
]
```

---

### **Endpoints usados em ver_conta.py:**

```
GET /api/v1/accounts/{id}/inboxes
GET /api/v1/accounts/{id}/agents
GET /api/v1/accounts/{id}/teams
GET /api/v1/accounts/{id}/labels
GET /api/v1/accounts/{id}/canned_responses
GET /api/v1/accounts/{id}/contacts
GET /api/v1/accounts/{id}/conversations
GET /api/v1/accounts/{id}/automation_rules
```

---

## ⚠️ PERMISSÕES

**Quem pode listar accounts:**
- ✅ Usuário com token válido
- ✅ Mostra apenas contas que o usuário tem acesso

**Quem pode ver informações da conta:**
- ✅ Admin da conta
- ✅ Agents (com limitações dependendo de permissões)

---

## 🆘 ERROS COMUNS

### **"401 Unauthorized"**
```
❌ API Key inválida ou expirada
```

**Solução:**
1. Gere nova API Key em: Settings → Profile → Access Token
2. Cole no .env

---

### **"403 Forbidden"**
```
❌ Sem permissão de acesso
```

**Solução:**
1. Verifique se seu usuário tem permissão de admin
2. Ou use token de um admin

---

### **"404 Not Found"**
```
❌ Account ID não encontrado
```

**Solução:**
1. Execute `python listar_accounts.py`
2. Use o ID correto no .env

---

## 💡 DICAS

### **Ver só resumo rápido:**
```bash
# Ver só inboxes
python ver_conta.py | grep "INBOXES" -A 20

# Ver só agentes
python ver_conta.py | grep "AGENTES" -A 20
```

### **Salvar relatório completo:**
```bash
python ver_conta.py > relatorio_$(date +%Y%m%d).txt
```

### **Comparar antes e depois:**
```bash
# Antes
python ver_conta.py > antes.txt

# Gerar demo
python gerar_demo_pro.py --nicho ecommerce

# Depois
python ver_conta.py > depois.txt

# Comparar
diff antes.txt depois.txt
```

---

## 📚 RESUMO DOS COMANDOS

| Comando | O que faz |
|---------|-----------|
| `python listar_accounts.py` | Lista contas disponíveis |
| `python ver_conta.py` | Mostra tudo da conta atual |
| `python ver_conta.py > relatorio.txt` | Salva relatório em arquivo |

---

**Desenvolvido para WhatPro Chat**

🔍 Veja tudo que existe no seu Chatwoot antes de criar demos!
