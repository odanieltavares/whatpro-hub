# ==========================================
# ELITE SDR STACK — Makefile de Orquestração
# ==========================================
# Uso:
#   make up        → Sobe tudo (núcleo + motor IA + MCPs)
#   make down      → Para tudo
#   make core      → Sobe só a infraestrutura base (n8n, postgres, redis, langfuse, metabase, traefik)
#   make ai        → Sobe só os modelos OSS de IA
#   make mcp       → Sobe só os MCP servers internos
#   make pull-llava→ Baixa o modelo LLaVA no Ollama (necessário após primeiro 'make ai')
#   make logs      → Exibe logs de todos os serviços
#   make status    → Checa o status dos containers
#   make rebuild   → Rebuild completo das imagens customizadas

COMPOSE_CORE    = docker-compose -f docker-compose.core.yml
COMPOSE_AI      = docker-compose -f docker-compose.ai-engine.yml
COMPOSE_MCP     = docker-compose -f docker-compose.mcp.yml

.PHONY: up down core ai mcp logs status restart rebuild pull-llava

## Sobe tudo em sequência correta (espera healthcheck do postgres)
up: core ai mcp
	@echo "✅ Stack Elite SDR totalmente operacional!"

## Sobe o núcleo (n8n, postgres, redis, langfuse, metabase, traefik/https)
core:
	@echo "🟢 Subindo núcleo de infraestrutura..."
	$(COMPOSE_CORE) up -d
	@echo "⏳ Aguardando Postgres ficar saudável..."
	$(COMPOSE_CORE) ps

## Sobe o motor de IA OSS (whisper, llava+ollama, gliner, security, rag, sentiment)
ai:
	@echo "🧠 Subindo motor de IA OSS..."
	$(COMPOSE_AI) up -d
	$(COMPOSE_AI) ps
	@echo "💡 Primeira execução? Execute: make pull-llava"

## Baixa o modelo LLaVA no container Ollama (necessário na primeira vez)
pull-llava:
	@echo "📥 Baixando modelo LLaVA no Ollama (pode demorar ~5GB)..."
	docker exec -it elite_ollama ollama pull llava
	@echo "✅ LLaVA pronto!"

## Sobe os MCP servers internos (SSE endpoints para o n8n)
mcp:
	@echo "🔌 Subindo MCP Servers internos..."
	$(COMPOSE_MCP) up -d
	$(COMPOSE_MCP) ps

## Para e remove todos os containers (mantém volumes)
down:
	@echo "🔴 Parando todos os serviços..."
	$(COMPOSE_MCP) down
	$(COMPOSE_AI) down
	$(COMPOSE_CORE) down

## Reinicia tudo
restart: down up

## Rebuild completo das imagens customizadas (após mudanças de código)
rebuild:
	@echo "🔨 Rebuilding imagens customizadas..."
	$(COMPOSE_CORE) build
	$(COMPOSE_AI) build
	$(COMPOSE_MCP) build
	@echo "✅ Build concluído. Execute 'make up' para iniciar."

## Logs em tempo real de todos os serviços
logs-core:
	$(COMPOSE_CORE) logs -f --tail=50

logs-ai:
	$(COMPOSE_AI) logs -f --tail=50

logs-mcp:
	$(COMPOSE_MCP) logs -f --tail=50

logs:
	@echo "--- CORE LOGS (últimas 20 linhas) ---"
	$(COMPOSE_CORE) logs --tail=20
	@echo "--- AI ENGINE LOGS ---"
	$(COMPOSE_AI) logs --tail=20
	@echo "--- MCP LOGS ---"
	$(COMPOSE_MCP) logs --tail=20

## Status de todos os containers
status:
	@echo "=== CORE (n8n, postgres, redis, traefik) ==="
	$(COMPOSE_CORE) ps
	@echo ""
	@echo "=== AI ENGINE (whisper, llava, gliner, rag, security, sentiment) ==="
	$(COMPOSE_AI) ps
	@echo ""
	@echo "=== MCP SERVERS (chatwoot, fipe, stock, scoring, media, analytics, scheduling) ==="
	$(COMPOSE_MCP) ps
