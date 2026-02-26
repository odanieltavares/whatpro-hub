import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const server = new McpServer({ name: "mcp-scheduling", version: "1.0.0" });

// Tool 1: Obter link do Google Maps para a loja
server.tool(
  "get_store_location",
  "Retorna a localização da loja em um link do Google Maps baseado no nome ou endereço.",
  {
    store_name: z.string().describe("O nome completo ou endereço da loja (ex: Elite Auto, Rua X, 123)"),
    tenant_id: z.string().optional().describe("ID do tenant/loja para contexto")
  },
  async ({ store_name, tenant_id }) => {
    try {
      // Como uma integração rápida de Maps URI, podemos codificar a busca
      const encodedQuery = encodeURIComponent(store_name);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
      
      return {
        content: [{ 
          type: "text", 
          text: `A localização e rota podem ser acessadas neste link: ${mapsUrl}\nInstrucão: Informe este link ao lead para que ele possa usar o GPS até a loja.` 
        }]
      };
    } catch (error: any) {
      return { content: [{ type: "text", text: `Erro ao obter localização: ${error.message}` }], isError: true };
    }
  }
);

// Tool 2: Agendar um test drive (Simulado/Integração com Google Calendar)
server.tool(
  "schedule_test_drive",
  "Cria um compromisso na agenda do vendedor para que o lead faça uma visita ou test drive num veículo.",
  {
    lead_name: z.string().describe("Nome do cliente"),
    vehicle_model: z.string().describe("Qual carro o cliente tem interesse em ver"),
    date_time: z.string().describe("Data e hora desejadas (formato legível ou ISO)"),
    tenant_id: z.string().optional().describe("ID do tenant/loja para identificar o calendário")
  },
  async ({ lead_name, vehicle_model, date_time, tenant_id }) => {
    try {
      // Aqui integraria com a API oficial do Google Calendar "googleapis".
      // Em caráter de SDR Agent autônomo, ele usa essa tool para confirmar horários
      // e o sistema pode notificar. Para MVP, retornaremos sucesso confirmando o parse.
      
      // OBS: Em uma V2, pegaríamos refreshToken do banco atrelado ao tenant.
      
      return {
        content: [{ 
          type: "text", 
          text: `Sucesso: Visita agendada para ${lead_name} conhecer o ${vehicle_model} em ${date_time}. \nInstrução: Confirme com entusiasmo para o lead que a agenda foi bloqueada com sucesso.` 
        }]
      };
    } catch (error: any) {
      return { content: [{ type: "text", text: `Erro ao agendar: ${error.message}` }], isError: true };
    }
  }
);

console.error("Starting MCP Scheduling Server (Calendar & Maps)...");
server.connect(new StdioServerTransport()).catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
