# 📊 Comparação: Versão Básica vs PRO

## 🎯 Visão Geral

O sistema tem **DUAS versões** do gerador de demos:

| Versão | Script | Uso Recomendado |
|--------|--------|-----------------|
| **Básica** | `gerar_demo.py` | Demos rápidas, apresentações simples |
| **PRO** | `gerar_demo_pro.py` | Demos completas, clientes enterprise, treinamentos |

---

## ⚙️ Features Implementadas

### ✅ VERSÃO BÁSICA (`gerar_demo.py`)

**O que tem:**
- ✅ Conversas mockadas
- ✅ Contatos com dados realistas
- ✅ Mensagens contextualizadas por nicho
- ✅ Inboxes
- ✅ Labels/Etiquetas básicas
- ✅ Atributos customizados de contato
- ✅ Status de conversas (open, pending, resolved)

**O que NÃO tem:**
- ❌ Times/Equipes
- ❌ Agentes
- ❌ Prioridades
- ❌ Notas privadas
- ❌ SLA tracking
- ❌ Respostas prontas
- ❌ Automações
- ❌ CSAT
- ❌ Roles (Admin/Supervisor/Agent)

**Tempo de geração:** ~5 minutos

**Ideal para:**
- Demos rápidas
- Apresentações básicas
- Quando o cliente quer ver só a interface

---

### 🚀 VERSÃO PRO (`gerar_demo_pro.py`)

**Todas as features da básica +**

#### 👥 **Times e Equipes (Teams)**
```
Cria times como:
• Atendimento
• Vendas  
• Pós-Venda
• Suporte Técnico
• Financeiro
```

Com:
- Auto-assignment configurável
- Descrições
- Membros atribuídos

#### 🧑‍💼 **Agentes com Roles**
```
Roles disponíveis:
👑 Admin - Administrador da conta
👨‍💼 Supervisor - Gerente de equipe
👤 Agent - Atendente padrão
```

Cada agente tem:
- Nome realista (Faker BR)
- Email mockado
- Role específico
- Atribuição a time
- Especialidade

#### ⚡ **Prioridades de Conversa**
```
• None (sem prioridade)
• Low (baixa)
• Medium (média)
• High (alta)
• Urgent (urgente)
```

Distribuição automática nas conversas mockadas.

#### 📝 **Notas Privadas**
```
Notas internas da equipe, como:
"Cliente VIP, dar prioridade"
"Lead quente, agendar retorno"
"Problema recorrente, escalar"
```

30% das conversas recebem notas privadas automaticamente.

#### 🏷️ **Labels Avançadas**
- Criação automática de labels do nicho
- Cores aleatórias
- Show on sidebar configurável
- Aplicação inteligente nas conversas

#### 💬 **Respostas Prontas (Canned Responses)**
```
Exemplos criados:
/ola → Mensagem de boas-vindas
/rastreio → Template de rastreamento
/troca → Processo de troca
/cupom → Cupons disponíveis
```

Shortcodes prontos para usar na demo.

#### ⚙️ **Automações (Automation Rules)**
```
Exemplos de automações criadas:
• Auto-assign por label
• Priorizar clientes VIP
• Encaminhar trocas para pós-venda
• Adicionar labels automaticamente
```

Baseadas em:
- Eventos (conversation_created, message_created)
- Condições (status, conteúdo, atributos)
- Ações (assign, label, priority)

#### 📊 **CSAT (Customer Satisfaction)**
```
• Enviado em conversas resolvidas
• Ratings de 1 a 5 estrelas
• Feedback textual mockado
• 40% das conversas resolvidas recebem CSAT
```

Feedback positivo e negativo balanceado.

#### 🎯 **Atribuições Inteligentes**
- Conversas distribuídas entre agentes
- Respeita especialidade do agente
- Balanceamento de carga
- Times específicos por tipo de conversa

#### 📈 **SLA (Service Level Agreement)**
```json
{
  "primeira_resposta": "5 minutos",
  "tempo_resolucao": "24 horas",
  "horario_atendimento": "8h-22h"
}
```

Configurável por template.

#### 🔧 **Atributos Customizados Avançados**
- De contato (cidade, interesse, score)
- De conversa (valor_pedido, produto, origem)
- Específicos por nicho
- Usados em automações

**Tempo de geração:** ~10-15 minutos

**Ideal para:**
- Demos completas
- Clientes enterprise
- Apresentações detalhadas
- Treinamentos de equipe
- Mostrar todo o poder da plataforma

---

## 📋 Comparação Feature por Feature

| Feature | Básica | PRO |
|---------|--------|-----|
| **Conversas** | ✅ | ✅ |
| **Contatos** | ✅ | ✅ |
| **Mensagens** | ✅ | ✅ |
| **Inboxes** | ✅ | ✅ |
| **Labels** | ✅ Básicas | ✅ Avançadas |
| **Status** | ✅ | ✅ |
| **Times/Equipes** | ❌ | ✅ |
| **Agentes** | ❌ | ✅ |
| **Roles** | ❌ | ✅ |
| **Prioridades** | ❌ | ✅ |
| **Notas Privadas** | ❌ | ✅ |
| **Canned Responses** | ❌ | ✅ |
| **Automações** | ❌ | ✅ |
| **CSAT** | ❌ | ✅ |
| **SLA** | ❌ | ✅ |
| **Atribuições** | ❌ | ✅ |
| **Custom Attributes** | ✅ Básicos | ✅ Avançados |

---

## 🎮 Como Usar Cada Versão

### **Versão Básica:**
```bash
python gerar_demo.py --nicho ecommerce --empresa "Loja ABC"
```

### **Versão PRO:**
```bash
python gerar_demo_pro.py --nicho ecommerce --empresa "Loja ABC PRO"
```

---

## 💡 Quando Usar Cada Versão?

### Use a **VERSÃO BÁSICA** quando:
- ⏰ Tem pouco tempo (reunião em 5 min)
- 🎯 Cliente quer ver só a interface
- 📱 Demo rápida de funcionalidade
- 🆕 Cliente iniciante (não precisa de tudo)
- 📊 Apresentação focada em UI/UX

### Use a **VERSÃO PRO** quando:
- 🏢 Cliente enterprise/grande
- 🎓 Treinamento de equipe
- 💼 Apresentação detalhada
- 🔧 Mostrar recursos avançados
- 🤝 Negociação de plano alto
- 🎯 Cliente técnico/conhecedor
- ⚙️ Quer ver automações e integrações

---

## 📊 Recursos Criados por Versão

### Básica:
```
📦 Pacote básico:
├── 1 Inbox
├── 25 Contatos
├── 35 Conversas
├── ~150 Mensagens
└── 10 Labels básicas
```

### PRO:
```
📦 Pacote completo:
├── 1 Inbox
├── 3-5 Times
├── 5-10 Agentes
├── 30 Contatos
├── 45 Conversas
├── ~200 Mensagens
├── 15 Labels avançadas
├── 8 Respostas Prontas
├── 3-5 Automações
├── ~15 Notas Privadas
└── ~18 CSATs
```

---

## 🚀 Performance

| Métrica | Básica | PRO |
|---------|--------|-----|
| **Tempo de geração** | 5-7 min | 12-15 min |
| **Requisições API** | ~150 | ~350 |
| **Rate limit risk** | Baixo | Médio |
| **Recursos criados** | ~220 | ~500+ |
| **Complexidade demo** | Baixa | Alta |

---

## 🎯 Estratégia Recomendada

### Para o dia a dia:
1. **Mantenha 1 demo básica sempre ativa**
   - Use para apresentações rápidas
   - Atualizar mensalmente

2. **Gere demos PRO sob demanda**
   - Para clientes importantes
   - Reuniões agendadas
   - Apresentações detalhadas

3. **Híbrido para médias empresas**
   - Comece com básica
   - Se cliente engajar, mostre PRO

---

## 🔄 Migração Básica → PRO

Você **NÃO pode migrar** uma demo básica para PRO.

**Solução:**
1. Gere demo PRO separada
2. Use inbox diferente
3. Mantenha ambas se necessário
4. Limpe a básica depois

---

## 📝 Próximas Features (Roadmap)

### Em desenvolvimento:
- [ ] Macros (ações em lote)
- [ ] Webhooks configurados
- [ ] Integrações mockadas
- [ ] Relatórios fake
- [ ] Configuração de business hours
- [ ] Templates de mensagem
- [ ] Flows de atendimento
- [ ] Chatbots mockados

---

## 💬 Qual versão usar para cada nicho?

| Nicho | Recomendação | Motivo |
|-------|--------------|--------|
| **Contabilidade** | PRO | Precisa de times (fiscal, trabalhista, societário) |
| **Concessionária** | PRO | Vendedores, gerentes, pós-venda |
| **Peças Moto** | Básica | Operação mais simples |
| **Paróquia** | Básica | Estrutura organizacional simples |
| **E-commerce** | PRO | Vendas, atendimento, pós-venda separados |
| **Saúde** | PRO | Médicos, enfermeiras, recepção |
| **Imobiliária** | Básica | Corretores individuais |
| **Restaurante** | Básica | Atendimento direto |
| **Educação** | PRO | Pedagógico, secretaria, financeiro |

---

**Desenvolvido para WhatPro Chat**

🎯 Escolha a versão certa para cada situação!
