// mcp-servers/stock/index.ts
//
// MCP Server: Stock — Consulta de Estoque com Busca Semântica (pgvector RAG)
// Usa FastEmbed local (via RAG Service API) para vetorizar a query,
// busca no pgvector filtrando SEMPRE por tenant_id, e reranqueia com BGE.
//
// REGRA RÍGIDA: Só retorna veículos com status = 'DISPONIVEL'

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL ?? "http://rag_api:8000";

const server = new McpServer({ name: "mcp-stock", version: "1.0.0" });

// ── Core: Busca Semântica ───────────────────────────────────────────────────────

server.tool(
  "stock_semantic_search",
  `Busca semântica no estoque de veículos disponíveis usando pgvector.
  Filtra OBRIGATORIAMENTE por tenant_id e status='DISPONIVEL'.
  Retorna os TOP 3 melhores matches para o LLM usar no prompt.`,
  {
    tenant_id: z.string().uuid(),
    query: z.string().describe("Texto da intenção do cliente (ex: 'SUV preto automático até 80k')"),
    top_k: z.number().default(3),
  },
  async ({ tenant_id, query, top_k }) => {
    // 1. Vetorizar a query via RAG service (FastEmbed local)
    const embedRes = await fetch(`${RAG_SERVICE_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query }),
    });
    const { vector } = await embedRes.json() as { vector: number[] };

    // 2. Buscar no pgvector com isolamento por tenant_id
    const result = await db.query(
      `SELECT id, marca, modelo, versao, ano_modelo, cor, preco, preco_por_extenso,
              quilometragem, fotos_urls, descricao_tecnica,
              1 - (veiculo_vetor <=> $1::vector) as similarity
       FROM vehicles
       WHERE tenant_id = $2 AND status = 'DISPONIVEL'
       ORDER BY veiculo_vetor <=> $1::vector
       LIMIT $3`,
      [`[${vector.join(",")}]`, tenant_id, top_k]
    );

    if (result.rows.length === 0) {
      return { content: [{ type: "text" as const, text: "Nenhum veículo disponível encontrado para esta busca." }] };
    }

    // 3. Reranquear via BGE-Reranker
    const rerankRes = await fetch(`${RAG_SERVICE_URL}/rerank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, documents: result.rows }),
    });
    const { reranked } = await rerankRes.json() as { reranked: any[] };

    return { content: [{ type: "text" as const, text: JSON.stringify(reranked, null, 2) }] };
  }
);

server.tool(
  "stock_get_vehicle_details",
  "Retorna detalhes completos de um veículo específico pelo ID. Use para montar a resposta ao cliente.",
  {
    vehicle_id: z.string().uuid(),
    tenant_id: z.string().uuid().describe("Obrigatório para isolamento multi-tenant"),
  },
  async ({ vehicle_id, tenant_id }) => {
    const result = await db.query(
      "SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2 AND status = 'DISPONIVEL'",
      [vehicle_id, tenant_id]
    );
    if (result.rows.length === 0) {
      return { content: [{ type: "text" as const, text: "Veículo não encontrado ou não disponível." }] };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result.rows[0], null, 2) }] };
  }
);

server.tool(
  "stock_find_similar",
  "Quando o carro solicitado não está disponível, busca o modelo mais similar no estoque. Cumpre a regra anti-alucinação.",
  {
    tenant_id: z.string().uuid(),
    unavailable_model: z.string().describe("Modelo que o cliente queria mas não está disponível"),
    top_k: z.number().default(2),
  },
  async ({ tenant_id, unavailable_model, top_k }) => {
    const embedRes = await fetch(`${RAG_SERVICE_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `similar to ${unavailable_model}` }),
    });
    const { vector } = await embedRes.json() as { vector: number[] };

    const result = await db.query(
      `SELECT marca, modelo, versao, ano_modelo, preco, status
       FROM vehicles WHERE tenant_id = $1 AND status = 'DISPONIVEL'
       ORDER BY veiculo_vetor <=> $2::vector LIMIT $3`,
      [tenant_id, `[${vector.join(",")}]`, top_k]
    );

    const suggestion = result.rows.length > 0
      ? `Não tenho o ${unavailable_model} disponível agora, mas tenho opções muito similares: ${result.rows.map(r => `${r.marca} ${r.modelo} ${r.ano_modelo}`).join(", ")}.`
      : `No momento não temos o ${unavailable_model} em estoque. Posso te cadastrar na fila de espera?`;

    return { content: [{ type: "text" as const, text: suggestion }] };
  }
);

server.connect(new StdioServerTransport());
console.log("🟢 mcp-stock running");
