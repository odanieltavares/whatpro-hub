// mcp-servers/chatwoot/index.ts
//
// EXTENDS the official EvolutionAPI/chatwoot_mcp with SaaS multi-tenancy
// and Native Human simulation tools (typing indicator, semantic handoffs).
//
// USAGE in n8n:
//   MCP Client node → transport: SSE → url: http://mcp-chatwoot:8787/sse

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import pg from "pg";
import express from "express";

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const getChatwootConfig = async (tenant_id?: string) => {
  if (tenant_id) {
    const res = await db.query(
      `SELECT chatwoot_account_id, chatwoot_api_token FROM chatwoot_connections WHERE tenant_id = $1 AND is_active = true`,
      [tenant_id]
    );
    if (res.rows[0]) {
      return {
        baseUrl: process.env.CHATWOOT_URL!,
        account: res.rows[0].chatwoot_account_id,
        token: res.rows[0].chatwoot_api_token,
      };
    }
    console.warn(`No active chatwoot connection found for tenant ${tenant_id}. Falling back to global env vars.`);
  }

  return {
    baseUrl: process.env.CHATWOOT_URL!,
    account: process.env.CHATWOOT_ACCOUNT_ID!,
    token: process.env.CHATWOOT_API_KEY!,
  };
};

const api = async (path: string, method = "GET", body?: object, tenant_id?: string) => {
  const config = await getChatwootConfig(tenant_id);
  const BASE = `${config.baseUrl}/api/v1/accounts/${config.account}`;
  const headers = { "api_access_token": config.token, "Content-Type": "application/json" };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
     const errorText = await res.text();
     throw new Error(`Chatwoot API error ${res.status} on ${path}: ${errorText}`);
  }
  
  // Some endpoints return 204 No Content
  if (res.status === 204) return {};
  return res.json();
};

const server = new McpServer({ name: "mcp-chatwoot-elite", version: "2.0.0" });

// ── Core tools ─────────────────────────────────────────────────────────────────

server.tool(
  "chatwoot_send_message",
  "Envia uma mensagem ao cliente na conversa. Use private:true para notas internas invisíveis ao cliente.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    conversation_id: z.number().describe("ID da conversa no Chatwoot"),
    message: z.string().describe("Texto a enviar"),
    message_type: z.enum(["incoming", "outgoing"]).default("outgoing"),
    private: z.boolean().default(false).describe("Se true: nota privada (handoff, briefing para vendedor)"),
  },
  async ({ tenant_id, conversation_id, message, message_type, private: isPrivate }) => {
    const data = await api(
      `/conversations/${conversation_id}/messages`,
      "POST",
      { content: message, message_type, private: isPrivate },
      tenant_id
    );
    return { content: [{ type: "text" as const, text: `✅ Mensagem enviada (id: ${data.id})` }] };
  }
);

server.tool(
  "chatwoot_list_conversations",
  "Lista conversas abertas ou filtradas por status/inbox.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    inbox_id: z.number().optional(),
    status: z.enum(["open", "resolved", "pending"]).optional().default("open"),
  },
  async ({ tenant_id, inbox_id, status }) => {
    const params = new URLSearchParams({ status: status ?? "open" });
    if (inbox_id) params.set("inbox_id", String(inbox_id));
    const data = await api(`/conversations?${params}`, "GET", undefined, tenant_id);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Native Human Simulation (Evo-AI Padrão) ────────────────────────────────────

server.tool(
  "chatwoot_send_typing_indicator",
  "Simula que um humano está digitando agora mesmo na conversa para reter o lead.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    conversation_id: z.number().describe("ID da conversa no Chatwoot"),
    status: z.enum(["on", "off"]).default("on").describe("Ativar ou desativar digitando"),
  },
  async ({ tenant_id, conversation_id, status }) => {
    // A rota oficial de typing status no Chatwoot (informação experimental, mas documentada)
    // No caso de webhook vindo de inbox de api, podemos injetar uma mensagem tipo evento.
    // Algumas versões suportam: POST /api/v1/accounts/{account_id}/conversations/{id}/typing_status
    try {
       await api(`/conversations/${conversation_id}/typing_status`, "POST", { typing_status: status }, tenant_id);
    } catch {
       // Se o Chatwoot instance não tiver typing_status habilitado via API, a gente ignora silenciosamente.
       return { content: [{ type: "text" as const, text: `✅ Sinal de digitação ignorado ou ativado com sucesso.` }] };
    }
    return { content: [{ type: "text" as const, text: `✅ Sinal de digitação emitido: ${status}` }] };
  }
);

server.tool(
  "chatwoot_resolve_conversation",
  "Encerra um ticket de atendimento definindo status como 'resolved'. Útil em lixos (Spam) ou fechamentos.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    conversation_id: z.number(),
  },
  async ({ tenant_id, conversation_id }) => {
    await api(`/conversations/${conversation_id}`, "PATCH", { status: "resolved" }, tenant_id);
    return { content: [{ type: "text" as const, text: `✅ Ticket ${conversation_id} encerrado e movido para resolvidos.` }] };
  }
);

server.tool(
  "chatwoot_apply_labels",
  "Atualiza as etiquetas na barra lateral do lead. Ex: MQL, SQL, Quente, Retoma.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    conversation_id: z.number(),
    labels: z.array(z.string()).describe("Lista de labels a adicionar"),
  },
  async ({ tenant_id, conversation_id, labels }) => {
    await api(`/conversations/${conversation_id}/labels`, "POST", { labels }, tenant_id);
    return { content: [{ type: "text" as const, text: `✅ Labels aplicadas: ${labels.join(", ")}` }] };
  }
);

server.tool(
  "chatwoot_handoff_to_human",
  "Paralisa a resposta de IA e notifica/transfere o atendimento para uma equipe humana.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    conversation_id: z.number(),
    assignee_id: z.number().optional().describe("ID do agente humano (opcional)"),
    team_id: z.number().optional().describe("ID do time humano (opcional)"),
    handoff_message: z.string().optional().describe("Nota interna descritiva para o humano ler antes de assumir."),
  },
  async ({ tenant_id, conversation_id, assignee_id, team_id, handoff_message }) => {
    // 1. Marca labels indicativas
    await api(`/conversations/${conversation_id}/labels`, "POST", { labels: ["HANDOFF_HUMANO", "SQL"] }, tenant_id);
    
    // 2. Registra nota interna se enviada
    if (handoff_message) {
       await api(`/conversations/${conversation_id}/messages`, "POST", {
          content: handoff_message,
          message_type: "outgoing",
          private: true
       }, tenant_id);
    }
    
    // 3. Atualiza assignees
    await api(`/conversations/${conversation_id}/assignments`, "POST", {
      assignee_id: assignee_id || 0,
      team_id: team_id || 0,
    }, tenant_id);
    return { content: [{ type: "text" as const, text: `✅ Ticket ${conversation_id} escalado para humanos.` }] };
  }
);

// ── Context Tools ─────────────────────────────────────────────────────────────

server.tool(
  "chatwoot_get_history",
  "Retorna as últimas N mensagens da conversa. Auxilia na formação de contexto.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    conversation_id: z.number(),
    limit: z.number().default(20),
  },
  async ({ tenant_id, conversation_id, limit }) => {
    const data = await api(`/conversations/${conversation_id}/messages?limit=${limit}`, "GET", undefined, tenant_id);
    const formatted = data.payload?.map((m: any) => ({
      role: m.message_type === 0 ? "user" : "assistant",
      content: m.content,
      type: m.content_type,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }] };
  }
);

server.tool(
  "chatwoot_update_contact_attributes",
  "Salva os atributos BANT (Budget, Authority, Need, Timeline) no contato no Chatwoot.",
  {
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
    contact_id: z.number(),
    custom_attributes: z.object({
      cidade: z.string().optional(),
      veiculo_interesse: z.string().optional(),
      veiculo_troca_modelo: z.string().optional(),
      orcamento_declarado: z.string().optional(),
      lead_score: z.number().optional(),
      classificacao: z.enum(["cold", "mql", "sql"]).optional(),
    }).passthrough(),
  },
  async ({ tenant_id, contact_id, custom_attributes }) => {
    await api(`/contacts/${contact_id}`, "PATCH", { custom_attributes }, tenant_id);
    return { content: [{ type: "text" as const, text: `✅ Atributos atualizados.` }] };
  }
);

// ── Startup ────────────────────────────────────────────────────────────────────

// ── Startup ────────────────────────────────────────────────────────────────────

if (process.env.MCP_TRANSPORT === "stdio") {
  // Modo stdio (para uso direto/local)
  const stdioTransport = new StdioServerTransport();
  server.connect(stdioTransport);
  console.log("🟢 mcp-chatwoot-elite (Multi-Tenant SaaS) running [stdio]");
} else {
  // Modo SSE via Express — padrão para Docker/n8n
  const app = express();
  app.use(express.json());

  // Mapeia session_id → transport ativo
  const transports = new Map<string, SSEServerTransport>();

  // Endpoint SSE — o n8n conecta aqui
  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/message", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => transports.delete(transport.sessionId));
    await server.connect(transport);
  });

  // Endpoint de mensagens — o n8n posta aqui
  app.post("/message", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  const PORT = parseInt(process.env.PORT ?? "8787", 10);
  app.listen(PORT, () => {
    console.log(`🟢 mcp-chatwoot-elite (Multi-Tenant SaaS) running [SSE] → http://localhost:${PORT}/sse`);
  });
}

