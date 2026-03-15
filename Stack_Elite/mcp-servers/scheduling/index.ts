// mcp-servers/scheduling/index.ts
//
// MCP Server: Scheduling & Location
// Ferramentas: schedule_test_drive (Google Calendar OAuth2 por tenant) e
//              get_store_location (Google Maps Static URL com API Key).
//
// USAGE in n8n:
//   MCP Client node → transport: SSE → url: http://mcp_scheduling:8787/sse

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import pg from "pg";
import express from "express";

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const server = new McpServer({ name: "mcp-scheduling", version: "2.0.0" });

// ─────────────────────────────────────────────────────────────────────────────
// Helper: busca refresh_token do Google Calendar do tenant
// ─────────────────────────────────────────────────────────────────────────────
const getTenantGCalConfig = async (tenant_id?: string) => {
  if (tenant_id) {
    const res = await db.query(
      `SELECT config_json FROM tenants WHERE id = $1`,
      [tenant_id]
    );
    const config = res.rows[0]?.config_json ?? {};
    if (config.gcal_refresh_token) {
      return {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        refreshToken: config.gcal_refresh_token as string,
      };
    }
  }
  // Fallback: credenciais globais do ambiente
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: obtém access_token via refresh_token (Google OAuth2)
// ─────────────────────────────────────────────────────────────────────────────
const refreshAccessToken = async (clientId: string, clientSecret: string, refreshToken: string): Promise<string> => {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Google OAuth2 token refresh failed: ${err}`);
  }
  const data = await resp.json() as { access_token: string };
  return data.access_token;
};

// ── Tool 1: Localização da Loja ──────────────────────────────────────────────

server.tool(
  "get_store_location",
  "Retorna a localização da loja em um link do Google Maps para o lead usar o GPS.",
  {
    store_name: z.string().describe("Nome completo ou endereço da loja"),
    tenant_id: z.string().optional().describe("ID do tenant para buscar endereço no banco"),
  },
  async ({ store_name, tenant_id }) => {
    try {
      let address = store_name;

      // Tenta buscar endereço no config_json do tenant
      if (tenant_id) {
        const res = await db.query(
          `SELECT config_json->>'endereco' AS endereco FROM tenants WHERE id = $1`,
          [tenant_id]
        );
        if (res.rows[0]?.endereco) {
          address = res.rows[0].endereco;
        }
      }

      const encodedQuery = encodeURIComponent(address);

      // Link direto do Google Maps — funciona sem API Key, sem custo
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

      return {
        content: [{
          type: "text" as const,
          text: `📍 Rota para ${address}: ${mapsUrl}\nCompartilhe este link com o lead para que ele possa usar o GPS até nossa loja.`,
        }],
      };
    } catch (error: any) {
      return { content: [{ type: "text" as const, text: `Erro ao obter localização: ${error.message}` }], isError: true };
    }
  }
);

// ── Tool 2: Agendar Test Drive / Visita ──────────────────────────────────────

server.tool(
  "schedule_test_drive",
  "Cria um evento real no Google Calendar do vendedor para uma visita ou test drive.",
  {
    lead_name: z.string().describe("Nome do cliente"),
    lead_contact: z.string().describe("Telefone ou e-mail do lead"),
    vehicle_model: z.string().describe("Veículo de interesse para o test drive"),
    date_time: z.string().describe("Data e hora no formato ISO 8601 (ex: 2026-03-20T14:30:00-03:00)"),
    duration_minutes: z.number().default(60).describe("Duração da visita em minutos"),
    salesperson_email: z.string().optional().describe("E-mail do vendedor (agenda calendário dele)"),
    notes: z.string().optional().describe("Observações adicionais para o evento"),
    tenant_id: z.string().optional().describe("SaaS Tenant ID"),
  },
  async ({ lead_name, lead_contact, vehicle_model, date_time, duration_minutes, salesperson_email, notes, tenant_id }) => {
    try {
      const gcalConfig = await getTenantGCalConfig(tenant_id);

      if (!gcalConfig.clientId || !gcalConfig.clientSecret || !gcalConfig.refreshToken) {
        // Fallback gracioso se Google Calendar não configurado: salva no banco
        await db.query(
          `INSERT INTO appointments (tenant_id, client_name, client_contact, appointment_date, salesperson, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED')`,
          [
            tenant_id ?? null,
            lead_name,
            lead_contact,
            date_time,
            salesperson_email ?? "A Definir",
            `Veículo: ${vehicle_model}. ${notes ?? ""}`,
          ]
        );
        return {
          content: [{
            type: "text" as const,
            text: `✅ Visita agendada no banco de dados para ${lead_name} conhecer o ${vehicle_model} em ${date_time}.\n⚠️ Google Calendar não configurado para este tenant — agendamento salvo internamente.`,
          }],
        };
      }

      // Obtém access_token via OAuth2 refresh
      const accessToken = await refreshAccessToken(
        gcalConfig.clientId,
        gcalConfig.clientSecret,
        gcalConfig.refreshToken
      );

      // Calcula horário de fim
      const startTime = new Date(date_time);
      const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

      const event = {
        summary: `Test Drive — ${lead_name} → ${vehicle_model}`,
        description: `Lead: ${lead_name}\nContato: ${lead_contact}\nVeículo: ${vehicle_model}\n${notes ?? ""}`,
        start: { dateTime: startTime.toISOString(), timeZone: "America/Sao_Paulo" },
        end: { dateTime: endTime.toISOString(), timeZone: "America/Sao_Paulo" },
        attendees: salesperson_email ? [{ email: salesperson_email }] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 15 },
          ],
        },
      };

      const calendarId = salesperson_email ?? "primary";
      const resp = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Google Calendar API error: ${err}`);
      }

      const created = await resp.json() as { id: string; htmlLink: string };

      // Salva também no banco local
      await db.query(
        `INSERT INTO appointments (tenant_id, client_name, client_contact, appointment_date, salesperson, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED')
         ON CONFLICT DO NOTHING`,
        [
          tenant_id ?? null,
          lead_name,
          lead_contact,
          startTime.toISOString(),
          salesperson_email ?? "A Definir",
          `Veículo: ${vehicle_model}. GCal ID: ${created.id}. ${notes ?? ""}`,
        ]
      );

      return {
        content: [{
          type: "text" as const,
          text: `✅ Visita criada no Google Calendar!\n📅 ${lead_name} → ${vehicle_model} em ${date_time}\n🔗 Evento: ${created.htmlLink}\nInstrução: Confirme ao lead com entusiasmo que a agenda foi bloqueada com sucesso!`,
        }],
      };
    } catch (error: any) {
      return { content: [{ type: "text" as const, text: `Erro ao agendar: ${error.message}` }], isError: true };
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Startup — SSE (Docker/n8n) ou stdio (local)
// ─────────────────────────────────────────────────────────────────────────────

if (process.env.MCP_TRANSPORT === "stdio") {
  const stdioTransport = new StdioServerTransport();
  server.connect(stdioTransport);
  console.log("🟢 mcp-scheduling running [stdio]");
} else {
  const app = express();
  app.use(express.json());

  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/message", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => transports.delete(transport.sessionId));
    await server.connect(transport);
  });

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
    console.log(`🟢 mcp-scheduling running [SSE] → http://localhost:${PORT}/sse`);
  });
}
