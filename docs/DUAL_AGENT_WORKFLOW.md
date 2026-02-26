# 🤖 Dual-Agent Collaboration Protocol (Antigravity + Claude Code)

This document defines the rules of engagement to allow **Antigravity** (IDE Agent) and **Claude Code** (CLI Agent) to work simultaneously on the `whatpro-hub` project without conflicts.

## 🎯 Core Philosophy: "Divide & Conquer, Shared Brain"

- **Shared Brain**: Both agents read from `.agent/agents` and `.agent/skills`.
- **Shared Standard**: Both agents validate against `claude-win11-speckit-update-skill` for performance.
- **Separation of Concerns**: We never edit the same component file simultaneously.

---

## 🚦 Operational Modes

### 1. The Architect & The Builder (Vertical Split)
- **Antigravity (Architect)**: Reads `task.md`, plans the architecture, writes the `implementation_plan.md`, creates new files/structures.
- **Claude Code (Builder)**: Runs tests, fixes specific lint errors, refactors isolated functions, or generates boilerplate based on the plan.

### 2. Frontend & Backend (Horizontal Split)
- **Antigravity**: Focuses on `apps/frontend` (Visual components, React logic, UI Audit).
- **Claude Code**: Focuses on `apps/api` (Controllers, Services, Database migrations) or `deploy/`.

### 3. Feature & Optimization (Temporal Split)
- **Antigravity**: Builds the feature "Green Field".
- **Claude Code**: Runs "Cleanup" (Linting, Speckit optimization, unnecessary file removal) on *finished* features.

---

## 🔒 Safety Rules (The "Anti-Conflict" Laws)

1.  **File Lock Protocol**:
    *   If Antigravity is editing `Page.tsx`, Claude Code MUST NOT touch it until Antigravity says "Task Completed".
    *   Use folder-level separation: "I am working in `features/instances`" implies "Claude, stay out of `features/instances`".

2.  **Single Source of Truth**:
    *   `implementation_plan.md` is the master document.
    *   Antigravity writes it. Claude Code reads it to know what to do.

3.  **The "Speckit" Standard**:
    *   Both agents must check `.agent/skills/claude-win11-speckit-update-skill` when doing system-level updates.
    *   If one agent optimizes a piece of code, it tags it (e.g., `// Optimized by Speckit Pattern`).

---

## 🛠️ How to Orchestrate

**User Command Example:**
> "Antigravity, refatore o `InstancesPage` (Frontend). Enquanto isso, peça ao Claude Code para otimizar os controladores da API usando Speckit."

**Execution Flow:**
1.  **Antigravity**: Locks `apps/frontend`. Edits the UI.
2.  **Antigravity (via Terminal)**: Sends command `claude "Analyze apps/api controllers and apply Speckit optimizations. DO NOT touch frontend."`
3.  **Parallelism**: Both run at once.
4.  **Sync**: Antigravity runs `git status` to see what Claude did before merging contexts.

---

## 🚀 Setup Status

- [x] **Agent Framework**: `.agent/` folder is active.
- [x] **CLI Config**: `CLAUDE.md` is configured to respect agents.
- [x] **Protocol**: This document (`docs/DUAL_AGENT_WORKFLOW.md`) is active.
