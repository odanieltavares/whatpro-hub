# WhatPro Hub

## Product Requirements Document (PRD)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                           W H A T P R O   H U B                              ║
║                                                                              ║
║                    Product Requirements Document (PRD)                       ║
║                                                                              ║
║                              Version 1.0.0                                   ║
║                            Janeiro 2026                                      ║
║                                                                              ║
║══════════════════════════════════════════════════════════════════════════════║
║                                                                              ║
║  Classificação: Confidencial                                                 ║
║  Status: Draft para Revisão                                                  ║
║  Autor: Equipe de Arquitetura WhatPro                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Histórico de Revisões

| Versão | Data       | Autor          | Descrição             |
| ------ | ---------- | -------------- | --------------------- |
| 1.0.0  | 2026-01-31 | Equipe WhatPro | Versão inicial do PRD |

---

## Índice

1. [Sumário Executivo](#1-sumário-executivo)
2. [Contexto e Problema](#2-contexto-e-problema)
3. [Visão do Produto](#3-visão-do-produto)
4. [Stakeholders e Personas](#4-stakeholders-e-personas)
5. [Requisitos Funcionais](#5-requisitos-funcionais)
6. [Requisitos Não-Funcionais](#6-requisitos-não-funcionais)
7. [Arquitetura do Sistema](#7-arquitetura-do-sistema)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Especificação de APIs](#9-especificação-de-apis)
10. [Fluxos de Usuário](#10-fluxos-de-usuário)
11. [Integrações](#11-integrações)
12. [Segurança e Compliance](#12-segurança-e-compliance)
13. [Observabilidade](#13-observabilidade)
14. [Deployment e Infraestrutura](#14-deployment-e-infraestrutura)
15. [Roadmap](#15-roadmap)
16. [Glossário](#16-glossário)
17. [Apêndices](#17-apêndices)

---

# 1. Sumário Executivo

## 1.1 O Que É o WhatPro Hub

O **WhatPro Hub** é uma plataforma SaaS enterprise-grade que se integra nativamente ao Chatwoot para fornecer funcionalidades avançadas de gestão de atendimento, automação e operações. A solução opera como uma camada de extensão que adiciona capacidades não disponíveis nativamente no Chatwoot, mantendo total compatibilidade e integração transparente.

## 1.2 Proposta de Valor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROPOSTA DE VALOR                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PARA empresas que utilizam Chatwoot para atendimento ao cliente            │
│                                                                             │
│  QUE precisam de funcionalidades avançadas de gestão, automação e           │
│  controle operacional não disponíveis nativamente                           │
│                                                                             │
│  O WHATPRO HUB é uma plataforma de extensão integrada                       │
│                                                                             │
│  QUE oferece:                                                               │
│  • Kanban visual para gestão de conversas e leads                          │
│  • Hub centralizado de providers e integrações                              │
│  • Sistema de automações avançadas                                          │
│  • Analytics e métricas estendidas                                          │
│  • Controle de acesso granular (RBAC)                                       │
│                                                                             │
│  DIFERENTEMENTE DE soluções externas desconectadas                          │
│                                                                             │
│  NOSSO PRODUTO se integra nativamente via Dashboard Apps e Dashboard        │
│  Scripts, proporcionando experiência unificada dentro do Chatwoot           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.3 Métricas de Sucesso

| Métrica             | Meta Inicial | Meta 12 Meses |
| ------------------- | ------------ | ------------- |
| Uptime              | 99.5%        | 99.9%         |
| Latência P95 API    | < 200ms      | < 100ms       |
| Tempo de Onboarding | < 30 min     | < 15 min      |
| NPS                 | > 40         | > 60          |
| Churn Mensal        | < 5%         | < 3%          |

---

# 2. Contexto e Problema

## 2.1 Contexto de Mercado

O Chatwoot é uma plataforma open-source de atendimento ao cliente que ganhou tração significativa como alternativa a soluções proprietárias como Intercom e Zendesk. Apesar de suas capacidades robustas, existem lacunas funcionais que limitam sua adoção em ambientes enterprise.

## 2.2 Problemas Identificados

```




┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROBLEMAS A SEREM RESOLVIDOS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  P1. GESTÃO VISUAL DE CONVERSAS                                             │
│  ├── Problema: Chatwoot não possui visualização Kanban nativa               │
│  ├── Impacto: Dificuldade em gerenciar pipeline de leads e tarefas         │
│  └── Frequência: Diária, afeta todos os agentes                            │
│                                                                             │
│  P2. GESTÃO CENTRALIZADA DE PROVIDERS                                       │
│  ├── Problema: Múltiplos providers WhatsApp sem gestão unificada           │
│  ├── Impacto: Complexidade operacional, falta de visibilidade              │
│  └── Frequência: Semanal, afeta administradores                            │
│                                                                             │
│  P3. CONTROLE DE ACESSO LIMITADO                                            │
│  ├── Problema: RBAC do Chatwoot é básico para enterprise                   │
│  ├── Impacto: Não atende compliance de grandes empresas                    │
│  └── Frequência: Constante, bloqueio para enterprise                       │
│                                                                             │
│  P4. AUTOMAÇÕES LIMITADAS                                                   │
│  ├── Problema: Automation rules são básicas                                │
│  ├── Impacto: Processos manuais repetitivos                                │
│  └── Frequência: Diária, reduz produtividade                               │
│                                                                             │
│  P5. ANALYTICS SUPERFICIAIS                                                 │
│  ├── Problema: Relatórios nativos não atendem gestão avançada              │
│  ├── Impacto: Decisões sem dados, falta de visibilidade                    │
│  └── Frequência: Semanal, afeta gestores                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.3 Solução Proposta

O WhatPro Hub resolve esses problemas através de uma arquitetura de extensão que:

1. **Não substitui** o Chatwoot, mas o **complementa**
2. **Integra nativamente** via APIs e mecanismos oficiais
3. **Preserva** a experiência do usuário existente
4. **Adiciona** funcionalidades enterprise sem fragmentar a operação

---

# 3. Visão do Produto

## 3.1 Arquitetura Conceitual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           ARQUITETURA CONCEITUAL                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          CHATWOOT                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Interface do Usuário                      │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │   │
│  │  │  │   Sidebar   │  │  Conversa   │  │   Dashboard Apps    │  │   │   │
│  │  │  │   (Native)  │  │  (Native)   │  │   (WhatPro Hub)     │  │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                      │   │
│  │  ┌───────────────────────────┼───────────────────────────────┐     │   │
│  │  │                 Dashboard Script                           │     │   │
│  │  │  • Injeção de menus customizados no sidebar               │     │   │
│  │  │  • Painéis flutuantes via iframe                          │     │   │
│  │  │  • Comunicação via postMessage                            │     │   │
│  │  └───────────────────────────┼───────────────────────────────┘     │   │
│  └──────────────────────────────┼──────────────────────────────────────┘   │
│                                 │                                          │
│                         ┌───────┴───────┐                                  │
│                         │   Webhooks    │                                  │
│                         │   REST API    │                                  │
│                         │   postMessage │                                  │
│                         └───────┬───────┘                                  │
│                                 │                                          │
│  ┌──────────────────────────────┼──────────────────────────────────────┐   │
│  │                      WHATPRO HUB                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                      Frontend (Next.js)                      │   │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │   │   │
│  │  │  │  Kanban   │  │    Hub    │  │  Analytics│  │  Settings │ │   │   │
│  │  │  │  Module   │  │   Module  │  │   Module  │  │   Module  │ │   │   │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                      Backend (Go/Fiber)                      │   │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │   │   │
│  │  │  │   Auth    │  │  Kanban   │  │    Hub    │  │ Automation│ │   │   │
│  │  │  │  Service  │  │  Service  │  │  Service  │  │  Service  │ │   │   │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                      Data Layer                              │   │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │   │   │
│  │  │  │ PostgreSQL│  │   Redis   │  │   MinIO   │  │   Loki    │ │   │   │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Módulos do Sistema

### 3.2.1 Hub Manager

Módulo central de administração responsável por:

- Gestão de contas/empresas (sincronizadas do Chatwoot)
- Gestão de usuários e permissões
- Configuração de providers (WhatsApp APIs)
- Configurações globais do sistema

### 3.2.2 Kanban

Sistema visual de gestão que permite:

- Visualização de conversas em formato de cards
- Organização em estágios customizáveis (pipelines)
- Gestão de leads e oportunidades
- Automações de movimentação

### 3.2.3 Automações

Engine de automação que oferece:

- Triggers baseados em eventos do Chatwoot
- Condições compostas (AND/OR)
- Ações encadeadas
- Integração com N8N para workflows complexos

### 3.2.4 Analytics

Dashboard de métricas incluindo:

- Performance de agentes
- Funil de conversão
- Tempos de resposta
- Heat maps de atividade

---

# 4. Stakeholders e Personas

## 4.1 Mapa de Stakeholders

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STAKEHOLDERS MAP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────────┐                                │
│                              │  INVESTIDOR │                                │
│                              │  (Parceiro) │                                │
│                              └──────┬──────┘                                │
│                                     │                                       │
│         ┌───────────────────────────┼───────────────────────────┐          │
│         │                           │                           │          │
│  ┌──────┴──────┐            ┌───────┴───────┐           ┌───────┴───────┐  │
│  │ SUPER ADMIN │            │    ADMIN      │           │   AGENTES     │  │
│  │ (Operador   │            │  (Cliente/    │           │  (Usuários    │  │
│  │  WhatPro)   │            │   Empresa)    │           │   Finais)     │  │
│  └──────┬──────┘            └───────┬───────┘           └───────┬───────┘  │
│         │                           │                           │          │
│         │    ┌──────────────────────┼──────────────────────┐    │          │
│         │    │                      │                      │    │          │
│         └────┼──────────────────────┼──────────────────────┼────┘          │
│              │                      │                      │               │
│              ▼                      ▼                      ▼               │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                         WHATPRO HUB                                │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Personas Detalhadas

### Persona 1: Super Admin (Operador WhatPro)

```yaml
Nome: Carlos - Administrador de Plataforma
Idade: 35 anos
Cargo: DevOps / System Administrator
Empresa: WhatPro (fornecedor da solução)

Background:
  - Experiência em infraestrutura e sistemas
  - Conhecimento em Docker, Linux, redes
  - Responsável pela operação multi-tenant

Objetivos:
  - Manter alta disponibilidade do sistema
  - Gerenciar múltiplas empresas/clientes
  - Configurar providers de WhatsApp
  - Monitorar saúde do sistema

Dores:
  - Falta de visibilidade centralizada
  - Gestão manual de integrações
  - Dificuldade em debugging cross-tenant

Necessidades do Sistema:
  - Dashboard de status global
  - Gestão centralizada de providers
  - Logs e métricas unificados
  - Ferramentas de troubleshooting
```

### Persona 2: Admin (Cliente/Empresa)

```yaml
Nome: Maria - Gerente de Atendimento
Idade: 40 anos
Cargo: Gerente de Customer Success
Empresa: Contabilidade ABC (65 agentes)

Background:
  - Gestão de equipes de atendimento
  - Foco em métricas e KPIs
  - Sem conhecimento técnico profundo

Objetivos:
  - Melhorar taxa de conversão de leads
  - Reduzir tempo de resposta
  - Ter visibilidade da operação
  - Gerar relatórios para diretoria

Dores:
  - Dados fragmentados
  - Não consegue ver pipeline de vendas
  - Relatórios manuais no Excel
  - Dependência de TI para configurações

Necessidades do Sistema:
  - Dashboard executivo
  - Kanban de leads/oportunidades
  - Relatórios automatizados
  - Interface intuitiva
```

### Persona 3: Agente (Operador)

```yaml
Nome: João - Atendente
Idade: 25 anos
Cargo: Customer Service Representative
Empresa: Contabilidade ABC

Background:
  - Atendimento ao cliente
  - Usuário de sistemas diversos
  - Foco em produtividade

Objetivos:
  - Atender rápido e bem
  - Organizar suas conversas
  - Acompanhar status de leads
  - Não perder follow-ups

Dores:
  - Conversas se perdem na fila
  - Não sabe prioridade dos atendimentos
  - Esquece de fazer follow-up
  - Interface do Chatwoot limitada

Necessidades do Sistema:
  - Visão pessoal do Kanban
  - Lembretes e automações
  - Acesso rápido a templates
  - Interface dentro do Chatwoot
```

---

# 5. Requisitos Funcionais

## 5.1 Estrutura de Requisitos

Os requisitos seguem o formato:

- **ID**: Identificador único (MOD-XXX)
- **Prioridade**: P0 (Crítico), P1 (Alto), P2 (Médio), P3 (Baixo)
- **Módulo**: Hub, Kanban, Auth, Analytics, Automation
- **Descrição**: O que o sistema deve fazer
- **Critérios de Aceite**: Condições para considerar completo

---

## 5.2 Módulo: Autenticação e Autorização (AUTH)

### AUTH-001: Autenticação Multi-Método

**ID:** AUTH-001 | **Prioridade:** P0

O sistema deve suportar três métodos distintos de autenticação para cobrir diferentes casos de uso:

1.  **Usuário (Humano):**
    - **Fluxo:** Login via Email/Senha ou SSO Chatwoot.
    - **Tokens:** JWT de acesso curto (~15min) + Refresh Token rotativo (em Cookie HTTPOnly).
    - **Controle:** Tabela de sessões (`sessions`) rastreando Device, IP e User Agent para permitir revogação remota.

2.  **API Key (Máquina/Integração):**
    - **Fluxo:** Header `X-API-Key: wp_live_<prefix>.<secret>`.
    - **Segurança:** Apenas hash do segredo é armazenado no DB.
    - **Controle:** Scopes granulares, rate limit separado e auditoria de uso.

3.  **Instance Token (Embed/Provider):**
    - **Fluxo:** Token específico para iframes do Chatwoot ou webhooks de providers.
    - **Escopo:** Privilégio mínimo necessário (ex: `webhooks:push`).

### AUTH-002: Sistema RBAC

```yaml
ID: AUTH-002
Prioridade: P0
Módulo: Auth
Título: Role-Based Access Control

Descrição: |
  O sistema deve implementar controle de acesso baseado em papéis
  com quatro níveis hierárquicos.

Hierarquia de Roles:
  super_admin:
    Nível: Platform (instalação inteira)
    Descrição: Operador do WhatPro Hub
    Permissões:
      - Gestão de todas as accounts
      - Configuração de providers
      - Acesso a logs globais
      - Billing e licenciamento

  admin:
    Nível: Account (empresa específica)
    Descrição: Administrador da empresa cliente
    Permissões:
      - Gestão de usuários da conta
      - Configuração de Kanban/Pipelines
      - Acesso a relatórios da conta
      - Automações da conta

  supervisor:
    Nível: Team (time específico)
    Descrição: Líder de equipe
    Permissões:
      - Visualização de métricas do time
      - Reatribuição de conversas
      - Gestão de agentes do time

  agent:
    Nível: Own (recursos próprios)
    Descrição: Atendente
    Permissões:
      - Visualização do Kanban próprio
      - Movimentação de cards próprios
      - Uso de templates

Critérios de Aceite:
  - [ ] Permissões são verificadas em cada request
  - [ ] Super admin pode impersonar outros usuários
  - [ ] Admin não vê dados de outras accounts
  - [ ] Agent só vê recursos atribuídos a si
```

### AUTH-003: Audit Logging Avançado

**ID:** AUTH-003 | **Prioridade:** P0

Registro imutável de ações críticas:

- **Campos:** `account_id`, `user_id`, `action`, `resource_type`, `resource_id`, `ip`, `user_agent`, `old_value`, `new_value`.
- **Escopo:** Login/Logout, Mudança de Permissão, Criação/Exclusão de Recursos, Acesso a Dados Sensíveis.

---

## 5.3 Módulo: Hub Manager (HUB)

### HUB-001: Gestão de Accounts e Planos

**ID:** HUB-001 | **Prioridade:** P0

Além da sincronização com Chatwoot, o Hub gerencia os planos SaaS:

- **Tabela `account_entitlements`:** Define limites (`max_inboxes`, `max_agents`, etc) e feature flags (`kanban_enabled`).
- **Tabela `usage_daily`:** Rastreia consumo diário para billing e dashboard (DAU, Mensagens, Requests).

### HUB-002: Gestão de Providers Segura

**ID:** HUB-002 | **Prioridade:** P0

Gestão de instâncias de WhatsApp (Evolution API, etc):

- Credenciais armazenadas com criptografia (AES-GCM).
- Tokens de instância gerados com escopo limitado.
- Webhooks com validação de assinatura e verificação de idempotência (`event_id`).

### HUB-003: Gestão de Usuários

```yaml
ID: HUB-003
Prioridade: P0
Módulo: Hub
Título: Sincronização e Gestão de Usuários

Descrição: |
  O sistema deve sincronizar usuários do Chatwoot e permitir
  configurações de permissão adicionais.

Sincronização:
  - Fonte primária: Chatwoot
  - Campos: id, name, email, role, account_id, avatar_url

Mapeamento de Roles Chatwoot → WhatPro:
  administrator → admin
  agent → agent
  (super_admin é configurado manualmente)

Campos Adicionais WhatPro:
  - whatpro_role: enum (super_admin|admin|supervisor|agent)
  - team_id: UUID (opcional)
  - permissions_override: JSON (permissões customizadas)
  - preferences: JSON (preferências do usuário)

Critérios de Aceite:
  - [ ] Usuário novo no Chatwoot é criado automaticamente
  - [ ] Desativação no Chatwoot reflete no WhatPro
  - [ ] Admin pode promover agent a supervisor
  - [ ] Super admin pode promover a admin
```

---

## 5.4 Módulo: Kanban (KAN)

### KAN-001: Estrutura de Boards e Stages

```yaml
ID: KAN-001
Prioridade: P0
Módulo: Kanban
Título: Criação e Gestão de Boards e Stages

Descrição: |
  O sistema deve permitir criar boards (quadros) com stages
  (colunas) customizáveis para organização visual.

Estrutura Hierárquica:
  Account
    └── Board (ex: "Pipeline de Vendas")
        ├── Stage 1 (ex: "Novo Lead")
        ├── Stage 2 (ex: "Em Negociação")
        ├── Stage 3 (ex: "Proposta Enviada")
        └── Stage 4 (ex: "Fechado")

Modelo Board:
  id: UUID
  account_id: UUID
  name: string (max 100 chars)
  description: string (max 500 chars)
  type: enum (leads|support|custom)
  settings: JSON
  is_default: boolean
  created_by: UUID
  created_at: timestamp
  updated_at: timestamp

Modelo Stage:
  id: UUID
  board_id: UUID
  name: string (max 50 chars)
  color: string (hex)
  position: integer (ordenação)
  is_final: boolean (estágio final do funil)
  sla_hours: integer (tempo máximo no estágio)
  auto_actions: JSON (ações automáticas)
  created_at: timestamp
  updated_at: timestamp

Critérios de Aceite:
  - [ ] Board pode ter de 2 a 20 stages
  - [ ] Stages podem ser reordenados via drag-and-drop
  - [ ] Exclusão de stage requer mover cards existentes
  - [ ] Board default é criado automaticamente para novas accounts
```

### KAN-002: Cards de Conversas

```yaml
ID: KAN-002
Prioridade: P0
Módulo: Kanban
Título: Cards Vinculados a Conversas do Chatwoot

Descrição: |
  Cada conversa do Chatwoot pode gerar um card no Kanban,
  permitindo gestão visual do atendimento.

Modelo Card:
  id: UUID
  board_id: UUID
  stage_id: UUID
  conversation_id: integer (ID no Chatwoot)
  contact_id: integer (ID no Chatwoot)
  account_id: UUID

  # Dados desnormalizados (cache do Chatwoot)
  contact_name: string
  contact_phone: string
  contact_email: string
  contact_avatar: string
  last_message_at: timestamp
  last_message_preview: string (max 200 chars)
  inbox_name: string
  assignee_id: integer
  assignee_name: string

  # Dados específicos do WhatPro
  title: string (override do nome do contato)
  value: decimal (valor monetário)
  priority: enum (low|medium|high|urgent)
  due_date: timestamp
  tags: array[string]
  custom_fields: JSON
  notes: string

  # Metadados
  position: integer (ordenação no stage)
  moved_at: timestamp (última movimentação)
  created_at: timestamp
  updated_at: timestamp

Sincronização Chatwoot → Card:
  Trigger: Webhook conversation_created
  Ação: Criar card no primeiro stage do board default
  Dados: contact_name, last_message, assignee

Critérios de Aceite:
  - [ ] Card é criado automaticamente ao criar conversa
  - [ ] Dados do contato são atualizados via webhook
  - [ ] Click no card abre conversa no Chatwoot
  - [ ] Card mostra preview da última mensagem
  - [ ] Cards podem ser movidos entre stages
```

### KAN-003: Drag and Drop

```yaml
ID: KAN-003
Prioridade: P0
Módulo: Kanban
Título: Movimentação de Cards via Drag and Drop

Descrição: |
  Usuários devem poder mover cards entre stages e reordenar
  dentro do mesmo stage usando drag and drop.

Comportamentos:

  Mover entre Stages:
    1. Usuário arrasta card do Stage A para Stage B
    2. Frontend envia PATCH /api/v1/cards/{id}/move
    3. Backend atualiza stage_id e position
    4. Registra histórico de movimentação
    5. Dispara automações configuradas
    6. Atualiza UI via WebSocket

  Reordenar no Stage:
    1. Usuário arrasta card para nova posição
    2. Frontend envia PATCH /api/v1/cards/{id}/reorder
    3. Backend recalcula positions dos afetados
    4. Atualiza UI

Payload Move:
  POST /api/v1/cards/{card_id}/move
  Body:
    target_stage_id: UUID
    position: integer (0-based)

Critérios de Aceite:
  - [ ] Movimento é refletido em < 200ms
  - [ ] Outros usuários veem atualização em tempo real
  - [ ] Histórico registra quem moveu, quando, de onde/para onde
  - [ ] Automações são executadas após movimentação
```

### KAN-004: Filtros e Busca

```yaml
ID: KAN-004
Prioridade: P1
Módulo: Kanban
Título: Filtros e Busca de Cards

Descrição: |
  O sistema deve permitir filtrar e buscar cards por diversos
  critérios.

Filtros Disponíveis:
  - assignee_id: Atribuído a (usuário específico ou "me")
  - stage_id: Estágio específico
  - priority: Prioridade (low|medium|high|urgent)
  - tags: Tags (array, OR entre múltiplas)
  - due_date: Vencimento (overdue|today|this_week|no_date)
  - value_min/value_max: Faixa de valor
  - created_after/created_before: Período de criação
  - search: Busca textual (nome, telefone, notas)

Endpoint:
  GET /api/v1/boards/{board_id}/cards
  Query params: todos os filtros acima

Paginação:
  - Cursor-based (não offset)
  - Default: 50 cards por request
  - Max: 200 cards por request

Critérios de Aceite:
  - [ ] Filtros são combinados com AND
  - [ ] Busca textual usa índice full-text
  - [ ] Filtros persistem na URL (shareable)
  - [ ] Tempo de resposta < 500ms para 10k cards
```

---

## 5.5 Módulo: Automações (AUTO)

### AUTO-001: Triggers de Eventos

```yaml
ID: AUTO-001
Prioridade: P1
Módulo: Automation
Título: Triggers Baseados em Eventos

Descrição: |
  O sistema deve permitir configurar automações que disparam
  baseado em eventos do Chatwoot ou do WhatPro Hub.

Eventos Suportados (Triggers):

  Chatwoot Events:
    - conversation_created: Nova conversa criada
    - conversation_status_changed: Status mudou (open|resolved|pending)
    - message_created: Nova mensagem recebida
    - conversation_assigned: Conversa atribuída
    - contact_created: Novo contato

  WhatPro Events:
    - card_created: Card criado no Kanban
    - card_moved: Card movido de stage
    - card_stage_timeout: Card passou tempo limite no stage
    - card_due_date_approaching: Vencimento se aproximando

Modelo Trigger:
  id: UUID
  automation_id: UUID
  event_type: string
  conditions: JSON (filtros adicionais)

Exemplo de Conditions:
  {
    "and": [
      { "field": "inbox_id", "operator": "equals", "value": 123 },
      { "field": "contact.custom_attributes.vip", "operator": "equals", "value": true }
    ]
  }

Critérios de Aceite:
  - [ ] Automação executa em < 5s após evento
  - [ ] Condições suportam AND/OR/NOT
  - [ ] Logs mostram motivo de execução ou skip
```

### AUTO-002: Actions

```yaml
ID: AUTO-002
Prioridade: P1
Módulo: Automation
Título: Ações de Automação

Descrição: |
  O sistema deve executar ações quando os triggers e condições
  são satisfeitos.

Ações Disponíveis:

  Kanban Actions:
    - move_card:
        target_stage_id: UUID
    - update_card:
        fields: { priority, value, tags, due_date, etc }
    - create_card:
        board_id: UUID
        stage_id: UUID

  Chatwoot Actions (via API):
    - assign_conversation:
        assignee_id: integer
    - add_label:
        label: string
    - send_message:
        message: string (suporta variáveis)
    - update_contact:
        fields: { custom_attributes, etc }

  Notification Actions:
    - send_notification:
        channel: (email|slack|webhook)
        template: string
    - create_task:
        title: string
        assignee_id: UUID
        due_date: timestamp

  Integration Actions:
    - webhook:
        url: string
        method: POST|PUT
        body: JSON (suporta variáveis)
    - n8n_trigger:
        workflow_id: string
        data: JSON

Variáveis Disponíveis:
  {{contact.name}}
  {{contact.phone}}
  {{contact.email}}
  {{conversation.id}}
  {{conversation.inbox.name}}
  {{card.value}}
  {{card.stage.name}}
  {{assignee.name}}
  {{current_date}}
  {{current_time}}

Critérios de Aceite:
  - [ ] Ações executam em sequência definida
  - [ ] Falha em uma ação não para as demais (configurável)
  - [ ] Retry automático 3x com backoff exponencial
  - [ ] Logs detalhados de cada execução
```

---

## 5.6 Módulo: Analytics (ANALYTICS)

### ANALYTICS-001: Dashboard de Métricas

```yaml
ID: ANALYTICS-001
Prioridade: P1
Módulo: Analytics
Título: Dashboard Principal de Métricas

Descrição: |
  O sistema deve fornecer um dashboard com métricas essenciais
  de operação e performance.

Métricas Disponíveis:

  Overview:
    - total_conversations: Total de conversas (período)
    - total_cards: Total de cards ativos
    - conversion_rate: Taxa de conversão (leads → fechados)
    - average_response_time: Tempo médio de primeira resposta
    - average_resolution_time: Tempo médio até resolução

  Por Agente:
    - conversations_handled: Conversas atendidas
    - messages_sent: Mensagens enviadas
    - avg_response_time: Tempo médio de resposta
    - csat_score: Score de satisfação (se disponível)
    - cards_closed: Cards finalizados

  Funil do Kanban:
    - cards_by_stage: Quantidade por estágio
    - avg_time_in_stage: Tempo médio em cada estágio
    - conversion_between_stages: Taxa de passagem entre estágios
    - bottleneck_stages: Estágios com acúmulo

  Temporal:
    - hourly_activity: Atividade por hora do dia
    - daily_trend: Tendência diária
    - weekly_comparison: Comparativo semanal

Filtros:
  - date_range: Período (today, 7d, 30d, custom)
  - inbox_id: Inbox específico
  - team_id: Time específico
  - agent_id: Agente específico

Critérios de Aceite:
  - [ ] Dados atualizados a cada 5 minutos
  - [ ] Gráficos interativos (hover mostra detalhes)
  - [ ] Export em CSV/PDF
  - [ ] Comparativo com período anterior
```

---

# 6. Requisitos Não-Funcionais

## 6.1 Performance

```yaml
NFR-PERF-001:
  Título: Tempo de Resposta da API
  Requisito: |
    95% das requisições devem ser respondidas em menos de 200ms
    99% das requisições devem ser respondidas em menos de 500ms
  Medição: Prometheus histogram no gateway

NFR-PERF-002:
  Título: Throughput
  Requisito: |
    Sistema deve suportar mínimo de 1000 req/s por instância
    Escalabilidade horizontal para aumentar capacidade
  Medição: Load testing com k6

NFR-PERF-003:
  Título: Latência de WebSocket
  Requisito: |
    Atualizações em tempo real devem ser entregues em < 100ms
    Sistema deve suportar 10.000 conexões simultâneas por instância
  Medição: Custom metrics no serviço de WebSocket

NFR-PERF-004:
  Título: Tempo de Carregamento do Frontend
  Requisito: |
    First Contentful Paint (FCP) < 1.5s
    Time to Interactive (TTI) < 3s
    Lighthouse Performance Score > 80
  Medição: Lighthouse CI em cada deploy
```

## 6.2 Disponibilidade

```yaml
NFR-AVAIL-001:
  Título: Uptime
  Requisito: |
    SLA de 99.9% de disponibilidade mensal
    Máximo de 43 minutos de downtime por mês
  Medição: UptimeRobot ou similar

NFR-AVAIL-002:
  Título: Recovery Time Objective (RTO)
  Requisito: |
    Recuperação de falhas em menos de 15 minutos
    Failover automático para réplicas

NFR-AVAIL-003:
  Título: Recovery Point Objective (RPO)
  Requisito: |
    Perda máxima de dados de 5 minutos
    Backups incrementais a cada 5 minutos
    Backup completo diário
```

## 6.3 Segurança

```yaml
NFR-SEC-001:
  Título: Criptografia em Trânsito
  Requisito: |
    Todo tráfego deve usar TLS 1.2+
    HSTS habilitado com max-age de 1 ano

NFR-SEC-002:
  Título: Criptografia em Repouso
  Requisito: |
    Dados sensíveis criptografados com AES-256
    Chaves rotacionadas a cada 90 dias

NFR-SEC-003:
  Título: Autenticação
  Requisito: |
    Tokens JWT com expiração de 24 horas
    Refresh tokens com rotação
    Rate limiting: 100 req/min por IP não autenticado
    Rate limiting: 1000 req/min por usuário autenticado

NFR-SEC-004:
  Título: Headers de Segurança
  Requisito: |
    X-Content-Type-Options: nosniff
    X-Frame-Options: SAMEORIGIN
    X-XSS-Protection: 1; mode=block
    Content-Security-Policy: configurado
    Referrer-Policy: strict-origin-when-cross-origin
```

## 6.4 Escalabilidade

```yaml
NFR-SCALE-001:
  Título: Escalabilidade Horizontal
  Requisito: |
    Sistema deve escalar adicionando instâncias
    Sem estado compartilhado entre instâncias (stateless)
    Load balancing automático via Traefik

NFR-SCALE-002:
  Título: Multi-Tenancy
  Requisito: |
    Isolamento completo entre accounts
    Suporte a 1000+ accounts simultâneas
    Performance consistente independente do número de tenants

NFR-SCALE-003:
  Título: Limites por Tenant
  Requisito: |
    Configurável por plano
    Rate limiting por account
    Quotas de armazenamento
```

## 6.5 Observabilidade

```yaml
NFR-OBS-001:
  Título: Logging
  Requisito: |
    Logs estruturados em JSON
    Correlation ID em todas as requisições
    Níveis: DEBUG, INFO, WARN, ERROR
    Retenção: 30 dias online, 1 ano em cold storage

NFR-OBS-002:
  Título: Métricas
  Requisito: |
    Métricas expostas em formato Prometheus
    RED metrics (Rate, Errors, Duration) para todos os serviços
    USE metrics (Utilization, Saturation, Errors) para recursos

NFR-OBS-003:
  Título: Tracing
  Requisito: |
    Distributed tracing com OpenTelemetry
    Trace ID propagado entre serviços
    Sampling configurável (default 10%)
```

---

# 7. Arquitetura do Sistema

## 7.1 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    INTERNET                                              │
└───────────────────────────────────────┬─────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLOUDFLARE                                               │
│                          (CDN, DDoS Protection, WAF)                                       │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TRAEFIK                                                 │
│                         (Reverse Proxy, Load Balancer, TLS)                               │
│                                                                                           │
│  Routes:                                                                                  │
│  ├── hub.whatpro.com.br      → whatpro-web (frontend)                                    │
│  ├── api.whatpro.com.br      → whatpro-api (backend)                                     │
│  ├── ws.whatpro.com.br       → whatpro-ws (websocket)                                    │
│  └── metrics.whatpro.com.br  → prometheus (internal only)                                │
└───────────────────────────────────────┬───────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│     WHATPRO-WEB         │ │     WHATPRO-API         │ │     WHATPRO-WS          │
│     (Frontend)          │ │     (Backend)           │ │     (WebSocket)         │
│                         │ │                         │ │                         │
│  • Next.js 15           │ │  • Go 1.22 + Fiber     │ │  • Go + Gorilla WS     │
│  • React 19             │ │  • REST API            │ │  • Real-time updates   │
│  • TailwindCSS          │ │  • Webhook receiver    │ │  • Pub/Sub consumer    │
│  • Zustand              │ │  • Background jobs     │ │                         │
│                         │ │                         │ │                         │
│  Replicas: 2            │ │  Replicas: 3           │ │  Replicas: 2           │
└─────────────────────────┘ └───────────┬─────────────┘ └───────────┬─────────────┘
                                        │                           │
                                        └─────────────┬─────────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
                    ▼                                 ▼                                 ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│      POSTGRESQL         │ │        REDIS            │ │        MINIO            │
│      (Primary DB)       │ │   (Cache + Queue)       │ │    (Object Storage)     │
│                         │ │                         │ │                         │
│  • Version: 16          │ │  • Version: 7           │ │  • S3-compatible       │
│  • Extensions:          │ │  • Modes:               │ │  • Buckets:            │
│    - uuid-ossp          │ │    - Cache (TTL)       │ │    - attachments       │
│    - pgcrypto           │ │    - Sessions          │ │    - backups           │
│    - pg_trgm (search)   │ │    - Pub/Sub           │ │    - exports           │
│                         │ │    - Job Queue         │ │                         │
│  • Backup: pgbackrest   │ │  • Persistence: AOF    │ │  • Replication: 2      │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   OBSERVABILITY                                          │
├─────────────────────────┬─────────────────────────┬─────────────────────────────────────┤
│      PROMETHEUS         │        GRAFANA          │           LOKI                      │
│      (Metrics)          │     (Dashboards)        │         (Logs)                      │
│                         │                         │                                     │
│  • Scrape interval: 15s │  • Pre-built dashboards │  • Log aggregation                 │
│  • Retention: 15 days   │  • Alerting             │  • LogQL queries                   │
│  • Alertmanager         │  • SSO integration      │  • Retention: 30 days              │
└─────────────────────────┴─────────────────────────┴─────────────────────────────────────┘
```

## 7.2 Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                WHATPRO-API COMPONENTS                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              HTTP LAYER                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │   Router    │  │  Middleware │  │  Handlers   │  │  Validators │            │   │
│  │  │   (Fiber)   │  │  Stack      │  │  (HTTP)     │  │  (govalidator)          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            SERVICE LAYER                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │    Auth     │  │   Kanban    │  │     Hub     │  │ Automation  │            │   │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │            │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │  Analytics  │  │ Notification│  │   Webhook   │  │    Sync     │            │   │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │            │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          REPOSITORY LAYER                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │    User     │  │    Card     │  │   Account   │  │  Provider   │            │   │
│  │  │    Repo     │  │    Repo     │  │    Repo     │  │    Repo     │            │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                          │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          INFRASTRUCTURE LAYER                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │  Database   │  │    Cache    │  │    Queue    │  │   Storage   │            │   │
│  │  │  (GORM)     │  │  (go-redis) │  │   (Asynq)   │  │  (MinIO SDK)│            │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 7.3 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              READ PATH                                            │  │
│  │                                                                                   │  │
│  │  Client ──▶ Traefik ──▶ API ──▶ Redis Cache ──┬──▶ Return (cache hit)           │  │
│  │                                                │                                  │  │
│  │                                                └──▶ PostgreSQL ──▶ Update Cache  │  │
│  │                                                     ──▶ Return (cache miss)      │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              WRITE PATH                                           │  │
│  │                                                                                   │  │
│  │  Client ──▶ Traefik ──▶ API ──▶ Validate ──▶ PostgreSQL ──▶ Invalidate Cache    │  │
│  │                                      │                            │               │  │
│  │                                      └──▶ Audit Log              │               │  │
│  │                                                                   │               │  │
│  │                                      ┌─────────────────────────────┘               │  │
│  │                                      ▼                                            │  │
│  │                              Redis Pub/Sub ──▶ WebSocket Server ──▶ Clients      │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           WEBHOOK PATH (Chatwoot)                                 │  │
│  │                                                                                   │  │
│  │  Chatwoot ──▶ POST /webhooks/chatwoot ──▶ Verify Signature ──▶ Queue (Redis)    │  │
│  │                                                                    │              │  │
│  │                                      ┌──────────────────────────────┘              │  │
│  │                                      ▼                                            │  │
│  │                              Worker (Asynq) ──▶ Process Event ──▶ Update DB      │  │
│  │                                      │                            │               │  │
│  │                                      └──▶ Trigger Automations    │               │  │
│  │                                                                   │               │  │
│  │                                      ┌─────────────────────────────┘               │  │
│  │                                      ▼                                            │  │
│  │                              Redis Pub/Sub ──▶ WebSocket ──▶ Clients             │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. Modelo de Dados

## 8.1 Diagrama Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐           │
│  │    accounts     │         │     users       │         │     teams       │           │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤           │
│  │ id (PK)         │◄───────┐│ id (PK)         │◄───────┐│ id (PK)         │           │
│  │ chatwoot_id     │        ││ account_id (FK) │────────┘│ account_id (FK) │───────┐   │
│  │ name            │        ││ chatwoot_id     │         │ name            │       │   │
│  │ plan            │        ││ email           │         │ created_at      │       │   │
│  │ settings (JSON) │        ││ name            │         └─────────────────┘       │   │
│  │ created_at      │        ││ role            │                │                  │   │
│  └─────────────────┘        ││ team_id (FK)    │────────────────┘                  │   │
│          │                  ││ preferences     │                                    │   │
│          │                  ││ created_at      │                                    │   │
│          │                  │└─────────────────┘                                    │   │
│          │                  │         │                                             │   │
│          │                  │         │                                             │   │
│          ▼                  │         │                                             │   │
│  ┌─────────────────┐        │         │         ┌─────────────────┐                │   │
│  │   providers     │        │         │         │   audit_logs    │                │   │
│  ├─────────────────┤        │         │         ├─────────────────┤                │   │
│  │ id (PK)         │        │         │         │ id (PK)         │                │   │
│  │ account_id (FK) │────────┘         └────────▶│ user_id (FK)    │                │   │
│  │ name            │                            │ account_id (FK) │◄───────────────┘   │
│  │ type            │                            │ action          │                    │
│  │ config (JSON)   │                            │ resource        │                    │
│  │ status          │                            │ resource_id     │                    │
│  │ created_at      │                            │ old_value       │                    │
│  └─────────────────┘                            │ new_value       │                    │
│                                                 │ ip_address      │                    │
│                                                 │ created_at      │                    │
│                                                 └─────────────────┘                    │
│                                                                                         │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐           │
│  │     boards      │         │     stages      │         │      cards      │           │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤           │
│  │ id (PK)         │◄───────┐│ id (PK)         │◄───────┐│ id (PK)         │           │
│  │ account_id (FK) │────────┘│ board_id (FK)   │────────┘│ stage_id (FK)   │───────┐   │
│  │ name            │        ││ name            │        ││ board_id (FK)   │───────┘   │
│  │ type            │        ││ color           │        ││ conversation_id │           │
│  │ settings (JSON) │        ││ position        │        ││ contact_id      │           │
│  │ is_default      │        ││ sla_hours       │        ││ account_id (FK) │───────────┤
│  │ created_at      │        ││ auto_actions    │        ││ assignee_id (FK)│───────────┤
│  └─────────────────┘        ││ created_at      │        ││ title           │           │
│                             │└─────────────────┘        ││ value           │           │
│                             │                           ││ priority        │           │
│                             │                           ││ due_date        │           │
│                             │                           ││ tags            │           │
│                             │                           ││ custom_fields   │           │
│                             │                           ││ position        │           │
│                             │                           ││ created_at      │           │
│                             │                           │└─────────────────┘           │
│                             │                           │         │                    │
│                             │                           │         │                    │
│                             │                           │         ▼                    │
│  ┌─────────────────┐        │                           │ ┌─────────────────┐          │
│  │   automations   │        │                           │ │  card_history   │          │
│  ├─────────────────┤        │                           │ ├─────────────────┤          │
│  │ id (PK)         │        │                           │ │ id (PK)         │          │
│  │ account_id (FK) │────────┘                           │ │ card_id (FK)    │──────────┘
│  │ name            │                                    │ │ from_stage_id   │
│  │ enabled         │                                    │ │ to_stage_id     │
│  │ trigger_type    │                                    │ │ moved_by (FK)   │
│  │ trigger_config  │                                    │ │ created_at      │
│  │ conditions      │                                    │ └─────────────────┘
│  │ actions         │                                    │
│  │ created_at      │                                    │
│  └─────────────────┘                                    │
│                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Definição de Tabelas

### 8.2.1 Tabela: accounts

```sql
CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatwoot_id     INTEGER UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    plan            VARCHAR(50) NOT NULL DEFAULT 'free',
    billing_email   VARCHAR(255),
    max_agents      INTEGER NOT NULL DEFAULT 5,
    features        JSONB NOT NULL DEFAULT '{}',
    settings        JSONB NOT NULL DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT accounts_plan_check CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    CONSTRAINT accounts_status_check CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_accounts_chatwoot_id ON accounts(chatwoot_id);
CREATE INDEX idx_accounts_status ON accounts(status);
```

### 8.2.2 Tabela: users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    chatwoot_id     INTEGER NOT NULL,
    email           VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(512),
    chatwoot_role   VARCHAR(50) NOT NULL,
    whatpro_role    VARCHAR(50) NOT NULL DEFAULT 'agent',
    team_id         UUID REFERENCES teams(id) ON DELETE SET NULL,
    permissions     JSONB NOT NULL DEFAULT '{}',
    preferences     JSONB NOT NULL DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    last_seen_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT users_whatpro_role_check CHECK (whatpro_role IN ('super_admin', 'admin', 'supervisor', 'agent')),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'deleted')),
    CONSTRAINT users_account_chatwoot_unique UNIQUE (account_id, chatwoot_id)
);

CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team_id ON users(team_id);
```

### 8.2.3 Tabela: boards

```sql
CREATE TABLE boards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    type            VARCHAR(50) NOT NULL DEFAULT 'custom',
    settings        JSONB NOT NULL DEFAULT '{}',
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT boards_type_check CHECK (type IN ('leads', 'support', 'sales', 'custom'))
);

CREATE INDEX idx_boards_account_id ON boards(account_id);
CREATE UNIQUE INDEX idx_boards_default_per_account ON boards(account_id) WHERE is_default = TRUE;
```

### 8.2.4 Tabela: stages

```sql
CREATE TABLE stages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,
    color           VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    position        INTEGER NOT NULL,
    is_final        BOOLEAN NOT NULL DEFAULT FALSE,
    sla_hours       INTEGER,
    auto_actions    JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT stages_position_unique UNIQUE (board_id, position)
);

CREATE INDEX idx_stages_board_id ON stages(board_id);
```

### 8.2.5 Tabela: cards

```sql
CREATE TABLE cards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id            UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    stage_id            UUID NOT NULL REFERENCES stages(id) ON DELETE RESTRICT,
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

    -- Chatwoot References
    conversation_id     INTEGER NOT NULL,
    contact_id          INTEGER NOT NULL,

    -- Denormalized Contact Data (cache)
    contact_name        VARCHAR(255),
    contact_phone       VARCHAR(50),
    contact_email       VARCHAR(255),
    contact_avatar      VARCHAR(512),
    last_message_at     TIMESTAMP WITH TIME ZONE,
    last_message_preview VARCHAR(200),
    inbox_name          VARCHAR(100),

    -- Assignment
    assignee_id         UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Card Specific Data
    title               VARCHAR(255),
    value               DECIMAL(15, 2),
    priority            VARCHAR(20) NOT NULL DEFAULT 'medium',
    due_date            TIMESTAMP WITH TIME ZONE,
    tags                TEXT[] NOT NULL DEFAULT '{}',
    custom_fields       JSONB NOT NULL DEFAULT '{}',
    notes               TEXT,

    -- Positioning
    position            INTEGER NOT NULL DEFAULT 0,
    moved_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Metadata
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT cards_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT cards_account_conversation_unique UNIQUE (account_id, conversation_id)
);

CREATE INDEX idx_cards_board_id ON cards(board_id);
CREATE INDEX idx_cards_stage_id ON cards(stage_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_cards_assignee_id ON cards(assignee_id);
CREATE INDEX idx_cards_conversation_id ON cards(account_id, conversation_id);
CREATE INDEX idx_cards_due_date ON cards(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_cards_tags ON cards USING GIN(tags);
CREATE INDEX idx_cards_search ON cards USING GIN(
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(contact_name, '') || ' ' || coalesce(notes, ''))
);
```

### 8.2.6 Tabela: card_history

```sql
CREATE TABLE card_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id         UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    from_stage_id   UUID REFERENCES stages(id) ON DELETE SET NULL,
    to_stage_id     UUID NOT NULL REFERENCES stages(id) ON DELETE SET NULL,
    moved_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    automation_id   UUID REFERENCES automations(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_history_card_id ON card_history(card_id);
CREATE INDEX idx_card_history_created_at ON card_history(created_at);
```

### 8.2.7 Tabela: providers

```sql
CREATE TABLE providers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name                    VARCHAR(100) NOT NULL,
    type                    VARCHAR(50) NOT NULL,

    -- Encrypted Configuration
    base_url                TEXT NOT NULL,
    api_key_encrypted       BYTEA NOT NULL,

    -- Webhook
    webhook_url             VARCHAR(512) NOT NULL,
    webhook_secret          VARCHAR(255) NOT NULL,

    -- Status
    status                  VARCHAR(20) NOT NULL DEFAULT 'active',
    health_status           VARCHAR(20) NOT NULL DEFAULT 'unknown',
    health_check_interval   INTEGER NOT NULL DEFAULT 60,
    last_health_check       TIMESTAMP WITH TIME ZONE,
    last_error              TEXT,

    -- Metadata
    metadata                JSONB NOT NULL DEFAULT '{}',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT providers_type_check CHECK (type IN ('evolution_api', 'baileys', 'cloud_api', 'twilio')),
    CONSTRAINT providers_status_check CHECK (status IN ('active', 'inactive', 'error')),
    CONSTRAINT providers_health_check CHECK (health_status IN ('healthy', 'unhealthy', 'unknown'))
);

CREATE INDEX idx_providers_account_id ON providers(account_id);
CREATE INDEX idx_providers_status ON providers(status);
```

### 8.2.8 Tabela: automations

```sql
CREATE TABLE automations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,

    -- Trigger
    trigger_type    VARCHAR(50) NOT NULL,
    trigger_config  JSONB NOT NULL DEFAULT '{}',

    -- Conditions (evaluated before actions)
    conditions      JSONB NOT NULL DEFAULT '{"and": []}',

    -- Actions (executed in order)
    actions         JSONB NOT NULL DEFAULT '[]',

    -- Statistics
    execution_count INTEGER NOT NULL DEFAULT 0,
    last_executed   TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automations_account_id ON automations(account_id);
CREATE INDEX idx_automations_trigger_type ON automations(trigger_type);
CREATE INDEX idx_automations_enabled ON automations(enabled);
```

### 8.2.9 Tabela: audit_logs

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    account_id      UUID REFERENCES accounts(id) ON DELETE SET NULL,

    -- Action Details
    action          VARCHAR(50) NOT NULL,
    resource        VARCHAR(100) NOT NULL,
    resource_id     VARCHAR(255),

    -- Request Context
    ip_address      INET,
    user_agent      TEXT,
    request_id      VARCHAR(100),

    -- Changes
    old_value       JSONB,
    new_value       JSONB,

    -- Result
    status          VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message   TEXT,

    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT audit_logs_status_check CHECK (status IN ('success', 'failure'))
) PARTITION BY RANGE (created_at);

-- Partições por mês
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... criar partições conforme necessário

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_account_id ON audit_logs(account_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
```

---

# 9. Especificação de APIs

## 9.1 Convenções Gerais

```yaml
Base URL: https://api.whatpro.com.br/api/v1

Authentication:
  Type: Bearer Token (JWT)
  Header: Authorization: Bearer <token>

Content-Type: application/json

Rate Limiting:
  Unauthenticated: 100 requests/minute
  Authenticated: 1000 requests/minute
  Headers:
    X-RateLimit-Limit: 1000
    X-RateLimit-Remaining: 999
    X-RateLimit-Reset: 1640000000

Pagination:
  Type: Cursor-based
  Parameters:
    limit: integer (default: 50, max: 200)
    cursor: string (opaque cursor for next page)
  Response:
    data: array
    pagination:
      has_more: boolean
      next_cursor: string | null

Error Format:
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human readable message",
      "details": [
        { "field": "email", "message": "Invalid email format" }
      ],
      "request_id": "req_abc123"
    }
  }

Error Codes:
  400: Bad Request (validation error)
  401: Unauthorized (missing/invalid token)
  403: Forbidden (insufficient permissions)
  404: Not Found
  409: Conflict (duplicate, version mismatch)
  422: Unprocessable Entity (business rule violation)
  429: Too Many Requests
  500: Internal Server Error
```

## 9.2 Autenticação

### POST /auth/sso

```yaml
Summary: Autenticar via SSO do Chatwoot
Description: |
  Valida o token do Chatwoot e retorna um JWT do WhatPro Hub.
  Deve ser chamado quando o iframe é carregado.

Request:
  Content-Type: application/json
  Body:
    chatwoot_token:
      type: object
      required: true
      properties:
        access_token:
          type: string
          description: Token de acesso do Chatwoot
        client:
          type: string
          description: Client ID do Chatwoot
        uid:
          type: string
          description: Email do usuário

Response 200:
  {
    "data":
      {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_at": "2026-02-01T10:00:00Z",
        "user":
          {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "name": "John Doe",
            "role": "admin",
            "account_id": "550e8400-e29b-41d4-a716-446655440001",
            "account_name": "Acme Inc",
          },
      },
  }

Response 401:
  {
    "error":
      {
        "code": "INVALID_TOKEN",
        "message": "Chatwoot token is invalid or expired",
      },
  }
```

### POST /auth/refresh

```yaml
Summary: Renovar token JWT
Description: Gera um novo token usando o refresh token

Request:
  Headers:
    Authorization: Bearer <refresh_token>

Response 200:
  {
    "data":
      {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_at": "2026-02-01T10:00:00Z",
      },
  }
```

## 9.3 Boards

### GET /boards

```yaml
Summary: Listar boards da account
Description: Retorna todos os boards acessíveis pelo usuário

Request:
  Headers:
    Authorization: Bearer <token>
  Query Parameters:
    type: string (optional) - Filtrar por tipo (leads|support|sales|custom)

Response 200:
  {
    "data":
      [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Pipeline de Vendas",
          "description": "Gestão de leads e oportunidades",
          "type": "leads",
          "is_default": true,
          "stages_count": 5,
          "cards_count": 42,
          "created_at": "2026-01-15T10:00:00Z",
        },
      ],
  }
```

### POST /boards

```yaml
Summary: Criar novo board
Description: Cria um novo board (requer role admin)

Request:
  Headers:
    Authorization: Bearer <token>
  Body:
    name:
      type: string
      required: true
      maxLength: 100
    description:
      type: string
      maxLength: 500
    type:
      type: string
      enum: [leads, support, sales, custom]
      default: custom
    stages:
      type: array
      required: true
      minItems: 2
      maxItems: 20
      items:
        type: object
        properties:
          name:
            type: string
            required: true
            maxLength: 50
          color:
            type: string
            pattern: "^#[0-9A-Fa-f]{6}$"
          sla_hours:
            type: integer
            minimum: 1

Example Request:
  {
    "name": "Pipeline de Vendas",
    "type": "leads",
    "stages":
      [
        { "name": "Novo Lead", "color": "#3B82F6" },
        { "name": "Em Qualificação", "color": "#F59E0B" },
        { "name": "Proposta Enviada", "color": "#8B5CF6" },
        { "name": "Negociação", "color": "#10B981" },
        { "name": "Fechado", "color": "#059669" },
      ],
  }

Response 201:
  {
    "data":
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Pipeline de Vendas",
        "type": "leads",
        "stages":
          [
            { "id": "...", "name": "Novo Lead", "position": 0 },
            { "id": "...", "name": "Em Qualificação", "position": 1 },
            ...,
          ],
        "created_at": "2026-01-31T10:00:00Z",
      },
  }
```

## 9.4 Cards

### GET /boards//cards

```yaml
Summary: Listar cards de um board
Description: Retorna cards com filtros e paginação

Request:
  Headers:
    Authorization: Bearer <token>
  Path Parameters:
    board_id: UUID
  Query Parameters:
    stage_id: UUID (optional)
    assignee_id: UUID (optional) - Use "me" for current user
    priority: string (optional) - low|medium|high|urgent
    tags: string (optional) - Comma-separated tags
    due_date: string (optional) - overdue|today|this_week|no_date
    search: string (optional) - Full-text search
    limit: integer (default: 50, max: 200)
    cursor: string (optional)

Response 200:
  {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "stage_id": "550e8400-e29b-41d4-a716-446655440001",
        "conversation_id": 12345,
        "contact": {
          "id": 67890,
          "name": "Maria Silva",
          "phone": "+5511999999999",
          "email": "maria@example.com",
          "avatar_url": "https://..."
        },
        "title": null,
        "value": 5000.00,
        "priority": "high",
        "due_date": "2026-02-15T10:00:00Z",
        "tags": ["vip", "urgente"],
        "assignee": {
          "id": "...",
          "name": "João",
          "avatar_url": "..."
        },
        "last_message": {
          "preview": "Olá, gostaria de saber mais...",
          "at": "2026-01-31T09:30:00Z"
        },
        "inbox_name": "WhatsApp Principal",
        "position": 0,
        "moved_at": "2026-01-30T15:00:00Z",
        "created_at": "2026-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "has_more": true,
      "next_cursor": "eyJpZCI6IjU1MGU4NDAwLWUy..."
    }
  }
```

### POST /cards//move

```yaml
Summary: Mover card para outro stage
Description: Move o card e registra no histórico

Request:
  Headers:
    Authorization: Bearer <token>
  Path Parameters:
    card_id: UUID
  Body:
    target_stage_id:
      type: string
      format: uuid
      required: true
    position:
      type: integer
      minimum: 0
      description: Position in target stage (0 = top)
    notes:
      type: string
      maxLength: 500
      description: Optional note about the move

Response 200:
  {
    "data":
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "stage_id": "550e8400-e29b-41d4-a716-446655440002",
        "position": 0,
        "moved_at": "2026-01-31T10:00:00Z",
        "history_entry":
          {
            "id": "...",
            "from_stage": "Novo Lead",
            "to_stage": "Em Qualificação",
            "moved_by": "João Silva",
          },
      },
  }

Response 403:
  {
    "error":
      {
        "code": "FORBIDDEN",
        "message": "You can only move cards assigned to you",
      },
  }
```

## 9.5 Webhooks (Chatwoot)

### POST /webhooks/chatwoot

```yaml
Summary: Receber eventos do Chatwoot
Description: |
  Endpoint que recebe webhooks do Chatwoot.
  Verifica assinatura HMAC antes de processar.

Security:
  - HMAC-SHA256 signature in X-Chatwoot-Signature header

Request:
  Headers:
    X-Chatwoot-Signature: sha256=abc123...
    Content-Type: application/json
  Body:
    event:
      type: string
      enum:
        [
          conversation_created,
          conversation_status_changed,
          message_created,
          conversation_updated,
        ]
    id:
      type: integer
    account:
      type: object
    conversation:
      type: object
    sender:
      type: object

Example - conversation_created:
  {
    "event": "conversation_created",
    "id": 12345,
    "account": { "id": 1, "name": "Acme Inc" },
    "conversation":
      {
        "id": 12345,
        "status": "open",
        "inbox_id": 1,
        "contact_inbox":
          {
            "contact":
              {
                "id": 67890,
                "name": "Maria Silva",
                "phone_number": "+5511999999999",
              },
          },
        "messages":
          [{ "content": "Olá, preciso de ajuda", "created_at": 1706698800 }],
      },
  }

Response 200: { "status": "ok" }

Response 401:
  {
    "error":
      {
        "code": "INVALID_SIGNATURE",
        "message": "Webhook signature verification failed",
      },
  }
```

## 9.6 Providers

### GET /providers

```yaml
Summary: Listar providers
Description: Retorna providers da account (admin) ou todos (super_admin)

Response 200:
  {
    "data":
      [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Evolution Principal",
          "type": "evolution_api",
          "base_url": "https://evolution.example.com",
          "webhook_url": "https://api.whatpro.com.br/webhooks/provider/abc123",
          "status": "active",
          "health_status": "healthy",
          "last_health_check": "2026-01-31T09:55:00Z",
          "created_at": "2026-01-15T10:00:00Z",
        },
      ],
  }
```

### POST /providers

```yaml
Summary: Criar provider
Description: Cadastra novo provider de WhatsApp

Request:
  Body:
    name:
      type: string
      required: true
    type:
      type: string
      enum: [evolution_api, baileys, cloud_api, twilio]
      required: true
    base_url:
      type: string
      format: url
      required: true
    api_key:
      type: string
      required: true
      description: Will be encrypted before storage
    health_check_interval:
      type: integer
      default: 60
      minimum: 30
      maximum: 3600

Response 201:
  {
    "data":
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Evolution Principal",
        "type": "evolution_api",
        "webhook_url": "https://api.whatpro.com.br/webhooks/provider/abc123",
        "status": "active",
        "created_at": "2026-01-31T10:00:00Z",
      },
  }
```

### POST /providers//test

```yaml
Summary: Testar conexão com provider
Description: Executa health check manual

Response 200:
  {
    "data":
      {
        "status": "healthy",
        "latency_ms": 145,
        "details": { "version": "2.0.0", "connected_sessions": 5 },
      },
  }

Response 503:
  {
    "error":
      {
        "code": "PROVIDER_UNAVAILABLE",
        "message": "Failed to connect to provider",
        "details": { "error": "Connection timeout after 5000ms" },
      },
  }
```

---

# 10. Fluxos de Usuário

## 10.1 Fluxo: Primeiro Acesso (Onboarding)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO: PRIMEIRO ACESSO                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐       │
│  │  START  │─────▶│ Chatwoot│─────▶│  Inject │─────▶│  Auth   │─────▶│  Sync   │       │
│  │         │      │  Login  │      │  Script │      │   SSO   │      │  Data   │       │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘      └─────────┘       │
│                                                                           │             │
│                                                                           ▼             │
│                                    ┌─────────┐      ┌─────────┐      ┌─────────┐       │
│                                    │  END    │◀─────│ Welcome │◀─────│ Create  │       │
│                                    │         │      │  Screen │      │ Default │       │
│                                    └─────────┘      └─────────┘      │  Board  │       │
│                                                                      └─────────┘       │
│                                                                                         │
│  DETALHAMENTO:                                                                          │
│                                                                                         │
│  1. Chatwoot Login                                                                      │
│     └── Usuário faz login normal no Chatwoot                                           │
│                                                                                         │
│  2. Inject Script                                                                       │
│     └── Dashboard Script injeta menu "WhatPro Hub" no sidebar                          │
│     └── Apenas se habilitado pelo Super Admin                                          │
│                                                                                         │
│  3. Auth SSO                                                                            │
│     └── Usuário clica no menu WhatPro Hub                                              │
│     └── Iframe é aberto                                                                │
│     └── Token Chatwoot enviado via postMessage                                         │
│     └── API valida e retorna JWT WhatPro                                               │
│                                                                                         │
│  4. Sync Data                                                                           │
│     └── Se primeiro acesso: criar user no WhatPro                                      │
│     └── Se já existe: sincronizar dados atualizados                                    │
│                                                                                         │
│  5. Create Default Board                                                                │
│     └── Se Account não tem board: criar Pipeline Default                               │
│     └── Stages padrão: Novo, Em Atendimento, Aguardando, Resolvido                    │
│                                                                                         │
│  6. Welcome Screen                                                                      │
│     └── Exibir tour guiado (apenas primeiro acesso)                                    │
│     └── Destacar funcionalidades principais                                            │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 10.2 Fluxo: Nova Conversa → Card no Kanban

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                     FLUXO: CONVERSA → CARD AUTOMÁTICO                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              CHATWOOT                                             │  │
│  │  ┌─────────┐      ┌─────────┐      ┌─────────┐                                   │  │
│  │  │ Cliente │─────▶│ Mensagem│─────▶│ Conversa│                                   │  │
│  │  │  envia  │      │ recebida│      │ criada  │                                   │  │
│  │  └─────────┘      └─────────┘      └────┬────┘                                   │  │
│  └───────────────────────────────────────────┼──────────────────────────────────────┘  │
│                                              │                                          │
│                                              │ Webhook: conversation_created            │
│                                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                             WHATPRO HUB                                           │  │
│  │                                                                                   │  │
│  │  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐                  │  │
│  │  │ Receive │─────▶│ Verify  │─────▶│  Queue  │─────▶│ Worker  │                  │  │
│  │  │ Webhook │      │Signature│      │ (Redis) │      │ Process │                  │  │
│  │  └─────────┘      └─────────┘      └─────────┘      └────┬────┘                  │  │
│  │                                                          │                        │  │
│  │       ┌──────────────────────────────────────────────────┘                        │  │
│  │       │                                                                           │  │
│  │       ▼                                                                           │  │
│  │  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐                  │  │
│  │  │  Find   │─────▶│ Create  │─────▶│  Run    │─────▶│ Publish │                  │  │
│  │  │ Default │      │  Card   │      │ Auto-   │      │ to      │                  │  │
│  │  │  Board  │      │  (DB)   │      │ mations │      │ Pub/Sub │                  │  │
│  │  └─────────┘      └─────────┘      └─────────┘      └────┬────┘                  │  │
│  │                                                          │                        │  │
│  │                                                          ▼                        │  │
│  │                                                     ┌─────────┐                   │  │
│  │                                                     │WebSocket│                   │  │
│  │                                                     │ Server  │                   │  │
│  │                                                     └────┬────┘                   │  │
│  └──────────────────────────────────────────────────────────┼───────────────────────┘  │
│                                                              │                          │
│                                                              │ Real-time update         │
│                                                              ▼                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           BROWSER (Agentes)                                       │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                         KANBAN VIEW                                      │    │  │
│  │  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                  │    │  │
│  │  │  │   NOVO LEAD   │ │ EM ATENDIMENTO│ │   AGUARDANDO  │                  │    │  │
│  │  │  ├───────────────┤ ├───────────────┤ ├───────────────┤                  │    │  │
│  │  │  │ ┌───────────┐ │ │               │ │               │                  │    │  │
│  │  │  │ │ ★ NEW!    │ │ │               │ │               │                  │    │  │
│  │  │  │ │Maria Silva│ │ │               │ │               │                  │    │  │
│  │  │  │ │ WhatsApp  │ │ │               │ │               │                  │    │  │
│  │  │  │ └───────────┘ │ │               │ │               │                  │    │  │
│  │  │  └───────────────┘ └───────────────┘ └───────────────┘                  │    │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 10.3 Fluxo: Mover Card (Drag & Drop)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO: DRAG & DROP CARD                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  User Action:                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │  Agente arrasta card de "Novo Lead" para "Em Negociação"                        │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  Sequence:                                                                              │
│                                                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │ Frontend │   │   API    │   │  Service │   │ Database │   │  Pub/Sub │            │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘            │
│       │              │              │              │              │                    │
│       │ onDragEnd    │              │              │              │                    │
│       │─────────────▶│              │              │              │                    │
│       │              │              │              │              │                    │
│       │   POST /cards/{id}/move     │              │              │                    │
│       │   { stage_id, position }    │              │              │                    │
│       │──────────────────────────▶  │              │              │                    │
│       │              │              │              │              │                    │
│       │              │ ValidateMove │              │              │                    │
│       │              │─────────────▶│              │              │                    │
│       │              │              │              │              │                    │
│       │              │   CheckPermission            │              │                    │
│       │              │   (can user move this card?) │              │                    │
│       │              │◀─────────────│              │              │                    │
│       │              │              │              │              │                    │
│       │              │              │ BEGIN TX     │              │                    │
│       │              │              │─────────────▶│              │                    │
│       │              │              │              │              │                    │
│       │              │              │ UPDATE cards │              │                    │
│       │              │              │ SET stage_id │              │                    │
│       │              │              │─────────────▶│              │                    │
│       │              │              │              │              │                    │
│       │              │              │ INSERT card_history          │                    │
│       │              │              │─────────────▶│              │                    │
│       │              │              │              │              │                    │
│       │              │              │ COMMIT TX    │              │                    │
│       │              │              │─────────────▶│              │                    │
│       │              │              │              │              │                    │
│       │              │              │ Publish event│              │                    │
│       │              │              │──────────────────────────▶  │                    │
│       │              │              │              │              │                    │
│       │              │   Return 200 │              │              │                    │
│       │◀─────────────────────────── │              │              │                    │
│       │              │              │              │              │                    │
│       │ Update local state          │              │              │                    │
│       │ (optimistic)│              │              │              │                    │
│       │              │              │              │              │                    │
│                                                                                         │
│  Parallel: WebSocket broadcast to other users                                           │
│                                                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                                           │
│  │  Pub/Sub │   │ WS Server│   │ Other    │                                           │
│  └────┬─────┘   └────┬─────┘   │ Clients  │                                           │
│       │              │         └────┬─────┘                                            │
│       │              │              │                                                   │
│       │ card.moved   │              │                                                   │
│       │─────────────▶│              │                                                   │
│       │              │              │                                                   │
│       │              │ Broadcast    │                                                   │
│       │              │──────────────▶                                                   │
│       │              │              │                                                   │
│       │              │              │ Update UI                                         │
│       │              │              │ (card moves)                                      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 11. Integrações

## 11.1 Integração com Chatwoot

### 11.1.1 Métodos de Integração

```yaml
Dashboard Script:
  Local: super_admin/app_config?config=internal
  Escopo: Global (toda instalação)
  Capacidades:
    - Injetar CSS/JS no DOM
    - Adicionar menus no sidebar
    - Abrir painéis flutuantes (iframe)
    - Ler cookies de sessão
    - Comunicação via postMessage
  Casos de uso:
    - Menu de acesso ao Hub
    - Painel administrativo global

Dashboard Apps:
  Local: Settings → Integrations → Dashboard Apps
  Escopo: Por Account
  Capacidades:
    - Iframe em aba da conversa
    - Recebe contexto via postMessage:
        - conversation_id
        - contact info
        - assignee info
        - messages
  Casos de uso:
    - Kanban contextual
    - CRM do contato

Platform Apps (API):
  Local: super_admin/platform_apps
  Escopo: Global
  Capacidades:
    - CRUD de accounts
    - CRUD de users
    - Gestão de inboxes
    - Sync programático
  Casos de uso:
    - Sincronização de dados
    - Provisionamento automático

Webhooks:
  Local: Settings → Integrations → Webhooks
  Escopo: Por Account
  Eventos:
    - conversation_created
    - conversation_status_changed
    - message_created
    - message_updated
    - webwidget_triggered
  Casos de uso:
    - Criação automática de cards
    - Atualização de dados em tempo real
```

### 11.1.2 Configuração de Webhooks

```yaml
URL: https://api.whatpro.com.br/webhooks/chatwoot
Eventos subscritos:
  - conversation_created: Criar card no Kanban
  - conversation_status_changed: Mover card automaticamente
  - message_created: Atualizar last_message do card
  - conversation_updated: Sincronizar dados

Segurança:
  - HMAC-SHA256 signature verification
  - IP whitelist (opcional)
  - Replay attack prevention (timestamp check)

Processamento:
  - Webhook é enfileirado no Redis
  - Worker processa assincronamente
  - Retry: 3 tentativas com backoff exponencial
  - Dead letter queue após falhas
```

## 11.2 Integração com Providers WhatsApp

### 11.2.1 Evolution API

```yaml
Provider: Evolution API v2
Base URL: https://evolution.example.com
Authentication: API Key (header: apikey)

Endpoints utilizados:
  Health Check:
    GET /instance/connectionState/{instance}
    Response: { state: "open" | "close" | "connecting" }

  Send Message:
    POST /message/sendText/{instance}
    Body: { number, text, options }

  Webhook Events:
    - messages.upsert: Nova mensagem
    - connection.update: Status da conexão

Configuração no WhatPro:
  - base_url: URL do servidor Evolution
  - api_key: Chave de API (encrypted)
  - webhook_url: URL gerada automaticamente
  - instances: Lista de instâncias gerenciadas
```

## 11.3 Integração com N8N

```yaml
Trigger: Webhook node no N8N
URL: Gerado pelo N8N
Autenticação: Header token ou Basic Auth

Casos de uso:
  - Workflows complexos de automação
  - Integração com ERPs/CRMs externos
  - Notificações multicanal
  - Enriquecimento de dados

Payload enviado pelo WhatPro:
  {
    "event": "card.moved",
    "timestamp": "2026-01-31T10:00:00Z",
    "card":
      {
        "id": "...",
        "title": "...",
        "contact": { ... },
        "from_stage": "...",
        "to_stage": "...",
      },
    "account": { ... },
    "user": { ... },
  }
```

---

# 12. Segurança e Compliance

## 12.1 Modelo de Ameaças

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              THREAT MODEL                                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  AMEAÇA                          │ MITIGAÇÃO                                            │
│  ───────────────────────────────────────────────────────────────────────────────────── │
│                                                                                         │
│  T1. Acesso não autorizado       │ M1.1 Autenticação SSO com Chatwoot                  │
│      à API                       │ M1.2 JWT com expiração curta (24h)                  │
│                                  │ M1.3 Rate limiting por IP/usuário                   │
│                                                                                         │
│  T2. Escalação de privilégios    │ M2.1 RBAC granular com verificação em cada request  │
│                                  │ M2.2 Principle of least privilege                   │
│                                  │ M2.3 Audit logging de todas ações                   │
│                                                                                         │
│  T3. Injeção SQL                 │ M3.1 ORM com prepared statements (GORM)            │
│                                  │ M3.2 Input validation em todas as entradas          │
│                                  │ M3.3 Parameterized queries obrigatórias            │
│                                                                                         │
│  T4. XSS (Cross-Site Scripting)  │ M4.1 CSP headers restritivos                       │
│                                  │ M4.2 Sanitização de inputs no frontend             │
│                                  │ M4.3 Escape de outputs                             │
│                                                                                         │
│  T5. CSRF (Cross-Site Request    │ M5.1 SameSite cookies                              │
│      Forgery)                    │ M5.2 CSRF tokens em forms                          │
│                                  │ M5.3 Verificação de Origin header                  │
│                                                                                         │
│  T6. Data breach                 │ M6.1 Encryption at rest (AES-256)                  │
│                                  │ M6.2 Encryption in transit (TLS 1.3)               │
│                                  │ M6.3 Key rotation every 90 days                    │
│                                  │ M6.4 Data minimization                             │
│                                                                                         │
│  T7. DDoS                        │ M7.1 Cloudflare DDoS protection                    │
│                                  │ M7.2 Rate limiting por IP                          │
│                                  │ M7.3 Geographic restrictions                       │
│                                                                                         │
│  T8. Webhook spoofing            │ M8.1 HMAC signature verification                   │
│                                  │ M8.2 Timestamp validation (5 min window)           │
│                                  │ M8.3 IP whitelist opcional                         │
│                                                                                         │
│  T9. Insider threat              │ M9.1 Audit logging completo                        │
│                                  │ M9.2 Separation of duties                          │
│                                  │ M9.3 Access reviews trimestrais                    │
│                                                                                         │
│  T10. Data leakage entre         │ M10.1 Row Level Security no PostgreSQL             │
│       tenants                    │ M10.2 Account ID em todas queries                  │
│                                  │ M10.3 Testes de isolamento automatizados           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 12.2 Compliance SOC 2

```yaml
Trust Services Criteria Addressed:

Security (CC - Common Criteria):
  CC1.1: Definição de responsabilidades de segurança
    - Documentação de políticas
    - Treinamento de equipe

  CC6.1: Controle de acesso lógico
    - RBAC implementado
    - MFA recomendado
    - Session management

  CC6.6: Proteção contra ameaças externas
    - Firewall (Cloudflare WAF)
    - IDS/IPS
    - Vulnerability scanning

Availability (A):
  A1.1: Capacidade e disponibilidade
    - SLA 99.9%
    - Auto-scaling
    - Health checks

  A1.2: Recuperação de desastres
    - Backup diário
    - RPO < 5 min
    - RTO < 15 min
    - Disaster recovery testado trimestralmente

Confidentiality (C):
  C1.1: Classificação de dados
    - PII identificado e marcado
    - Encryption at rest

  C1.2: Controle de acesso a dados confidenciais
    - RBAC
    - Audit logging
    - Data masking em logs

Processing Integrity (PI):
  PI1.1: Precisão e completude
    - Input validation
    - Data type enforcement
    - Reconciliation checks

Privacy (P):
  P1.1: Notificação de privacidade
    - Política de privacidade
    - Termos de uso

  P3.1: Coleta de dados pessoais
    - Data minimization
    - Consent management
    - LGPD compliance
```

## 12.3 LGPD Compliance

```yaml
Requisitos LGPD implementados:

Bases legais para tratamento:
  - Consentimento (para marketing)
  - Execução de contrato (para serviço)
  - Interesse legítimo (para melhorias)

Direitos do titular:
  - Confirmação de tratamento: GET /api/v1/privacy/data
  - Acesso aos dados: GET /api/v1/privacy/export
  - Correção: PATCH /api/v1/users/me
  - Eliminação: DELETE /api/v1/privacy/data (com verificação)
  - Portabilidade: GET /api/v1/privacy/export?format=json

Medidas técnicas:
  - Encryption at rest e in transit
  - Access controls
  - Audit logging
  - Data retention policies
  - Breach notification procedures

Data Retention:
  - Dados de conversas: 2 anos ou até solicitação de exclusão
  - Audit logs: 5 anos (requisito legal)
  - Backups: 30 dias
```

---

# 13. Observabilidade

## 13.1 Métricas (Prometheus)

```yaml
Application Metrics:

  # HTTP Metrics
  http_requests_total{method, path, status}
  http_request_duration_seconds{method, path}
  http_request_size_bytes{method, path}
  http_response_size_bytes{method, path}

  # Business Metrics
  whatpro_cards_total{account_id, board_id, stage_id}
  whatpro_cards_moved_total{account_id, from_stage, to_stage}
  whatpro_webhooks_received_total{event_type, status}
  whatpro_webhooks_processing_duration_seconds{event_type}

  # Auth Metrics
  whatpro_auth_attempts_total{status}
  whatpro_active_sessions{account_id}

  # Provider Metrics
  whatpro_provider_health_status{provider_id, status}
  whatpro_provider_requests_total{provider_id, status}

Infrastructure Metrics:

  # Database
  pg_stat_activity_count
  pg_replication_lag_seconds
  pg_database_size_bytes

  # Redis
  redis_connected_clients
  redis_used_memory_bytes
  redis_commands_processed_total

  # Go Runtime
  go_goroutines
  go_gc_duration_seconds
  go_memstats_alloc_bytes
```

## 13.2 Logging (Loki)

```yaml
Log Format:
  {
    "timestamp": "2026-01-31T10:00:00.000Z",
    "level": "info",
    "message": "Request completed",
    "request_id": "req_abc123",
    "trace_id": "trace_xyz789",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "account_id": "550e8400-e29b-41d4-a716-446655440001",
    "method": "POST",
    "path": "/api/v1/cards/123/move",
    "status": 200,
    "duration_ms": 45,
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
  }

Log Levels:
  DEBUG: Detailed debugging (dev only)
  INFO: Normal operations
  WARN: Unexpected but handled situations
  ERROR: Errors requiring attention

Sensitive Data Handling:
  - PII masked in logs
  - API keys never logged
  - Request bodies logged only at DEBUG level
```

## 13.3 Alerting

```yaml
Critical Alerts (PagerDuty):
  - Service down (health check failing > 2 min)
  - Error rate > 5% (5 min window)
  - Latency P99 > 2s (5 min window)
  - Database connection failures
  - Disk usage > 90%

Warning Alerts (Slack):
  - Error rate > 1% (15 min window)
  - Latency P95 > 500ms (15 min window)
  - Memory usage > 80%
  - Provider health check failing
  - Unusual traffic patterns

Info Alerts (Email daily digest):
  - New accounts created
  - Error summary
  - Performance trends
```

---

# 14. Deployment e Infraestrutura

## 14.1 Estrutura Docker

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.swarmMode=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
    deploy:
      placement:
        constraints:
          - node.role == manager

  whatpro-api:
    image: whatpro/hub-api:${VERSION}
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
      - CHATWOOT_URL=${CHATWOOT_URL}
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      replicas: 3
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.api.rule=Host(`api.whatpro.com.br`)"
        - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:3000/health/ready"]
        interval: 30s
        timeout: 10s
        retries: 3

  whatpro-web:
    image: whatpro/hub-web:${VERSION}
    deploy:
      replicas: 2
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.web.rule=Host(`hub.whatpro.com.br`)"

  whatpro-ws:
    image: whatpro/hub-ws:${VERSION}
    deploy:
      replicas: 2
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.ws.rule=Host(`ws.whatpro.com.br`)"

  whatpro-worker:
    image: whatpro/hub-worker:${VERSION}
    deploy:
      replicas: 2

  postgresql:
    image: postgres:16-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    deploy:
      placement:
        constraints:
          - node.labels.db == true

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana

  loki:
    image: grafana/loki:latest
    volumes:
      - loki-data:/loki

volumes:
  traefik-certs:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:
  loki-data:
```

## 14.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Run tests
        run: |
          cd apps/api
          go test -v -race -coverprofile=coverage.out ./...

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./apps/api/coverage.out

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          working-directory: apps/api

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."

  build:
    needs: [test, lint, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        run: |
          docker build -t whatpro/hub-api:${{ github.sha }} apps/api
          docker push whatpro/hub-api:${{ github.sha }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          # Deploy via SSH to Docker Swarm
          ssh deploy@staging.whatpro.com.br \
            "docker service update --image whatpro/hub-api:${{ github.sha }} whatpro_api"

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Blue-green deployment
          ssh deploy@prod.whatpro.com.br \
            "docker service update --image whatpro/hub-api:${{ github.sha }} whatpro_api"
```

---

# 15. Roadmap

## 15.1 Fases de Desenvolvimento

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ROADMAP - WHATPRO HUB                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  FASE 1: FUNDAÇÃO (Semanas 1-4)                                              MVP        │
│  ════════════════════════════════                                                       │
│  ☐ Setup do projeto (Go + Next.js)                                                     │
│  ☐ Autenticação SSO com Chatwoot                                                       │
│  ☐ RBAC básico (4 roles)                                                               │
│  ☐ Health checks e observabilidade básica                                              │
│  ☐ Docker Compose para dev e prod                                                      │
│  ☐ CI/CD básico                                                                        │
│                                                                                         │
│  FASE 2: HUB CORE (Semanas 5-8)                                                        │
│  ════════════════════════════════                                                       │
│  ☐ Sincronização de Accounts/Users do Chatwoot                                         │
│  ☐ CRUD de Providers                                                                   │
│  ☐ Health check de providers                                                           │
│  ☐ Webhook receiver do Chatwoot                                                        │
│  ☐ Painel Admin básico                                                                 │
│                                                                                         │
│  FASE 3: KANBAN (Semanas 9-14)                                                         │
│  ════════════════════════════════                                                       │
│  ☐ CRUD de Boards e Stages                                                             │
│  ☐ Cards vinculados a conversas                                                        │
│  ☐ Drag & drop com atualização real-time                                              │
│  ☐ Filtros e busca                                                                     │
│  ☐ Histórico de movimentações                                                          │
│  ☐ Dashboard Script para menu no Chatwoot                                              │
│                                                                                         │
│  FASE 4: AUTOMAÇÕES (Semanas 15-18)                                         Beta       │
│  ════════════════════════════════                                                       │
│  ☐ Engine de triggers e condições                                                      │
│  ☐ Actions básicas (mover card, atribuir, notificar)                                  │
│  ☐ Integração com N8N                                                                  │
│  ☐ UI para configuração de automações                                                  │
│                                                                                         │
│  FASE 5: ANALYTICS (Semanas 19-22)                                                     │
│  ════════════════════════════════                                                       │
│  ☐ Dashboard de métricas                                                               │
│  ☐ Relatórios de performance                                                           │
│  ☐ Funil do Kanban                                                                     │
│  ☐ Export de dados                                                                     │
│                                                                                         │
│  FASE 6: ENTERPRISE (Semanas 23-30)                                         GA         │
│  ════════════════════════════════                                                       │
│  ☐ Audit logging completo                                                              │
│  ☐ Preparação SOC 2                                                                    │
│  ☐ Multi-tenancy avançado                                                              │
│  ☐ White-label                                                                         │
│  ☐ API pública documentada                                                             │
│  ☐ SDKs (JavaScript, Python)                                                           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 15.2 Milestones

```yaml
M1 - MVP (Semana 4):
  Critérios de aceite:
    - Usuário consegue fazer login via Chatwoot
    - Sistema reconhece role do usuário
    - Health checks funcionando
    - Deploy automatizado em staging

M2 - Alpha (Semana 14):
  Critérios de aceite:
    - Kanban funcional com drag & drop
    - Cards criados automaticamente de conversas
    - Real-time updates via WebSocket
    - 3 clientes piloto usando

M3 - Beta (Semana 22):
  Critérios de aceite:
    - Automações configuráveis
    - Analytics básico
    - Documentação completa
    - 10 clientes em produção

M4 - GA (Semana 30):
  Critérios de aceite:
    - SOC 2 Type I completo
    - SLA 99.9% por 30 dias
    - NPS > 40
    - 50+ clientes ativos
```

---

# 16. Glossário

| Termo                | Definição                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Account**          | Entidade que representa uma empresa/cliente no sistema. Sincronizada do Chatwoot.              |
| **Board**            | Quadro Kanban contendo stages e cards. Uma account pode ter múltiplos boards.                  |
| **Card**             | Representação visual de uma conversa/lead no Kanban. Vinculado a uma conversation do Chatwoot. |
| **Chatwoot**         | Plataforma open-source de atendimento ao cliente que serve como base para o WhatPro Hub.       |
| **Dashboard App**    | Mecanismo do Chatwoot para integrar aplicações externas via iframe no painel do agente.        |
| **Dashboard Script** | Código JavaScript injetado globalmente no Chatwoot para customizações.                         |
| **HMAC**             | Hash-based Message Authentication Code. Usado para verificar autenticidade de webhooks.        |
| **JWT**              | JSON Web Token. Padrão para tokens de autenticação.                                            |
| **Provider**         | Serviço externo de WhatsApp (Evolution API, etc) gerenciado pelo WhatPro Hub.                  |
| **RBAC**             | Role-Based Access Control. Modelo de controle de acesso baseado em papéis.                     |
| **Stage**            | Coluna dentro de um board Kanban. Representa uma etapa do processo.                            |
| **SSO**              | Single Sign-On. Autenticação única que permite acesso a múltiplos sistemas.                    |
| **Tenant**           | Instância isolada de dados de uma account. Multi-tenancy significa múltiplos tenants.          |
| **Webhook**          | Callback HTTP disparado quando um evento ocorre. Usado para integração em tempo real.          |

---

# 17. Apêndices

## Apêndice A: Exemplos de Código

### A.1 Estrutura de Diretórios do Backend

```
apps/api/
├── cmd/
│   └── server/
│       └── main.go                 # Entry point
├── internal/
│   ├── config/
│   │   └── config.go               # Configuration loading
│   ├── handlers/
│   │   ├── auth.go                 # Auth endpoints
│   │   ├── boards.go               # Board CRUD
│   │   ├── cards.go                # Card operations
│   │   ├── health.go               # Health checks
│   │   ├── providers.go            # Provider management
│   │   └── webhooks.go             # Webhook receivers
│   ├── middleware/
│   │   ├── auth.go                 # JWT validation
│   │   ├── cors.go                 # CORS configuration
│   │   ├── logging.go              # Request logging
│   │   ├── ratelimit.go            # Rate limiting
│   │   └── rbac.go                 # Permission checks
│   ├── models/
│   │   ├── account.go
│   │   ├── board.go
│   │   ├── card.go
│   │   ├── provider.go
│   │   ├── stage.go
│   │   └── user.go
│   ├── repositories/
│   │   ├── account_repo.go
│   │   ├── board_repo.go
│   │   ├── card_repo.go
│   │   └── user_repo.go
│   ├── services/
│   │   ├── auth_service.go
│   │   ├── chatwoot_service.go
│   │   ├── kanban_service.go
│   │   └── sync_service.go
│   └── utils/
│       ├── crypto.go               # Encryption utilities
│       ├── errors.go               # Error handling
│       └── validators.go           # Input validation
├── pkg/
│   └── chatwoot/
│       ├── client.go               # Chatwoot API client
│       └── types.go                # Chatwoot types
├── migrations/
│   ├── 001_initial.up.sql
│   └── 001_initial.down.sql
├── Dockerfile
├── go.mod
└── go.sum
```

### A.2 Exemplo: Handler de Autenticação

```go
// internal/handlers/auth.go
package handlers

import (
    "github.com/gofiber/fiber/v2"
    "whatpro-hub/internal/services"
    "whatpro-hub/internal/models"
)

type AuthHandler struct {
    authService     *services.AuthService
    chatwootService *services.ChatwootService
}

type SSORequest struct {
    AccessToken string `json:"access_token" validate:"required"`
    Client      string `json:"client" validate:"required"`
    UID         string `json:"uid" validate:"required,email"`
}

type SSOResponse struct {
    Token     string       `json:"token"`
    ExpiresAt string       `json:"expires_at"`
    User      *models.User `json:"user"`
}

// POST /auth/sso
func (h *AuthHandler) SSO(c *fiber.Ctx) error {
    var req SSORequest
    if err := c.BodyParser(&req); err != nil {
        return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
    }

    // Validate against Chatwoot
    cwUser, err := h.chatwootService.ValidateToken(c.Context(),
        req.AccessToken, req.Client, req.UID)
    if err != nil {
        return fiber.NewError(fiber.StatusUnauthorized, "Invalid Chatwoot token")
    }

    // Create or update local user
    user, err := h.authService.SyncUser(c.Context(), cwUser)
    if err != nil {
        return fiber.NewError(fiber.StatusInternalServerError, "Failed to sync user")
    }

    // Generate JWT
    token, expiresAt, err := h.authService.GenerateJWT(user)
    if err != nil {
        return fiber.NewError(fiber.StatusInternalServerError, "Failed to generate token")
    }

    return c.JSON(fiber.Map{
        "data": SSOResponse{
            Token:     token,
            ExpiresAt: expiresAt.Format(time.RFC3339),
            User:      user,
        },
    })
}
```

### A.3 Exemplo: Middleware RBAC

```go
// internal/middleware/rbac.go
package middleware

import (
    "github.com/gofiber/fiber/v2"
    "whatpro-hub/internal/models"
)

type Permission struct {
    Resource string
    Action   string
    Scope    string // own, team, account, global
}

var RolePermissions = map[string][]Permission{
    "super_admin": {
        {Resource: "*", Action: "*", Scope: "global"},
    },
    "admin": {
        {Resource: "boards", Action: "*", Scope: "account"},
        {Resource: "cards", Action: "*", Scope: "account"},
        {Resource: "users", Action: "*", Scope: "account"},
        {Resource: "providers", Action: "*", Scope: "account"},
    },
    "supervisor": {
        {Resource: "boards", Action: "read", Scope: "account"},
        {Resource: "cards", Action: "*", Scope: "team"},
        {Resource: "users", Action: "read", Scope: "team"},
    },
    "agent": {
        {Resource: "boards", Action: "read", Scope: "account"},
        {Resource: "cards", Action: "read", Scope: "own"},
        {Resource: "cards", Action: "update", Scope: "own"},
    },
}

func RequirePermission(resource, action string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        user := c.Locals("user").(*models.User)

        permissions := RolePermissions[user.WhatproRole]

        for _, p := range permissions {
            if matchesPermission(p, resource, action) {
                // Store scope for repository queries
                c.Locals("permission_scope", p.Scope)
                return c.Next()
            }
        }

        return fiber.NewError(fiber.StatusForbidden,
            "Insufficient permissions for this action")
    }
}

func matchesPermission(p Permission, resource, action string) bool {
    resourceMatch := p.Resource == "*" || p.Resource == resource
    actionMatch := p.Action == "*" || p.Action == action
    return resourceMatch && actionMatch
}
```

## Apêndice B: Diagramas de Sequência Adicionais

### B.1 Sequência: Webhook Processing

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Chatwoot │ │  API    │ │  Redis  │ │ Worker  │ │   DB    │ │Websocket│
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │           │           │
     │ POST /webhooks        │           │           │           │
     │──────────▶│           │           │           │           │
     │           │           │           │           │           │
     │           │ Verify    │           │           │           │
     │           │ signature │           │           │           │
     │           │           │           │           │           │
     │           │ LPUSH queue           │           │           │
     │           │──────────▶│           │           │           │
     │           │           │           │           │           │
     │ 200 OK    │           │           │           │           │
     │◀──────────│           │           │           │           │
     │           │           │           │           │           │
     │           │           │ BRPOP     │           │           │
     │           │           │◀──────────│           │           │
     │           │           │           │           │           │
     │           │           │ Job data  │           │           │
     │           │           │──────────▶│           │           │
     │           │           │           │           │           │
     │           │           │           │ Process   │           │
     │           │           │           │──────────▶│           │
     │           │           │           │           │           │
     │           │           │           │ PUBLISH   │           │
     │           │           │◀──────────│           │           │
     │           │           │           │           │           │
     │           │           │ Subscribe │           │           │
     │           │           │──────────────────────────────────▶│
     │           │           │           │           │           │
     │           │           │           │           │ Broadcast │
     │           │           │           │           │ to clients│
```

---

# Documento de Especificação Técnica

**Este documento é uma especificação viva e deve ser atualizado conforme o desenvolvimento evolui.**

**Versão:** 1.0.0
**Última atualização:** 2026-01-31
**Status:** Aprovado para desenvolvimento

---

_Fim do documento PRD - WhatPro Hub_
