// mcp-servers/scoring/index.ts
//
// MCP Server: Lead Scoring Engine
// Calcula score BANT, gerencia eventos de lead e classifica lost reasons.
// Toda leitura/escrita isolada por tenant_id no Postgres.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import pg from "pg";
import express from "express";

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const server = new McpServer({ name: "mcp-scoring", version: "1.0.0" });

// ── Score Calculation ───────────────────────────────────────────────────────────

server.tool(
  "scoring_calculate",
  `Calcula o score BANT do lead com base nos dados coletados na conversa.
  Retorna o score numérico (0-100), a classificação (cold/mql/sql) e 
  as próximas ações recomendadas para o agente.`,
  {
    tenant_id: z.string().uuid(),
    sessao_id: z.string(),
    // Entradas BANT
    has_trade_in: z.boolean().optional(),
    knows_budget: z.boolean().optional(),
    budget_range: z.string().optional(),
    urgency: z.enum(["high", "medium", "low"]).optional(),
    is_decision_maker: z.boolean().optional(),
    is_in_region: z.boolean().optional(),
    has_specific_model: z.boolean().optional(),
    financing_ready: z.boolean().optional(),
    // Señales de engajamento
    responded_within_1h: z.boolean().optional(),
    sent_audio: z.boolean().optional(),
    sent_photo: z.boolean().optional(),
  },
  async (params) => {
    // Buscar as weights do tenant
    const tenantRes = await db.query(
      "SELECT config_json FROM tenants WHERE id = $1",
      [params.tenant_id]
    );
    const tenantConfig = tenantRes.rows[0]?.config_json ?? {};
    const w = tenantConfig.scoring_weights ?? {
      has_trade_in: 30,
      financing_ready: 20,
      urgency_high: 25,
      is_decision_maker: 15,
      is_in_region: 10,
      has_specific_model: 10,
      responded_within_1h: 5,
    };

    // Cálculo determinístico — sem LLM nesta etapa
    let score = 0;
    if (params.has_trade_in)          score += w.has_trade_in;
    if (params.financing_ready)        score += w.financing_ready;
    if (params.urgency === "high")     score += w.urgency_high;
    if (params.urgency === "medium")   score += Math.floor(w.urgency_high / 2);
    if (params.is_decision_maker)      score += w.is_decision_maker;
    if (params.is_in_region)           score += w.is_in_region;
    if (params.has_specific_model)     score += w.has_specific_model;
    if (params.responded_within_1h)    score += w.responded_within_1h;
    // Bonus multimodal (engajamento alto = mais intenção)
    if (params.sent_audio)            score += 5;
    if (params.sent_photo)            score += 8;

    score = Math.min(score, 100); // Cap em 100

    // Classificação
    const thresholds = tenantConfig.score_thresholds ?? { mql: 30, sql: 70 };
    const classification =
      score >= thresholds.sql ? "sql" :
      score >= thresholds.mql ? "mql" : "cold";

    // Salvar no banco
    await db.query(
      `UPDATE interactions SET gliner_entities = gliner_entities || $1 WHERE sessao_id = $2 AND tenant_id = $3`,
      [JSON.stringify({ lead_score: score, lead_classification: classification }), params.sessao_id, params.tenant_id]
    );

    // Ações recomendadas
    const next_actions = {
      sql: ["Iniciar handoff para consultor", "Criar nota privada de briefing", "Aplicar label SQL", "Oferecer slot de visita"],
      mql: ["Perguntar sobre veículo de troca", "Identificar timeline de compra", "Enviar conteúdo de valor sobre modelo de interesse"],
      cold: ["Nutrir com conteúdo", "Re-engajar em 24h se sem resposta"],
    }[classification];

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ score, classification, next_actions }, null, 2)
      }]
    };
  }
);

server.tool(
  "scoring_log_event",
  "Registra um evento no auditoria trail (message_sent, handoff, visit_scheduled, etc).",
  {
    tenant_id: z.string().uuid(),
    sessao_id: z.string(),
    event_type: z.enum([
      "message_received", "message_sent", "audio_received", "image_received",
      "score_updated", "handoff_initiated", "visit_scheduled",
      "follow_up_sent", "consent_given", "lost_marked", "won_marked"
    ]),
    event_data: z.record(z.any()).optional(),
    langfuse_trace_id: z.string().optional(),
  },
  async ({ tenant_id, sessao_id, event_type, event_data, langfuse_trace_id }) => {
    await db.query(
      `INSERT INTO interactions (tenant_id, sessao_id, tipo_entrada, input_usuario, langfuse_trace_id, gliner_entities)
       VALUES ($1, $2, 'EVENTO', $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [tenant_id, sessao_id, event_type, langfuse_trace_id ?? null, JSON.stringify(event_data ?? {})]
    );
    return { content: [{ type: "text" as const, text: `✅ Evento ${event_type} registrado.` }] };
  }
);

server.tool(
  "scoring_mark_lost",
  "Registra o motivo de perda quando uma negociação não avança.",
  {
    tenant_id: z.string().uuid(),
    sessao_id: z.string(),
    reason: z.enum(["preço", "crédito", "timing", "concorrência", "desistência", "sem_retorno"]),
    notes: z.string().optional(),
  },
  async ({ tenant_id, sessao_id, reason, notes }) => {
    await db.query(
      `INSERT INTO sessions_audits (tenant_id, sessao_id, status_lead, resumo_analitico_gemini)
       VALUES ($1, $2, $3, $4)`,
      [tenant_id, sessao_id, "LOST", `Motivo: ${reason}. ${notes ?? ""}`]
    );
    return { content: [{ type: "text" as const, text: `✅ Lead marcado como LOST: ${reason}` }] };
  }
);


// ── Startup (SSE for Docker/n8n, stdio for local dev) ─────────────────────────

if (process.env.MCP_TRANSPORT === "stdio") {
  const stdioTransport = new StdioServerTransport();
  server.connect(stdioTransport);
  console.log("🟢 mcp-scoring running [stdio]");
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
    console.log(`🟢 mcp-scoring running [SSE] → http://localhost:${PORT}/sse`);
  });
}

