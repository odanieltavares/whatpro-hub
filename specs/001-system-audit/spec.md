# Feature Specification: WhatPro Hub — Auditoria e Roadmap de Completude

**Feature Branch**: `001-system-audit`
**Created**: 2026-02-19
**Status**: Draft
**Input**: Auditoria completa do sistema, identificação de pendências e erros no backend e frontend, criação de roadmap de implementação usando agents e skills

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dashboard com dados reais (Priority: P1)

Um administrador acessa o dashboard e vê métricas reais do sistema:
instâncias ativas, mensagens enviadas, clientes ativos e workflows disparados,
todos vindos do banco de dados — sem nenhum valor fixo ou fictício.

**Why this priority**: O dashboard é a tela inicial do produto. Exibir dados
fictícios (hardcoded) engana os usuários e bloqueia decisões de negócio.

**Independent Test**: Abrir o dashboard com dados reais no banco → todos os
4 cartões de métricas exibem valores que mudam conforme o uso do sistema.

**Acceptance Scenarios**:

1. **Dado** que existem instâncias, mensagens e contatos no banco, **quando** o
   administrador acessa o dashboard, **então** os cartões exibem os valores reais
   de: instâncias ativas, mensagens enviadas no dia, clientes ativos e workflows
   disparados.
2. **Dado** que o banco está vazio, **quando** o administrador acessa o dashboard,
   **então** todos os cartões exibem 0 (zero), não valores fictícios.
3. **Dado** que o backend retorna erro no endpoint de estatísticas, **quando**
   o dashboard carrega, **então** os cartões exibem uma mensagem de erro amigável,
   não um crash da página.

---

### User Story 2 — Autenticação completa com renovação de token (Priority: P1)

Um usuário autenticado continua usando o sistema por horas sem ser desconectado
abruptamente. O token é renovado automaticamente antes de expirar. O account_id
do usuário é sempre lido a partir da sessão autenticada, nunca de um valor fixo.

**Why this priority**: Atualmente o token não é renovado e o account_id está
fixado em `1`, causando falhas de autenticação e dados incorretos para todos os
usuários que não sejam da conta 1.

**Independent Test**: Fazer login → aguardar o token estar próximo de expirar →
verificar que o sistema renova automaticamente e o usuário permanece conectado.

**Acceptance Scenarios**:

1. **Dado** que o usuário está logado, **quando** o token está a menos de 5
   minutos de expirar, **então** o sistema o renova automaticamente sem
   intervenção do usuário.
2. **Dado** que o token expirou e não pôde ser renovado, **quando** o usuário
   faz qualquer requisição, **então** é redirecionado para a tela de login com
   mensagem clara.
3. **Dado** que um usuário pertence à conta 5, **quando** ele acessa as instâncias,
   **então** vê apenas as instâncias da conta 5, nunca da conta 1.

---

### User Story 3 — Página de Configurações funcional (Priority: P2)

Um administrador consegue visualizar e atualizar seus dados de perfil (nome, email,
avatar) e preferências de notificação através da página de Configurações.

**Why this priority**: A página atual exibe "John Doe" e "john@example.com"
com campos desabilitados — é inutilizável em produção.

**Independent Test**: Alterar o nome de exibição nas configurações → o novo nome
aparece na barra lateral e no avatar sem precisar recarregar.

**Acceptance Scenarios**:

1. **Dado** que o usuário está na página de Configurações, **quando** a página
   carrega, **então** os campos exibem os dados reais do usuário logado.
2. **Dado** que o usuário altera o nome e salva, **quando** a operação conclui,
   **então** o novo nome é persistido e refletido em toda a interface.
3. **Dado** que o usuário acessa a aba de Notificações, **quando** a página carrega,
   **então** vê opções reais de configuração (não uma mensagem "Coming Soon").

---

### User Story 4 — Processamento de webhooks funcionando (Priority: P2)

Quando o Chatwoot notifica o sistema sobre uma nova conversa, o sistema cria
automaticamente um card no Kanban correspondente. Quando a conversa é resolvida,
o card é movido para a coluna de "Concluído".

**Why this priority**: Toda a proposta de valor do produto (Kanban automático
a partir do WhatsApp) depende dessa integração funcionar. Hoje é um TODO no código.

**Independent Test**: Enviar um webhook simulado de `conversation_created` para
o endpoint → verificar que um card foi criado no board correto.

**Acceptance Scenarios**:

1. **Dado** que um webhook `conversation_created` chega, **quando** o sistema
   processa o evento, **então** um card é criado no Kanban com o nome do contato
   e link para a conversa no Chatwoot.
2. **Dado** que um webhook `conversation_resolved` chega, **quando** o sistema
   processa o evento, **então** o card correspondente é movido para a coluna final.
3. **Dado** que o webhook chega mas o board correspondente não existe, **quando**
   o sistema tenta criar o card, **então** o evento é registrado em log e não
   gera um erro 500.

---

### User Story 5 — Integração de pagamentos Asaas ativa (Priority: P2)

Um administrador consegue assinar um plano pago através da interface de billing.
O sistema cria o cliente e a assinatura na Asaas, e os pagamentos futuros são
processados automaticamente.

**Why this priority**: A monetização do produto está completamente bloqueada.
Todos os métodos de pagamento retornam dados fictícios (stubs).

**Independent Test**: Assinar o plano básico → verificar que um cliente e uma
assinatura real foram criados no painel da Asaas.

**Acceptance Scenarios**:

1. **Dado** que um usuário preenche os dados de pagamento, **quando** confirma
   a assinatura, **então** o sistema cria o cliente e a assinatura na Asaas e
   retorna o link de pagamento.
2. **Dado** que a Asaas processa um pagamento, **quando** o webhook de confirmação
   chega, **então** o status da assinatura é atualizado para "ativo" e o plano é liberado.
3. **Dado** que o pagamento falha, **quando** o webhook de falha chega, **então**
   o sistema notifica o administrador e atualiza o status para "inadimplente".

---

### User Story 6 — Cobertura de testes mínima de 70% (Priority: P3)

A equipe de desenvolvimento consegue validar que nenhuma funcionalidade crítica
foi quebrada antes de cada deploy, através de uma suíte de testes automatizados
que cobre os principais fluxos do backend e frontend.

**Why this priority**: Com apenas 9% de cobertura atual, qualquer mudança pode
quebrar funcionalidades silenciosamente. Necessário antes de escalar o produto.

**Independent Test**: Rodar a suíte de testes → 70% ou mais dos arquivos críticos
(handlers, services, hooks, componentes) têm pelo menos um teste passando.

**Acceptance Scenarios**:

1. **Dado** que um handler de API é chamado com dados inválidos, **quando** o
   teste unitário roda, **então** valida que o handler retorna o código e mensagem
   de erro corretos.
2. **Dado** que um componente React recebe dados do hook, **quando** o teste de
   componente roda, **então** valida que os dados são exibidos corretamente.
3. **Dado** que o CI/CD executa a suíte, **quando** um teste falha, **então**
   o deploy é bloqueado automaticamente.

---

### User Story 7 — Workflows com persistência e execução (Priority: P3)

Um administrador cria um fluxo de automação visual (ex.: "receber mensagem →
classificar → responder automaticamente") e esse fluxo é salvo, listado e
executado quando as condições são atingidas.

**Why this priority**: A feature existe no menu mas é apenas um protótipo visual
sem persistência ou execução real.

**Independent Test**: Criar um workflow com 3 nós → salvar → recarregar a página
→ o workflow ainda está lá e pode ser ativado.

**Acceptance Scenarios**:

1. **Dado** que um usuário cria e salva um workflow, **quando** recarrega a página,
   **então** o workflow é carregado com todos os nós e conexões intactos.
2. **Dado** que um workflow está ativo e sua condição é satisfeita (ex.: mensagem
   recebida), **quando** o evento ocorre, **então** o workflow é executado e o
   resultado é registrado.
3. **Dado** que um workflow falha na execução, **quando** o erro ocorre, **então**
   é registrado no histórico de execuções com detalhes do erro.

---

### User Story 8 — Internacionalização completa (Priority: P3)

Um usuário que usa o sistema em inglês ou português-brasileiro vê todos os textos
da interface no idioma correto — menus, mensagens de erro, títulos de páginas,
labels de formulários, e notificações.

**Why this priority**: Hoje apenas a feature de instâncias tem tradução completa.
6 das 7 features têm textos hardcoded em inglês.

**Independent Test**: Mudar o idioma para EN-US → verificar que 100% dos textos
visíveis na tela foram traduzidos.

**Acceptance Scenarios**:

1. **Dado** que o sistema está em PT-BR, **quando** o usuário navega por qualquer
   página, **então** todos os textos visíveis estão em português.
2. **Dado** que o sistema está em EN-US, **quando** o usuário navega por qualquer
   página, **então** todos os textos visíveis estão em inglês.
3. **Dado** que uma chave de tradução está faltando, **quando** a página carrega,
   **então** exibe a chave em PT-BR como fallback (não uma string vazia ou código).

---

### Edge Cases

- O que acontece se o banco de dados não tiver nenhuma conta ao carregar o dashboard?
- O que acontece se a Asaas estiver fora do ar durante a criação de assinatura?
- O que acontece se um webhook chegar duplicado para o mesmo evento?
- O que acontece se o token de refresh também expirou?
- O que acontece se um workflow referencia um provider que foi deletado?

---

## Requirements *(mandatory)*

### Functional Requirements

**Backend:**
- **FR-001**: O sistema DEVE expor um endpoint `/api/v1/accounts/:id/stats` que retorna: contagem de instâncias ativas, mensagens enviadas no dia, clientes ativos e workflows disparados — todas vindas do banco de dados.
- **FR-002**: O sistema DEVE processar webhooks do Chatwoot e criar/mover cards no Kanban para os eventos: `conversation_created`, `conversation_resolved`, `conversation_updated` e `message_created`.
- **FR-003**: O sistema DEVE integrar com a API da Asaas para criar clientes, criar assinaturas e processar webhooks de pagamento (confirmação, falha, cancelamento).
- **FR-004**: O sistema DEVE sincronizar usuários com o Chatwoot ao criar, atualizar ou deletar um usuário na plataforma.
- **FR-005**: O sistema DEVE ter no mínimo 70% de cobertura de testes nos handlers e services críticos (auth, accounts, providers, billing, webhooks).
- **FR-006**: A configuração DEVE incluir `ASAAS_API_KEY` como variável de ambiente obrigatória quando o módulo de billing estiver ativo.
- **FR-007**: O `GatewayService` DEVE receber a dependência de `ProviderRepository` corretamente (atualmente `nil`).

**Frontend:**
- **FR-008**: O `account_id` DEVE ser lido sempre do contexto de autenticação do usuário logado, nunca de um valor fixo.
- **FR-009**: O token de acesso DEVE ser renovado automaticamente usando o refresh token antes de expirar.
- **FR-010**: A página de Configurações DEVE exibir e permitir editar os dados reais do usuário logado (nome, email, preferências de notificação).
- **FR-011**: O dashboard DEVE exibir apenas dados reais vindos da API — sem nenhum valor fictício ou hardcoded.
- **FR-012**: A feature de Workflows DEVE persistir os fluxos criados e executá-los quando ativados.
- **FR-013**: A internacionalização DEVE cobrir 100% dos textos visíveis em todas as páginas (PT-BR e EN-US).
- **FR-014**: O sistema DEVE ter uma suíte de testes frontend configurada (Vitest + React Testing Library) com cobertura dos componentes e hooks críticos.

**Infraestrutura:**
- **FR-015**: O `docker-compose.yml` DEVE ser migrado para a estrutura modular recomendada (`compose.base.yml` + `compose.chatwoot.yml`).
- **FR-016**: A variável `CORS_ORIGINS` DEVE ter um valor padrão específico (não wildcard) no ambiente de produção.

### Key Entities

- **AccountStats**: Agregação de métricas por conta — instâncias ativas, mensagens do dia, clientes ativos, workflows disparados.
- **WorkflowDefinition**: Grafo de automação persistido — nós, conexões, condições, ações, status (ativo/inativo).
- **WorkflowExecution**: Registro de cada execução de um workflow — timestamp, resultado, erro (se houver).
- **AsaasCustomer**: Representação do cliente na Asaas — ID externo, conta vinculada.
- **AsaasSubscription**: Assinatura ativa na Asaas — plano, status, datas do ciclo.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos cartões do dashboard exibem dados reais — zero valores fictícios após a implementação.
- **SC-002**: Usuários permanecem autenticados por sessões de até 8 horas sem desconexão involuntária.
- **SC-003**: 100% das contas acessam apenas seus próprios dados — account_id vem sempre da sessão autenticada.
- **SC-004**: Webhooks do Chatwoot são processados em menos de 2 segundos para os eventos `conversation_created` e `conversation_resolved`.
- **SC-005**: O fluxo de assinatura (do clique em "Assinar" à confirmação de pagamento) conclui com sucesso em 100% dos casos com dados válidos.
- **SC-006**: A suíte de testes automatizados atinge 70% de cobertura nos arquivos críticos de backend e frontend.
- **SC-007**: 100% dos textos visíveis na interface estão traduzidos em PT-BR e EN-US.
- **SC-008**: Um workflow criado persiste após recarregar a página e é executado quando sua condição é satisfeita.

---

## Assumptions

- O ambiente de desenvolvimento tem acesso à API sandbox da Asaas para testes de billing.
- O Chatwoot v4.10.0 está disponível e acessível para testar o processamento de webhooks.
- A estrutura modular do Docker Compose (base + chatwoot) já está documentada em `deploy/docker/README.md`.
- Os testes de backend usarão banco de dados PostgreSQL em modo teste (não mocks de ORM).
- O refresh token tem validade de 30 dias (padrão da indústria para aplicações web).
