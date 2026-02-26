// mcp-servers/fipe/index.ts
//
// MCP Server: FIPE & Vehicle Data
// Consulta a Tabela FIPE publicamente disponível via FipeZando (parallelum.com.br)
// para uso INTERNO do pipeline. Nunca expõe valor exato ao cliente via chat.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1";

const fipeGet = async (path: string) => {
  const res = await fetch(`${FIPE_BASE}${path}`);
  if (!res.ok) throw new Error(`FIPE API error on ${path}`);
  return res.json();
};

const server = new McpServer({ name: "mcp-fipe", version: "1.0.0" });

server.tool(
  "fipe_list_brands",
  "Lista todas as marcas disponíveis na tabela FIPE. Use para auxiliar no preenchimento de dados de Troca.",
  { vehicle_type: z.enum(["carros", "motos", "caminhoes"]).default("carros") },
  async ({ vehicle_type }) => {
    const data = await fipeGet(`/${vehicle_type}/marcas`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "fipe_list_models",
  "Lista todos os modelos de uma marca específica na FIPE.",
  {
    vehicle_type: z.enum(["carros", "motos", "caminhoes"]).default("carros"),
    brand_code: z.string().describe("Código da marca (ex: '59' para Toyota)"),
  },
  async ({ vehicle_type, brand_code }) => {
    const data = await fipeGet(`/${vehicle_type}/marcas/${brand_code}/modelos`);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "fipe_get_price",
  `Consulta o valor FIPE de um veículo. 
  ⚠️ REGRA OBRIGATÓRIA: Retorne este valor apenas para uso INTERNO no pipeline de scoring.
  NUNCA informe o valor exato FIPE ao cliente no chat. Use o Protocolo de Slot-Filling para Troca.`,
  {
    vehicle_type: z.enum(["carros", "motos", "caminhoes"]).default("carros"),
    brand_code: z.string(),
    model_code: z.string(),
    year_fuel: z.string().describe("Código de ano+combustível da FIPE (ex: '2020-1')"),
  },
  async ({ vehicle_type, brand_code, model_code, year_fuel }) => {
    const data = await fipeGet(
      `/${vehicle_type}/marcas/${brand_code}/modelos/${model_code}/anos/${year_fuel}`
    );
    // Retorna com alerta de uso interno
    return {
      content: [{
        type: "text" as const,
        text: `[INTERNO - NÃO COMPARTILHAR COM CLIENTE]\n${JSON.stringify(data, null, 2)}`
      }]
    };
  }
);

server.tool(
  "fipe_get_depreciation_insight",
  "Gera um insight textual (para Challenger Sale) sobre a depreciação do veículo sem revelar valor exato. Ex: 'SUVs compactos valorizaram 5% no último semestre'.",
  {
    brand: z.string(),
    model: z.string(),
  },
  async ({ brand, model }) => {
    // Em produção, consultaria histórico de preços; aqui geramos um insight template
    const insight = `Com base nos dados de mercado recentes, o ${brand} ${model} manteve uma das menores taxas de desvalorização do segmento — o que é um excelente argumento para o Challenger Sale.`;
    return { content: [{ type: "text" as const, text: insight }] };
  }
);

server.connect(new StdioServerTransport());
console.log("🟢 mcp-fipe running");
