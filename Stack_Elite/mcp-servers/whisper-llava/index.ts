// mcp-servers/whisper-vision/index.ts
//
// MCP Server: Multimodal Perception Layer
// Handles:
//  - Audio transcription via Whisper (local container)
//  - Image analysis via LLaVA/Moondream (local container)
//
// n8n calls this FIRST in the pipeline, before the main agent LLM,
// converting raw media into structured text that feeds GLiNER + the system prompt.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import FormData from "form-data";
import fetch from "node-fetch";

const WHISPER_URL = process.env.WHISPER_URL ?? "http://whisper_api:9000";
const LLAVA_URL   = process.env.LLAVA_URL  ?? "http://llava_api:8006";

const server = new McpServer({ name: "mcp-whisper-llava", version: "1.0.0" });

// ── AUDIO: Whisper Transcription ───────────────────────────────────────────────

server.tool(
  "transcribe_audio",
  `Transcreve uma mensagem de áudio (OGG/MP4) recebida via WhatsApp usando Whisper local.
  O resultado alimenta o GLiNER e o system prompt do LLM.
  O cliente não sabe que o áudio foi transcrito — aja naturalmente.`,
  {
    audio_url: z.string().url().describe("URL pública do áudio (Evolution API / Chatwoot CDN)"),
    language: z.string().default("pt").describe("Idioma esperado"),
    tenant_id: z.string().uuid().describe("Para logging e isolamento"),
  },
  async ({ audio_url, language }) => {
    // 1. Baixar o arquivo de áudio
    const audioRes = await fetch(audio_url);
    if (!audioRes.ok) throw new Error("Falha ao baixar arquivo de áudio");
    const audioBuffer = await audioRes.buffer();

    // 2. Enviar para o container Whisper
    const form = new FormData();
    form.append("audio_file", audioBuffer, { filename: "audio.ogg", contentType: "audio/ogg" });
    form.append("language", language);
    form.append("task", "transcribe");

    const whisperRes = await fetch(`${WHISPER_URL}/asr`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
    if (!whisperRes.ok) throw new Error(`Whisper error: ${whisperRes.status}`);

    const result = await whisperRes.json() as { text: string; language: string };
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          transcription: result.text,
          detected_language: result.language,
          source_type: "AUDIO",
        }, null, 2)
      }]
    };
  }
);

// ── IMAGE: LLaVA Analysis ─────────────────────────────────────────────────────

server.tool(
  "analyze_image",
  `Analisa uma imagem enviada pelo cliente usando LLaVA/Moondream local.
  Casos de uso:
  - Foto de carro de troca (avarias, condição, modelo)
  - Documento (RG, CNH — apenas para detecção de tipo, PII mascarado pelo Presidio)
  - Capturas de tela de propostas de concorrentes
  Use o contexto retornado para personalizar a resposta do agente.`,
  {
    image_url: z.string().url().describe("URL pública da imagem (Evolution API / Chatwoot CDN)"),
    analysis_type: z.enum(["trade_in_vehicle", "document", "general"]).default("general").describe("Contexto esperado da imagem"),
    tenant_id: z.string().uuid(),
  },
  async ({ image_url, analysis_type }) => {
    // Prompt contextual para o modelo de visão
    const prompts: Record<string, string> = {
      trade_in_vehicle:
        "Descreva objetivamente o veículo nesta imagem para um avaliador de concessionária. Inclua: marca, modelo aparente, cor, condição visual da lataria, pára-choques, rodas e interior se visível. Aponte avarias ou destaques. Seja técnico e conciso.",
      document:
        "Esta é uma foto de documento. Identifique apenas o TIPO do documento (RG, CNH, CRLV, etc). Não transcreva nenhum dado pessoal.",
      general:
        "Descreva o que você vê nesta imagem de forma objetiva e útil para um consultor de vendas de automóveis.",
    };

    const llavaRes = await fetch(`${LLAVA_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url, prompt: prompts[analysis_type] }),
    });
    if (!llavaRes.ok) throw new Error(`LLaVA API error: ${llavaRes.status}`);

    const result = await llavaRes.json() as { description: string };
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          llava_description: result.description,
          analysis_type,
          source_type: "IMAGE",
        }, null, 2)
      }]
    };
  }
);

server.connect(new StdioServerTransport());
console.log("🟢 mcp-whisper-llava running");
