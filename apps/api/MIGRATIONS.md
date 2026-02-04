# 🚀 Guia de Migrations - WhatPro Hub

## Como Rodar as Migrations

### Opção 1: Automático (Development)

As migrations rodam automaticamente quando você inicia o servidor em modo `development`:

```bash
cd deploy/docker
docker-compose up whatpro_api
```

O servidor irá:

1. Conectar ao PostgreSQL
2. Executar as migrations GORM
3. Criar todas as tabelas e índices
4. Iniciar a API

### Opção 2: Manual via SQL

Se preferir rodar manualmente ou precisar reinicializar o banco:

```bash
# Conectar ao PostgreSQL
docker exec -it whatpro_pgvector psql -U postgres -d whatpro_hub

# Dentro do psql, execute:
\i /docker-entrypoint-initdb.d/init-databases.sql
```

ou via comando direto:

```bash
docker exec -i whatpro_pgvector psql -U postgres -d whatpro_hub < deploy/docker/scripts/init-databases.sql
```

### Opção 3: Via Go (localmente, requer Go instalado)

```bash
cd apps/api

# Rodar migrations
go run cmd/server/main.go
# As migrations rodam automaticamente no startup
```

---

## Estrutura das Migrations

### Arquivo Principal

- **Localização:** `apps/api/internal/migrations/migrations.go`
- **Função:** `RunMigrations(db *gorm.DB)`

### O que as Migrations fazem:

1. **Habilita extensões PostgreSQL**
   - `uuid-ossp` para geração de UUIDs
   - `vector` para suporte a AI (futuro)

2. **Cria todas as tabelas** (11 modelos)
   - accounts
   - users
   - teams
   - team_members
   - providers
   - boards
   - stages
   - cards
   - card_histories
   - sessions
   - audit_logs

3. **Cria índices** para performance
   - ~20 índices otimizados
   - Cobertura de queries comuns

---

## Verificar se Migrations Rodaram

### Via psql

```sql
-- Listar todas as tabelas
\dt

-- Verificar estrutura de uma tabela
\d accounts

-- Listar índices
\di
```

### Via SQL

```sql
-- Contar tabelas criadas
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public';

-- Ver todas as tabelas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Troubleshooting

### Problema: "relation already exists"

**Solução:** Limpar o banco e rodar novamente

```bash
# Parar containers
docker-compose down

# Remover volumes (CUIDADO: apaga todos os dados)
docker volume rm whatpro_pgvector_data

# Iniciar novamente
docker-compose up -d
```

### Problema: "uuid-ossp extension does not exist"

**Solução:** Criar a extensão manualmente

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Problema: Migrations não rodam automaticamente

**Verificar:**

1. Variável de ambiente `APP_ENV=development` está configurada?
2. Connection string do banco está correta?
3. PostgreSQL está rodando?

```bash
# Verificar logs do container
docker logs whatpro_api

# Verificar se PostgreSQL está acessível
docker exec -it whatpro_pgvector pg_isready -U postgres
```

---

## Adicionar Novas Migrations

### Para adicionar um novo modelo:

1. Criar o modelo em `internal/models/`
2. Adicionar o modelo em `internal/migrations/migrations.go`:

```go
if err := db.AutoMigrate(
    &models.Account{},
    // ... outros modelos
    &models.NovoModelo{}, // <- Adicionar aqui
); err != nil {
    return fmt.Errorf("auto-migrate failed: %w", err)
}
```

3. Adicionar índices se necessário em `createIndexes()`

---

## Resetar Banco de Dados

### Development

```bash
# Opção 1: Via Docker
docker-compose down
docker volume rm whatpro_pgvector_data
docker-compose up -d

# Opção 2: Via psql
docker exec -it whatpro_pgvector psql -U postgres -d whatpro_hub -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Production

⚠️ **NUNCA** rode `DROP` em produção sem backup!

```bash
# Fazer backup antes
pg_dump -U postgres whatpro_hub > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres whatpro_hub < backup_20260131.sql
```

---

## Próximos Passos

Agora que as migrations estão prontas:

1. ✅ Database structure criada
2. ⏭️ Implementar Account Management
3. ⏭️ Implementar Provider Management
4. ⏭️ Implementar Kanban (Boards, Stages, Cards)

---

## Arquivos Importantes

- `apps/api/internal/migrations/migrations.go` - Migrations GORM
- `deploy/docker/scripts/init-databases.sql` - Script SQL manual
- `apps/api/cmd/server/main.go` - Integração das migrations
- `apps/api/internal/models/` - Definição dos modelos
