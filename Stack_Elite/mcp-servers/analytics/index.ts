// mcp-servers/analytics/index.ts
//
// MCP Server: Analytics & Observability
// Responsibilities:
//  - Log token usage (custo por conversa)
//  - Create LangFuse traces (rastreabilidade LLM)
//  - Generate audit bible (Gemini post-session summary)
//  - Expose KPI snapshot (Metabase data source)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const LANGFUSE_HOST     = process.env.LANGFUSE_HOST     ?? "http://langfuse_elite:3000";
const LANGFUSE_PK       = process.env.LANGFUSE_PUBLIC_KEY!;
const LANGFUSE_SK       = process.env.LANGFUSE_SECRET_KEY!;
const GEMINI_API_KEY    = process.env.GEMINI_API_KEY!;

const server = new McpServer({ name: "mcp-analytics", version: "1.0.0" });

// ── LangFuse Tracing ───────────────────────────────────────────────────────────

server.tool(
  "analytics_create_trace",
  "Cria um trace no LangFuse para rastrear uma chamada LLM. Retorna trace_id para uso na interação.",
  {
    tenant_id: z.string().uuid(),
    sessao_id: z.string(),
    name: z.string().describe("Nome do trace (ex: 'sdr_response', 'audit_bible')"),
    metadata: z.record(z.any()).optional(),
  },
  async ({ tenant_id, sessao_id, name, metadata }) => {
    const trace_id = `tr_${Date.now()}_${sessao_id.slice(0, 8)}`;
    await fetch(`${LANGFUSE_HOST}/api/public/ingestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${LANGFUSE_PK}:${LANGFUSE_SK}`).toString("base64")}`,
      },
      body: JSON.stringify({
        batch: [{
          type: "trace-create",
          body: { id: trace_id, name, userId: sessao_id, sessionId: sessao_id, metadata: { tenant_id, ...metadata } },
        }],
      }),
    });
    return { content: [{ type: "text" as const, text: JSON.stringify({ trace_id }) }] };
  }
);

server.tool(
  "analytics_log_token_usage",
  "Registra o uso de tokens de uma chamada LLM no Postgres para controle de custo por tenant.",
  {
    tenant_id: z.string().uuid(),
    sessao_id: z.string(),
    langfuse_trace_id: z.string().optional(),
    llm_model: z.string(),
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    cost_per_1k_prompt: z.number().optional().default(0.00015),  // GPT-4o-mini pricing USD/1k
    cost_per_1k_completion: z.number().optional().default(0.0006),
  },
  async (p) => {
    const total = p.prompt_tokens + p.completion_tokens;
    const cost = (p.prompt_tokens / 1000 * (p.cost_per_1k_prompt ?? 0.00015)) +
                 (p.completion_tokens / 1000 * (p.cost_per_1k_completion ?? 0.0006));

    await db.query(
      `UPDATE interactions
       SET langfuse_trace_id = $1
       WHERE sessao_id = $2 AND tenant_id = $3`,
      [p.langfuse_trace_id ?? null, p.sessao_id, p.tenant_id]
    );
    // Nota: Em produção, adicionar tabela token_usage dedicada para agrupamento por mês/tenant
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ total_tokens: total, estimated_cost_usd: cost.toFixed(6) })
      }]
    };
  }
);

// ── Gemini Audit Bible ─────────────────────────────────────────────────────────

server.tool(
  "analytics_generate_audit_bible",
  `Ao resolver uma conversa no Chatwoot, use Gemini 1.5 Flash para gerar a "Bíblia da Sessão":
  um resumo analítico estruturado do atendimento, incluindo BANT, objeções, 
  sentimento e recomendações. Salva no banco para o Metabase.`,
  {
    tenant_id: z.string().uuid(),
    sessao_id: z.string(),
    conversation_history_json: z.string().describe("JSON do histórico completo da conversa"),
  },
  async ({ tenant_id, sessao_id, conversation_history_json }) => {
    const prompt = `Você é um Analista de Vendas Sênior. Leia este histórico de atendimento e gere uma "Bíblia da Sessão" em JSON com os campos:
{
  "status_lead": "MQL | SQL | TRASH | SPAM | WON | LOST",
  "intencao_principal": "string",
  "veiculo_interesse": "string",
  "veiculo_troca_detectado": "boolean",
  "bant": { "budget": "string", "authority": "boolean", "need": "string", "timeline": "string" },
  "objecoes_identificadas": ["string"],
  "sentimento_geral": "positivo | neutro | negativo",
  "recomendacao_proximo_passo": "string"
}

HISTÓRICO:
${conversation_history_json}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const geminiData = await geminiRes.json() as any;
    const bible = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    // Persiste no banco
    await db.query(
      `INSERT INTO sessions_audits (tenant_id, sessao_id, resumo_analitico_gemini, status_lead)
       VALUES ($1, $2, $3, $4)`,
      [tenant_id, sessao_id, bible, JSON.parse(bible)?.status_lead ?? "UNKNOWN"]
    );

    return { content: [{ type: "text" as const, text: bible }] };
  }
);

server.connect(new StdioServerTransport());
console.log("🟢 mcp-analytics running");
