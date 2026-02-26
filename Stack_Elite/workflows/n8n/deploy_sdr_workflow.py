import requests
import json
import os

N8N_API_URL = "http://localhost:5678/api/v1/workflows"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzN2U4OTE4MS0yMzczLTQyNGEtODk5Mi1kZWYwYTU5NzRlMDQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNzc4Y2UzNjgtNzU2Yi00MDE5LWJkMjYtMjc2MzUzNDY2MzMyIiwiaWF0IjoxNzcyMDQ4NTkwfQ.5w_vY3Uehs9NRWzaFmjrM3sSc6TcaNLAuR-dueV725g"

# The workflow structure for the Elite SDR AI Agent
workflow_data = {
  "name": "SDR Elite - Chatwoot AI Pipeline",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chatwoot-webhook",
        "responseMode": "lastNode",
        "options": {}
      },
      "id": "e4bbf0db-550a-4299-9231-155e975c3db8",
      "name": "Chatwoot Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        250,
        300
      ],
      "webhookId": "sdr-elite-chatwoot-inbound"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT t.id as tenant_id, t.nome_loja, t.tom_de_voz, t.config_json, t.financiamento_policy, t.trade_in_policy FROM tenants t INNER JOIN chatwoot_connections cc ON t.id = cc.tenant_id WHERE cc.chatwoot_account_id = {{$json.body.account.id}} AND cc.chatwoot_inbox_id = {{$json.body.inbox.id}} AND cc.is_active = true;",
        "options": {}
      },
      "id": "e812d6a5-7b1e-450f-90db-3bcca87cf73g",
      "name": "Fetch Tenant Context",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.4,
      "position": [
        280,
        300
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $('Chatwoot Webhook').item.json.body.message_type }}",
              "value2": "incoming"
            }
          ]
        }
      },
      "id": "90eb3e9d-1ec4-4be4-ade6-f84dc6d6eb10",
      "name": "Is Incoming Message?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        500,
        300
      ]
    },
    {
      "parameters": {
        "agent": "conversationalAgent",
        "promptType": "define",
        "text": "={{ $('Chatwoot Webhook').item.json.body.content }}",
        "options": {
          "systemMessage": "Você é o SDR Automotivo de Elite da loja {{ $json.nome_loja }}. Seu tom de voz é: {{ $json.tom_de_voz }}.\n\nO Tenant ID desta loja é: {{ $json.tenant_id }}. OBRIGATÓRIO: sempre forneça este exato 'tenant_id' como parâmetro ao chamar QUALQUER ferramenta (seja de busca de estoque, FIPE, ou ações do Chatwoot).\n\nPolíticas de Venda da Loja:\n- Financiamento: {{ $json.financiamento_policy }}\n- Retoma da Loja: {{ $json.trade_in_policy }}\n\nSeu objetivo é qualificar através da metodologia BANT. Use as ferramentas do Chatwoot para sinalizar que está digitando e se você qualificar ou desqualificar o lead encerre a conversa ou notifique a transferência para um vendedor.\n\nÚltimas mensagens do lead no chat: {{ $('Chatwoot Webhook').item.json.body.conversation.messages }}"
        }
      },
      "id": "f852e93b-e8f0-452f-b4df-6d73c79da5ce",
      "name": "Elite SDR Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.6,
      "position": [
        780,
        280
      ]
    },
    {
      "parameters": {
        "model": "gpt-4o-mini",
        "options": {}
      },
      "id": "18f9d5c4-7264-4d8e-be89-9fc621f37e6f",
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "position": [
        740,
        500
      ]
    },
    {
      "parameters": {},
      "id": "b0f7e4de-e4a0-4b24-954f-5bf06ca8ef87",
      "name": "Window Buffer Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.2,
      "position": [
        920,
        500
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.CHATWOOT_URL }}/api/v1/accounts/1/conversations/{{ $('Chatwoot Webhook').item.json.body.conversation.id }}/messages",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "chatwootApi",
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": "{\n  \"content\": \"{{ $json.output }}\",\n  \"message_type\": \"outgoing\",\n  \"private\": false\n}",
        "options": {}
      },
      "id": "4b5d2fd1-8d26-4b68-b391-729931b6dfb4",
      "name": "Reply to Chatwoot",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        1160,
        280
      ]
    }
  ],
  "connections": {
    "Chatwoot Webhook": {
      "main": [
        [
          {
            "node": "Fetch Tenant Context",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Tenant Context": {
      "main": [
        [
          {
            "node": "Is Incoming Message?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is Incoming Message?": {
      "main": [
        [
          {
            "node": "Elite SDR Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "Elite SDR Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Window Buffer Memory": {
      "ai_memory": [
        [
          {
            "node": "Elite SDR Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "Elite SDR Agent": {
      "main": [
        [
          {
            "node": "Reply to Chatwoot",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}

def deploy_workflow():
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # 1. Check if it already exists to overwrite or create new
    resp = requests.get(N8N_API_URL, headers=headers)
    resp.raise_for_status()
    workflows = resp.json().get('data', [])
    
    existing_id = None
    for wf in workflows:
        if wf['name'] == workflow_data['name']:
            existing_id = wf['id']
            break
            
    if existing_id:
        print(f"Workflow '{workflow_data['name']}' already exists. Updating (ID: {existing_id})...")
        res = requests.put(f"{N8N_API_URL}/{existing_id}", headers=headers, json=workflow_data)
    else:
        print(f"Creating new workflow: '{workflow_data['name']}'...")
        res = requests.post(N8N_API_URL, headers=headers, json=workflow_data)
        
    print(res.text)
    res.raise_for_status()
    print("Success! Workflow deployed:")
    print(json.dumps(res.json(), indent=2))

if __name__ == "__main__":
    deploy_workflow()
