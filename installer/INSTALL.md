# 🚀 WhatPro Hub - Installation Guide

Welcome to the **Fail-Proof Installer** for WhatPro Hub. This guide covers how to set up your environment, deploy the application, and manage your infrastructure.

## ⚡ Quick Start (Fail-Proof)

You do not need to manually install Python, Docker, or Git beforehand. The script handles the "Bootstrap" process automatically.

**Just run:**

```bash
cd installer
bash whatpro-setup
```

### What happens automatically?

1.  **🛡️ Permission Check**: Requests `sudo` if needed.
2.  **📦 Dependency Auto-Install**:
    - Detects if `python3`, `curl`, `git`, or `wget` are missing.
    - Installs them using your system package manager (`apt-get`, etc.).
3.  **📂 Asset Repair**: Downloads `stacks.json` and templates from GitHub if they are missing locally.

---

## 🖥️ Main Menu Map

The installer is organized into **5 Logical Stages**:

### 1. INFRA & OS

> _Prepare your machine._

- **Check System**: Verifies RAM, CPU, and Disk.
- **Manage Dependencies**: Advanced menu to install specific versions of Go/Node/Docker.
- **Linux Migration**: Helper to move project from Windows (`/mnt/c`) to Linux (`~/`) for 10x performance.

### 2. DOCKER ENV

> _Set up the container orchestration layer._

- **Generate .env**: Creates configuration files for Dev or Prod.
- **Validate Health**: Checks if ports (80, 443, 8080) are free.
- **Setup Networks**: Creates `traefik-public` and internal networks.

### 3. APP DEPLOY

> _Launch the application stacks._

- **Deploy DEV**: Runs `docker compose`.
- **Deploy PROD**: Runs `docker swarm`.
- **Update Stacks**: Pulls latest images and restarts services.

### 4. DATA & CONFIG

> _Manage your data._

- **🌱 Seed Test Data**: One-click insert of:
  - Demo Company
  - Super Admin User
  - Sales Team
  - Mock Provider
- **💾 Backup/Restore**: Full PostgreSQL database dumps.
- **⚡ Connect Chatwoot**: Wizard to link Hub API with Chatwoot.

### 5. REPO & MAINTENANCE

> _Keep your project safe._

- **📦 Backup Project (ZIP)**: Creates a full `.tar.gz` backup of your code (ignoring `node_modules`).
- **📥 Update Repo**: Safely pulls latest changes from GitHub (auto-stashing local changes).
- **Self-Update**: Refreshes functionality of the installer itself.

---

## 🔧 Troubleshooting

### "Permission Denied"

Make sure the script is executable:

```bash
chmod +x installer/whatpro-setup
```

### "Docker not running"

- **WSL**: Open Docker Desktop on Windows.
- **Linux**: Run `sudo systemctl start docker`.

### "Port already in use"

Use option **2 > 6) Validate Docker Health** to see which ports are blocked.
