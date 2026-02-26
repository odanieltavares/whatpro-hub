# 🐝 Swarm Intelligence Protocol (S.I.P.) v1.0

> **Universally Portable**: Copy the `.agent/swarm` folder to ANY project to enable this capability.

## 1. The Core Philosophy: "Fluid Leadership"

Unlike static workflows, S.I.P. assumes **Dynamic Roles**.
- **Leader**: The agent currently driving the `implementation_plan.md`.
- **Wingman**: The agent executing specific tasks (tests, refactors, audits).
- **Relay**: At any point, Leader can pass the baton to Wingman via a `HANDOFF` signal.

## 2. The Shared Brain (`.agent/swarm/state/`)

To ensure "Impeccable" context continuity, we use a structured state system:

### 📄 `SWARM_MEMORY.md` (The "Black Box")
Records the *exact* state of the project for the next agent.
```markdown
# Swarm Memory Snapshot
- **Last Active Agent**: Antigravity
- **Current Phase**: Execution (UI Polish)
- **Stopped At**: Finished Toaster fix, about to start Dashboard.
- **Blockers**: None.
- **Next Logical Step**: Run `claude` to audit API endpoints for Dashboard data.
```

### 📄 `SWARM_ROLES.md` (The "Team Sheet")
Defines who is doing what *right now*.
```markdown
| Agent | Role | Scope | Status |
|-------|------|-------|--------|
| Antigravity | LEADER | apps/frontend/**/* | Active |
| Claude Code | WINGMAN | apps/api/**/* | Waiting |
```

## 3. The "Speckit" Integration Strategy

Speckit isn't just a skill; it's the **Optimization Layer**.
- **Rule**: Before any Handoff, the departing agent runs a "Speckit Check":
  > "Did I leave any performance debt? specific technical debt?"
- **Action**: If yes, add a task to `task.md` specifically for the Wingman.

## 4. How to use in OTHER projects?

1. **Copy**: `cp -r .agent/swarm /new-project/.agent/`
2. **Init**: Run user command "Initialize Swarm".
3. **Config**: The `CLAUDE.md` automatically detects `.agent/swarm` and strict modes.

---

## 5. The "Think Tank" Validation (Antigravity + Claude)

**Scenario**: User wants to fix "Dashboard Page".
1. **Antigravity (Leader)**: Drafts visual plan.
2. **Antigravity**: Writes to `SWARM_MEMORY.md`: "Need real data for Dashboard. Claude, please map the API endpoints."
3. **Claude Code (Wingman)**: Reads Memory. Scans `apps/api`. Writes: "Found `GET /metrics`. Updating `SWARM_MEMORY` with types."
4. **Antigravity**: Reads types. Implements UI.

**Result**: Zero conflict, perfect type safety, rapid execution.
