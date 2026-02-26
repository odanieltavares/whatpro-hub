# Multi-stage Dockerfile shared by all MCP servers in the workspace
# Context: Stack_Elite/mcp-servers/

FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g tsx

# Install deps from root workspace
COPY package.json ./
RUN npm install

# Copy all server source files
COPY . .

# Default port for SSE transport
EXPOSE 8787

# Entry point is set per-service via `command:` in docker-compose
# e.g.: command: tsx chatwoot/index.ts
CMD ["tsx", "chatwoot/index.ts"]
