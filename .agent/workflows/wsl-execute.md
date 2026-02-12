---
description: Execute commands in Ubuntu WSL environment. Use this for running Go, npm, tests, and any other development commands.
---

# WSL Ubuntu Command Execution

// turbo-all

This workflow ensures all development commands run in the Ubuntu WSL environment.

## Environment Info

- **WSL Distribution**: Ubuntu-24.04
- **Project Path**: `/home/whatpro/projects/whatpro-hub`
- **Go Location**: `/usr/local/go/bin/go` (or via PATH in bash)
- **Node Location**: Uses nvm or system node

## Command Execution Pattern

### For Go Commands (Backend)

```bash
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/api && <COMMAND>"
```

**Examples:**

```bash
# Build
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/api && go build ./..."

# Run tests
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/api && go test ./..."

# Integration tests
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/api && go test -tags=integration ./..."

# Run server
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/api && go run ./cmd/server"
```

### For Node/npm Commands (Frontend)

```bash
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/frontend && <COMMAND>"
```

**Examples:**

```bash
# Install dependencies
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/frontend && npm install"

# Dev server
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/frontend && npm run dev"

# Build
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/frontend && npm run build"

# Lint
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/frontend && npm run lint"
```

### For Docker Commands

```bash
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub && docker compose <COMMAND>"
```

**Examples:**

```bash
# Start services
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub && docker compose up -d"

# View logs
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub && docker compose logs -f"

# Stop services
wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub && docker compose down"
```

## Why `-ic` Flags?

- `-i`: Interactive shell (loads .bashrc, enables aliases)
- `-c`: Execute command string
- This ensures PATH and environment variables are properly loaded

## Important Notes

1. **Never use `cd` alone** - PowerShell's `cd` won't change WSL directory
2. **Never use `&&` in PowerShell** - Use WSL's bash for chained commands
3. **Always specify `-d Ubuntu-24.04`** - Ensures correct distribution
4. **Use absolute Linux paths** - `/home/whatpro/...` not Windows paths

## Quick Reference

| Task      | Command                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Go build  | `wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/api && go build ./..."`   |
| Go test   | `wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/api && go test ./..."`    |
| npm dev   | `wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub/apps/frontend && npm run dev"` |
| Docker up | `wsl -d Ubuntu-24.04 -- bash -ic "cd /home/whatpro/projects/whatpro-hub && docker compose up -d"`      |
