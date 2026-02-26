# 🐝 Swarm User Guide: Portability & Memory

## 1. How to use in OTHER projects? (The "Swarm Injection")

To give any project "Dual-Agent" superpowers, you just need to inject the brainstem.

### 📥 Installation Steps (30 seconds)

1.  **Copy the Core**:
    Copy the `.agent` folder from this project to your new project root.
    ```bash
    cp -r whatpro-hub/.agent new-project/.agent
    ```

2.  **Inject the Config**:
    Copy the `CLAUDE.md` (this tells Claude Code how to behave).
    ```bash
    cp whatpro-hub/CLAUDE.md new-project/CLAUDE.md
    ```

3.  **Reset the Brain**:
    Clear the state files to start fresh.
    ```bash
    echo "" > new-project/.agent/swarm/state/SWARM_MEMORY.md
    # Reset roles: Antigravity = Leader
    ```

---

## 2. The "Unified Memory" Challenge

You have two powerful agents, each with their own "working memory". Here is how to keep them sane.

### 🧠 The Memory Hierarchy

**Level 1: The Treaty (Global Shared Memory)**
- **File**: `.agent/swarm/state/SWARM_MEMORY.md`
- **Purpose**: High-level strategy. "Where are we going?"
- **Who Writes?**: The **Leader** updates this before a handoff.
- **Who Reads?**: Both agents read this *first* to align.

**Level 2: The Tactical Plans (Local Memory)**
- **Antigravity**: Uses `task.md` and `implementation_plan.md` (Artifacts).
  - *Detail Level*: High (Specific file edits, UI component props).
- **Claude Code**: Uses its internal context and terminal output.
  - *Detail Level*: Execution (Test results, specific function refactors).

### 🚦 How to Control Modes?

#### mode: SOLO (Default)
You talk to Antigravity. I execute tasks. I update my `task.md`.
*   **When to use**: Visual work, complex architecture planning.
*   **Check**: Use `task.md`.

#### mode: JOINT (Swarm)
You want simultaneous execution.
1.  **Command**: "Antigravity, update the Swarm Memory. I want Claude to fix the backend."
2.  **Action**: I write the specific request to `SWARM_MEMORY.md`.
3.  **Handoff**: I run `commit_swarm_handoff.sh`.
4.  **You**: Open terminal -> run `claude` -> It reads the memory -> It executes.

---

## 3. The "Truth" Dashboard

To understand "Who is doing what?", look at `.agent/swarm/state/SWARM_ROLES.md`.

| Agent | Status | Meaning |
|-------|--------|---------|
| Leader | ACTIVE | Currently driving the main `implementation_plan.md` |
| Wingman | STANDBY | Waiting for instructions in `SWARM_MEMORY.md` |
| Wingman | WORKING | Currently executing a side-task (e.g., tests) |

### ✅ Checklist for "Joint Thinking"
If you want to guarantee they are aligned:
1.  Ask Antigravity: *"Sync Swarm Memory"* (I will summarize my current status there).
2.  Ask Claude: *"Check Swarm Memory"* (He will read my summary).
