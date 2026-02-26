# Claude Code Configuration

> **CRITICAL PROTOCOL:** This project uses a custom Agent & Skill framework located in `.agent/`.
> You MUST follow the protocols defined below.

## 🤖 intelligent-agent-routing

**Before starting ANY task, you must:**

1. **Check Swarm Memory**: Read `.agent/swarm/state/SWARM_MEMORY.md`.
   - *Am I the Wingman?* Check `.agent/swarm/state/SWARM_ROLES.md`.
   - *What is the Handoff?* Execute the requested task in `SWARM_MEMORY.md`.

2. **Analyze the Request**: Identify if it involves Frontend, Backend, Database, or DevOps.
3. **Select the Agent**: Check `.agent/agents/` for the specialist.
   - `@frontend-specialist`: React, Tailwind, UI/UX (`.agent/agents/frontend-specialist.md`)
   - `@backend-specialist`: Node.js, APIs, Database (`.agent/agents/backend-specialist.md`)
   - `@mobile-developer`: React Native, iOS, Android (`.agent/agents/mobile-developer.md`)
   - `@orchestrator`: Complex planning & architecture
3. **READ the Agent File**: You must strictly follow the `Role`, `Mindset`, and `Rules` in the selected agent's `.md` file.

## 🛠️ Modular Skills

You have access to specialized skills in `.agent/skills/`.
**Always check for relevant skills before executing.**

**Highlighted Skills:**
- **Claude Code Guide**: `.agent/skills/claude-code-guide/SKILL.md`
- **Speckit Update Skill**: `.agent/skills/claude-win11-speckit-update-skill/SKILL.md`
  - *Instruction:* Use this skill's patterns for system updates and performance enhancements where applicable.
- **Clean Code**: `.agent/skills/clean-code/SKILL.md`

## 🚀 Performance & Workflow

1. **Read-First Protocol**: Always read the relevant Agent and Skill files *before* generating code.
2. **Context Efficiency**: Do not dump large files. Use `grep` or specific `read_file` calls.
3. **Context7 Auto-Research**: Use `.agent/skills/context7-auto-research/SKILL.md` for latest documentation.

## Project Context

- **Frontend**: React, Vite, Tailwind CSS (`apps/frontend`)
- **Backend**: Node.js, Express (`apps/api`)
- **Docker**: Used for deployment (`deploy/docker`)

## Reference Commands

- Run Frontend: `cd apps/frontend && npm run dev`
- Run Backend: `cd apps/api && npm run dev`
- Build All: `npm run build`

## Active Technologies
- Go 1.22+ (backend) | TypeScript 5.x / React 18 (frontend) (001-system-audit)
- PostgreSQL 16 (primary) + Redis 7 (cache/rate-limiting/token revocation) (001-system-audit)

## Recent Changes
- 001-system-audit: Added Go 1.22+ (backend) | TypeScript 5.x / React 18 (frontend)
