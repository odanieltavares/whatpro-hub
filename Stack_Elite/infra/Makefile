# ==========================================
# ELITE SDR STACK — Makefile de Orquestração
# ==========================================
# Uso:
#   make up        → Sobe tudo (núcleo + motor IA + MCPs)
#   make down      → Para tudo
#   make core      → Sobe só a infraestrutura base
#   make ai        → Sobe só os modelos OSS de IA
#   make mcp       → Sobe só os MCP servers internos
#   make logs      → Exibe logs de todos os serviços
#   make status    → Checa o status dos containers

COMPOSE_CORE    = docker-compose -f docker-compose.core.yml
COMPOSE_AI      = docker-compose -f docker-compose.ai-engine.yml
COMPOSE_MCP     = docker-compose -f docker-compose.mcp.yml

.PHONY: up down core ai mcp logs status restart rebuild

## Sobe tudo em sequência (espera healthcheck do postgres)
up: core ai mcp

## Sobe apenas o núcleo (n8n, postgres, redis, langfuse, metabase)
core:
	@echo "🟢 Subindo núcleo de infraestrutura..."
	$(COMPOSE_CORE) up -d
	$(COMPOSE_CORE) ps

## Sobe apenas o motor de IA OSS (whisper, llava, gliner, security, rag, sentiment)
ai:
	@echo "🧠 Subindo motor de IA OSS..."
	$(COMPOSE_AI) up -d
	$(COMPOSE_AI) ps

## Sobe apenas os MCP servers internos
mcp:
	@echo "🔌 Subindo MCP Servers internos..."
	$(COMPOSE_MCP) up -d
	$(COMPOSE_MCP) ps

## Para e remove todos os containers
down:
	@echo "🔴 Parando todos os serviços..."
	$(COMPOSE_MCP) down
	$(COMPOSE_AI) down
	$(COMPOSE_CORE) down

## Reinicia tudo
restart: down up

## Rebuild completo (útil após mudanças de código)
rebuild:
	@echo "🔨 Rebuilding imagens..."
	$(COMPOSE_CORE) build
	$(COMPOSE_AI) build
	$(COMPOSE_MCP) build
	@echo "✅ Build concluído. Execute 'make up' para iniciar."

## Logs de todos os serviços
logs:
	@echo "--- CORE LOGS ---"
	$(COMPOSE_CORE) logs --tail=20
	@echo "--- AI ENGINE LOGS ---"
	$(COMPOSE_AI) logs --tail=20
	@echo "--- MCP LOGS ---"
	$(COMPOSE_MCP) logs --tail=20

## Status de todos os containers
status:
	@echo "=== CORE ==="
	$(COMPOSE_CORE) ps
	@echo "=== AI ENGINE ==="
	$(COMPOSE_AI) ps
	@echo "=== MCP SERVERS ==="
	$(COMPOSE_MCP) ps
