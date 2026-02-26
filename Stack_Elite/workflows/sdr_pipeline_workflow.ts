// n8n Workflow: SDR Elite Multimodal Pipeline
// Este arquivo é pseudocódigo comentado representando a lógica do JSON do n8n.
// Para importar: Converta para JSON real no n8n usando os nomes de nó abaixo.
//
// FLUXO: Webhook → Percepção Multimodal → Segurança (paralelo) →
//         GLiNER NER → RAG Stock → LLM (GPT-4o-mini) → Split + Delay → Send
//         └── Handoff se SQL | Agendamento | Follow-up

// ══════════════════════════════════════════════════════════════════════════════
// NÓ 0: Webhook Trigger
// ══════════════════════════════════════════════════════════════════════════════
// Type: Webhook
// Method: POST
// Path: /sdr-webhook
// Auth: Header "X-Webhook-Secret" == {{ $env.WEBHOOK_SECRET }}
// Output: Passa o body do Chatwoot como { json }

const n8nWorkflowPseudocode = `
WORKFLOW: SDR Elite Multimodal Pipeline
VERSION: 1.0.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1: ENTRADA E FILTRAGEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 1: Chatwoot Webhook]
  type: Webhook
  auth: secret_header
  → output: { event, conversation, message, sender, account }

[NÓ 2: Filter (Code Node)]
  // Descarta eventos desnecessários
  if event !== 'message_created': STOP
  if message.type !== 'incoming': STOP
  if conversation.status === 'resolved': STOP
  if sender.type === 'agent_bot': STOP  // Evita loop do próprio bot
  
  // Extrai dados essenciais
  → output: {
      tenant_id,         // Do custom field da conta Chatwoot
      conversation_id,
      contact_id,
      sessao_id,         // phone ou conversa id
      message_text,
      message_type,      // 'text' | 'audio' | 'image' | 'sticker'
      media_url,         // Se audio/imagem
    }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2: PERCEPÇÃO MULTIMODAL (Paralela)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 3: Switch — Tipo de Mídia]
  CASE 'audio':
    → [NÓ 3a: MCP Tool: transcribe_audio]
        server: mcp-whisper-vision
        tool: transcribe_audio
        params: { audio_url: media_url, language: "pt", tenant_id }
        → output: { transcription, source_type: "AUDIO" }
  
  CASE 'image':
    → [NÓ 3b: MCP Tool: analyze_image]
        server: mcp-whisper-vision
        tool: analyze_image
        params: { image_url: media_url, analysis_type: "trade_in_vehicle", tenant_id }
        → output: { vision_description, source_type: "IMAGE" }
  
  DEFAULT:
    → output: { transcription: message_text, source_type: "TEXT" }

[NÓ 4: Merge — Unifica Percepção]
  // Combina saída do Switch
  → output: { enriched_text, source_type }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3: SEGURANÇA E QUALIDADE (Paralelo)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 5: Parallel Branch]
  
  BRANCH A: [HTTP: TextStat Service]
    POST http://security_api:8000/spam-check
    body: { text: enriched_text }
    → output: { is_spam: bool, spam_score: float }
  
  BRANCH B: [HTTP: Presidio PII Mask]
    POST http://security_api:8000/mask-pii
    body: { text: enriched_text, language: "pt" }
    → output: { masked_text, entities_found: ["CPF", "PHONE", ...] }
  
  BRANCH C: [HTTP: Sentiment Analysis]
    POST http://sentiment_api:8000/analyze
    body: { text: enriched_text }
    → output: { sentiment: "positive|neutral|negative", score: 0.0-1.0 }

[NÓ 6: IF — Spam Check]
  IF spam_score > 0.9:
    STOP (descarta mensagem silenciosamente)

[NÓ 7: IF — Anger/Urgency SLA]
  IF sentiment === 'negative' AND score > 0.8:
    → [NÓ 7a: MCP Tool: chatwoot_assign_conversation]
        Transfere IMEDIATAMENTE para time de suporte
        → [NÓ 7b: MCP Tool: chatwoot_apply_labels]
            labels: ["SLA_CRITICO", "Alto_Risco"]
    STOP (saída do pipeline principal)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 4: INTELIGÊNCIA ESTRUTURADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 8: HTTP — GLiNER NER]
  POST http://gliner_api:8000/extract
  body: {
    text: masked_text,
    labels: $tenant.gliner_active_labels,
    threshold: 0.5
  }
  → output: {
      INTENCAO: "COMPRA_0KM" | "SEMINOVO" | "TROCA" | "SIMULACAO",
      VEICULO_INTERESSE: "Corolla Cross",
      VEICULO_TROCA: "HB20 2019",
      ORCAMENTO: "até 80 mil",
      CONDICAO_VEICULO: "bom estado",
    }

[NÓ 9: MCP Tool — Get Conversation History]
  server: mcp-chatwoot-elite
  tool: chatwoot_get_history
  params: { conversation_id, limit: 15 }
  → output: [{ role, content }] (array de mensagens)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 5: RAG — RECUPERAÇÃO SEMÂNTICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 10: MCP Tool — Stock Semantic Search]
  server: mcp-stock
  tool: stock_semantic_search
  params: {
    tenant_id,
    query: VEICULO_INTERESSE + " " + ORCAMENTO,
    top_k: 3
  }
  → output: [{ marca, modelo, versao, preco, fotos_urls }] (top 3)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 6: SCORING (Background, não bloqueia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 11: MCP Tool — Calculate Score]
  server: mcp-scoring
  tool: scoring_calculate
  params: {
    tenant_id, sessao_id,
    has_trade_in: VEICULO_TROCA !== null,
    knows_budget: ORCAMENTO !== null,
    has_specific_model: VEICULO_INTERESSE !== null,
    sent_audio: source_type === "AUDIO",
    sent_photo: source_type === "IMAGE",
  }
  → output: { score, classification, next_actions }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 7: GERAÇÃO LLM + OBSERVABILIDADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 12: MCP Tool — Create LangFuse Trace]
  server: mcp-analytics
  tool: analytics_create_trace
  params: { tenant_id, sessao_id, name: "sdr_response" }
  → output: { trace_id }

[NÓ 13: Code Node — Build Mega Prompt]
  // Injeta todas as variáveis no System Prompt template
  systemPrompt = template.replace({
    {{nome_loja}}: tenant.nome_loja,
    {{tom_de_voz}}: tenant.tom_de_voz,
    {{gliner_entities_json}}: JSON.stringify(glinerOutput),
    {{vehicle_inventory_matches_json}}: JSON.stringify(stockMatches),
    {{financiamento_policy}}: JSON.stringify(tenant.financiamento_policy),
    {{AUDIO_USER_TRANSCRIPTION}}: source_type === "AUDIO" ? transcription : "",
    {{IMAGE_VISION_DESCRIPTION}}: source_type === "IMAGE" ? vision_description : "",
  })

[NÓ 14: OpenAI Chat Node — GPT-4o-mini]
  model: gpt-4o-mini
  system_prompt: systemPrompt
  messages: conversationHistory + [{ role: "user", content: enriched_text }]
  max_tokens: 600
  temperature: 0.7
  langfuse_trace_id: trace_id   // Header X-Langfuse-Trace-Id
  → output: { response_text, usage: { prompt_tokens, completion_tokens } }

[NÓ 15: MCP Tool — Log Token Usage]
  server: mcp-analytics
  tool: analytics_log_token_usage
  params: { tenant_id, sessao_id, langfuse_trace_id, llm_model: "gpt-4o-mini", ...usage }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 8: ENTREGA HUMANIZADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 16: Code Node — Message Splitter]
  // Divide a resposta em mensagens curtas (max 300 chars)
  messages = splitByParagraph(response_text, maxLen=300)
  → output: [{ text, index }] (array)

[NÓ 17: Loop — For Each Message]
  [NÓ 17a: MCP Tool: chatwoot_send_message]  // typing indicator
      server: mcp-chatwoot-elite
      message: TYPING_INDICATOR (status update)

  [NÓ 17b: Wait Node]
      duration: random(2000, 5000) ms  // Humanização
  
  [NÓ 17c: MCP Tool: chatwoot_send_message]
      server: mcp-chatwoot-elite
      tool: chatwoot_send_message
      params: { conversation_id, message: text, message_type: "outgoing" }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 9: PÓS-RESPOSTA (Ações automáticas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[NÓ 18: MCP Tool — Update Contact Attributes]
  server: mcp-chatwoot-elite
  tool: chatwoot_update_contact_attributes
  params: {
    contact_id,
    custom_attributes: {
      veiculo_interesse: VEICULO_INTERESSE,
      veiculo_troca_modelo: VEICULO_TROCA,
      lead_score: score,
      classificacao: classification,
    }
  }

[NÓ 19: IF — SQL Threshold]
  IF classification === 'sql':
    → [NÓ 19a: MCP Tool: chatwoot_apply_labels]
        labels: ["SQL", "Alta_Intencao"]
    
    → [NÓ 19b: MCP Tool: chatwoot_assign_conversation]
        team_id: tenant.handoff_team_id
    
    → [NÓ 19c: MCP Tool: chatwoot_send_message (Private Note)]
        private: true
        message: BANT briefing gerado pelo LLM
    
    → [NÓ 19d: MCP Tool: scoring_log_event]
        event_type: "handoff_initiated"
  
  IF classification === 'mql':
    → [NÓ 19e: MCP Tool: chatwoot_apply_labels]
        labels: ["MQL"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUB-WORKFLOW: FECHAMENTO (Trigger: conversation resolved)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[TRIGGER: Chatwoot Webhook — conversation.status_changed = resolved]

[NÓ FW1: MCP Tool: chatwoot_get_history (full)]
  params: { conversation_id, limit: 100 }

[NÓ FW2: MCP Tool: analytics_generate_audit_bible]
  // Chama Gemini 1.5 Flash para gerar a "Bíblia da Sessão"
  params: { tenant_id, sessao_id, conversation_history_json }
  → Salva no Postgres → aparece no Metabase

END OF WORKFLOW
`;

// Exporta como string para ser usado como documentação
export default n8nWorkflowPseudocode;
