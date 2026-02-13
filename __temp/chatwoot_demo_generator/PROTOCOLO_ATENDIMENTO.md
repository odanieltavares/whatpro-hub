# 🎫 Sistema de Protocolo de Atendimento - WhatPro Chat

## 📋 O que é Protocolo de Atendimento?

Número único gerado automaticamente para cada conversa, usado para:
- Rastreamento interno
- Referência em follow-ups
- Organização de atendimentos
- Métricas e relatórios

**Exemplo:** `#WP-2024-001234`

---

## 🎯 Onde Implementar o Protocolo

### ✅ **Opção 1: Nota Privada (RECOMENDADO)**

**Vantagens:**
- ✅ Só a equipe vê
- ✅ Não polui a conversa
- ✅ Fácil de consultar
- ✅ Pode ter informações sensíveis

**Exemplo:**
```
📋 PROTOCOLO DE ATENDIMENTO

Protocolo: #WP-2024-001234
Data Abertura: 19/01/2024 14:35
Prioridade: Alta
SLA: Primeira resposta em 5min

---
TRIAGEM AUTOMÁTICA:
✓ Cliente: VIP
✓ Origem: Instagram
✓ Categoria: Pedido
✓ Valor estimado: R$ 1.500,00

---
AÇÕES SUGERIDAS:
→ Atribuir para time de Vendas
→ Responder em até 5 minutos
→ Oferecer desconto VIP (10%)
```

---

### ✅ **Opção 2: Atributo Customizado**

**Vantagens:**
- ✅ Filtrável e pesquisável
- ✅ Aparece no card da conversa
- ✅ Pode ser usado em automações
- ✅ Exportável em relatórios

**Exemplo:**
```json
{
  "custom_attributes": {
    "protocolo": "WP-2024-001234",
    "protocolo_data": "2024-01-19T14:35:00",
    "protocolo_categoria": "Pedido",
    "protocolo_prioridade": "Alta",
    "protocolo_sla": "5min"
  }
}
```

---

### ✅ **Opção 3: Primeira Mensagem Automática**

**Vantagens:**
- ✅ Cliente vê o número
- ✅ Profissionaliza o atendimento
- ✅ Permite rastreamento pelo cliente

**Exemplo:**
```
🤖 Atendimento Automático

Olá! Seu atendimento foi registrado.

📋 Protocolo: #WP-2024-001234
⏰ Horário: 19/01/2024 às 14:35
📍 Posição na fila: 3º

Um de nossos atendentes responderá em breve.
Tempo médio de espera: 5 minutos.
```

---

## 🔧 Implementação no Script

Vou mostrar como adicionar em cada opção:

### **1. Como Nota Privada (Melhor Opção)**

```python
def gerar_protocolo(conversa_id: int, data_abertura: datetime) -> str:
    """Gera protocolo único"""
    ano = data_abertura.year
    numero = str(conversa_id).zfill(6)
    return f"WP-{ano}-{numero}"

def criar_nota_protocolo(self, conv_id: int, contato: Dict, agente: Dict):
    """Cria nota privada com protocolo de atendimento"""
    
    data_abertura = datetime.now()
    protocolo = self.gerar_protocolo(conv_id, data_abertura)
    
    # Determinar prioridade baseada em atributos
    prioridade = "Alta" if contato.get('tipo') == 'VIP' else "Normal"
    
    # Determinar categoria
    categoria = self._inferir_categoria(contato)
    
    # Calcular SLA
    sla = "5 min" if prioridade == "Alta" else "15 min"
    
    # Gerar nota
    nota = f"""📋 PROTOCOLO DE ATENDIMENTO

Protocolo: #{protocolo}
Data Abertura: {data_abertura.strftime('%d/%m/%Y %H:%M')}
Prioridade: {prioridade}
SLA: Primeira resposta em {sla}

---
TRIAGEM AUTOMÁTICA:
✓ Cliente: {contato.get('custom_attributes', {}).get('tipo_cliente', 'Padrão')}
✓ Origem: {contato.get('custom_attributes', {}).get('origem', 'Desconhecida')}
✓ Categoria: {categoria}
✓ Agente Atribuído: {agente.get('nome', 'Não atribuído')}

---
HISTÓRICO:
• Primeira interação: Sim
• Compras anteriores: {self._verificar_compras(contato)}
• Última interação: N/A

---
AÇÕES SUGERIDAS:
→ Responder saudação padrão
→ Identificar necessidade
→ {self._sugerir_acao(categoria)}
"""
    
    # Adicionar como mensagem privada
    self._adicionar_mensagem(conv_id, nota, "outgoing", private=True)
    
    return protocolo
```

---

### **2. Como Atributo Customizado**

```python
def criar_conversa_com_protocolo(self, template: Dict, inbox_id: int, 
                                 contato: Dict, agente: Dict):
    """Cria conversa com protocolo nos atributos"""
    
    data_abertura = datetime.now()
    
    # Criar conversa base
    conv_data = {
        "inbox_id": inbox_id,
        "contact_id": contato['id'],
        "status": "open",
        "assignee_id": agente['id'],
        "custom_attributes": {
            "protocolo": f"WP-{data_abertura.year}-{str(contato['id']).zfill(6)}",
            "protocolo_data": data_abertura.isoformat(),
            "protocolo_categoria": self._inferir_categoria(contato),
            "protocolo_prioridade": "Alta" if contato.get('tipo') == 'VIP' else "Normal",
            "protocolo_sla_inicio": data_abertura.isoformat(),
            "protocolo_sla_meta": (data_abertura + timedelta(minutes=5)).isoformat()
        }
    }
    
    response = self._fazer_request('POST', '/conversations', conv_data)
    return response.json()
```

---

### **3. Como Mensagem Automática**

```python
def enviar_mensagem_protocolo(self, conv_id: int, protocolo: str):
    """Envia mensagem automática com protocolo para o cliente"""
    
    hora = datetime.now().strftime('%H:%M')
    data = datetime.now().strftime('%d/%m/%Y')
    
    mensagem = f"""🤖 Atendimento Automático

Olá! Seu atendimento foi registrado com sucesso.

📋 Protocolo: #{protocolo}
📅 Data: {data}
⏰ Horário: {hora}
📍 Posição na fila: {random.randint(1, 5)}º

Um de nossos atendentes responderá em breve.
⏱️ Tempo médio de espera: 5 minutos

Guarde este número para futuras referências!
"""
    
    self._adicionar_mensagem(conv_id, mensagem, "outgoing", private=False)
```

---

## 🎨 Formatos de Protocolo

### **Formato Simples**
```
WP-001234
```

### **Formato com Ano**
```
WP-2024-001234
```

### **Formato com Data Completa**
```
WP-20240119-001234
```

### **Formato Categorizad**
```
VEN-2024-001234  (Vendas)
SUP-2024-001234  (Suporte)
POS-2024-001234  (Pós-venda)
```

### **Formato com Prefixo do Nicho**
```
ECOM-2024-001234  (E-commerce)
CONT-2024-001234  (Contabilidade)
CONC-2024-001234  (Concessionária)
```

---

## 📊 Informações no Protocolo

### **Dados Básicos (Sempre)**
```
- Número do protocolo
- Data e hora de abertura
- Canal de origem (WhatsApp, Site, Instagram)
```

### **Dados de Triagem (Recomendado)**
```
- Categoria do atendimento
- Prioridade (Baixa, Média, Alta, Urgente)
- Time responsável
- Agente atribuído
- SLA aplicável
```

### **Dados Contextuais (Opcional)**
```
- Tipo de cliente (Novo, VIP, Recorrente)
- Valor estimado da oportunidade
- Histórico de interações
- Score do lead
- Última compra/interação
```

### **Dados Preditivos (Avançado)**
```
- Tempo estimado de resolução
- Sugestões de resposta
- Produtos relacionados
- Ofertas personalizadas
- Risco de churn
```

---

## 🤖 Automações com Protocolo

### **Exemplo 1: Auto-priorizar por Protocolo**

```python
{
  "name": "Priorizar VIPs automaticamente",
  "event": "conversation_created",
  "conditions": [
    {
      "attribute_key": "custom_attributes.protocolo_prioridade",
      "filter_operator": "equal_to",
      "values": ["Alta"]
    }
  ],
  "actions": [
    {
      "action_name": "change_priority",
      "action_params": ["urgent"]
    },
    {
      "action_name": "add_label",
      "action_params": ["vip-atendimento"]
    }
  ]
}
```

### **Exemplo 2: Notificar por Categoria**

```python
{
  "name": "Notificar vendas sobre leads quentes",
  "event": "conversation_created",
  "conditions": [
    {
      "attribute_key": "custom_attributes.protocolo_categoria",
      "filter_operator": "equal_to",
      "values": ["Venda"]
    }
  ],
  "actions": [
    {
      "action_name": "assign_team",
      "action_params": [team_vendas_id]
    },
    {
      "action_name": "send_message",
      "action_params": ["🎯 Novo lead! Atenda em até 5 minutos."]
    }
  ]
}
```

---

## 📝 Template Completo de Nota de Protocolo

```python
TEMPLATE_NOTA_PROTOCOLO = """
╔════════════════════════════════════════════════════════════╗
║        📋 PROTOCOLO DE ATENDIMENTO AUTOMÁTICO              ║
╚════════════════════════════════════════════════════════════╝

🔢 IDENTIFICAÇÃO
   Protocolo: #{protocolo}
   Data/Hora: {data} às {hora}
   Canal: {canal}
   
👤 INFORMAÇÕES DO CLIENTE
   Nome: {nome_cliente}
   Tipo: {tipo_cliente}
   Histórico: {historico}
   Score: {score_lead}
   
📊 TRIAGEM AUTOMÁTICA
   Categoria: {categoria}
   Prioridade: {prioridade}
   SLA: {sla_tempo}
   Time: {time_responsavel}
   Agente: {agente_atribuido}
   
💰 OPORTUNIDADE
   Valor Estimado: {valor_estimado}
   Produto/Serviço: {produto_interesse}
   Probabilidade: {probabilidade_conversao}
   
⏱️ MÉTRICAS DE TEMPO
   Primeira Resposta: Meta de {sla_primeira_resposta}
   Resolução: Meta de {sla_resolucao}
   Tempo em Fila: {tempo_fila}
   
🎯 AÇÕES SUGERIDAS
   → {acao_1}
   → {acao_2}
   → {acao_3}
   
📌 OBSERVAÇÕES
   {observacoes_adicionais}

═══════════════════════════════════════════════════════════════
Sistema: WhatPro Chat | Gerado automaticamente em {timestamp}
═══════════════════════════════════════════════════════════════
"""
```

---

## 🎯 Implementação Recomendada

Para suas demos, sugiro usar **TODAS as 3 opções combinadas**:

### **1. Nota Privada** (informações completas)
- Protocolo detalhado
- Triagem automática
- Sugestões de ação
- Só equipe vê

### **2. Atributo Customizado** (dados estruturados)
- Número do protocolo
- Categoria
- Prioridade
- Usado em automações e filtros

### **3. Mensagem ao Cliente** (transparência)
- Número de protocolo
- Confirmação de registro
- Expectativa de tempo

---

## 💻 Código Completo de Exemplo

Vou criar um módulo completo que você pode adicionar ao script:

```python
# protocolo_atendimento.py

import random
from datetime import datetime, timedelta
from typing import Dict, Optional

class ProtocoloAtendimento:
    """Sistema de protocolo de atendimento automático"""
    
    def __init__(self, prefixo: str = "WP"):
        self.prefixo = prefixo
        self.contador = 1000  # Começa em 1000 para parecer mais estabelecido
        
    def gerar_numero(self, conv_id: Optional[int] = None) -> str:
        """Gera número único de protocolo"""
        ano = datetime.now().year
        numero = conv_id if conv_id else self.contador
        self.contador += 1
        
        return f"{self.prefixo}-{ano}-{str(numero).zfill(6)}"
    
    def inferir_categoria(self, mensagem: str, atributos: Dict) -> str:
        """Infere categoria baseada em keywords"""
        mensagem_lower = mensagem.lower()
        
        keywords = {
            "Venda": ["comprar", "preço", "quanto custa", "orçamento"],
            "Suporte": ["problema", "erro", "não funciona", "ajuda"],
            "Pós-Venda": ["troca", "devolução", "garantia", "defeito"],
            "Informação": ["horário", "endereço", "como", "quando"],
            "Reclamação": ["insatisfeito", "reclamar", "péssimo", "horrível"]
        }
        
        for categoria, palavras in keywords.items():
            if any(palavra in mensagem_lower for palavra in palavras):
                return categoria
        
        return "Geral"
    
    def calcular_prioridade(self, contato: Dict) -> str:
        """Calcula prioridade do atendimento"""
        tipo_cliente = contato.get('custom_attributes', {}).get('tipo_cliente', '')
        
        if tipo_cliente == 'VIP':
            return "Urgente"
        elif tipo_cliente == 'Recorrente':
            return "Alta"
        elif tipo_cliente == 'Novo':
            return "Normal"
        else:
            return "Baixa"
    
    def definir_sla(self, prioridade: str) -> Dict[str, int]:
        """Define SLA baseado na prioridade"""
        slas = {
            "Urgente": {"primeira_resposta": 2, "resolucao": 30},
            "Alta": {"primeira_resposta": 5, "resolucao": 60},
            "Normal": {"primeira_resposta": 15, "resolucao": 240},
            "Baixa": {"primeira_resposta": 30, "resolucao": 1440}
        }
        
        return slas.get(prioridade, slas["Normal"])
    
    def gerar_nota_completa(self, protocolo: str, conv_id: int, 
                           contato: Dict, mensagem_inicial: str,
                           agente: Optional[Dict] = None,
                           time: Optional[Dict] = None) -> str:
        """Gera nota privada completa de protocolo"""
        
        agora = datetime.now()
        categoria = self.inferir_categoria(mensagem_inicial, contato.get('custom_attributes', {}))
        prioridade = self.calcular_prioridade(contato)
        sla = self.definir_sla(prioridade)
        
        # Inferir valor estimado
        valores_por_categoria = {
            "Venda": f"R$ {random.randint(500, 5000):,.2f}",
            "Pós-Venda": f"R$ {random.randint(100, 1000):,.2f}",
            "Suporte": "N/A",
            "Informação": "N/A",
            "Reclamação": f"R$ {random.randint(200, 2000):,.2f} (retenção)"
        }
        
        valor_estimado = valores_por_categoria.get(categoria, "N/A")
        
        # Sugerir ações
        acoes_por_categoria = {
            "Venda": [
                "Identificar produto de interesse",
                "Apresentar opções disponíveis",
                "Oferecer desconto se VIP"
            ],
            "Suporte": [
                "Entender o problema detalhadamente",
                "Buscar solução na base de conhecimento",
                "Escalar para técnico se necessário"
            ],
            "Pós-Venda": [
                "Verificar políticas de troca/devolução",
                "Solicitar fotos/evidências",
                "Iniciar processo conforme política"
            ],
            "Reclamação": [
                "Ouvir atentamente sem interromper",
                "Demonstrar empatia",
                "Oferecer solução imediata"
            ]
        }
        
        acoes = acoes_por_categoria.get(categoria, ["Atender com cordialidade", "Identificar necessidade"])
        
        nota = f"""╔════════════════════════════════════════════════════════════╗
║        📋 PROTOCOLO DE ATENDIMENTO AUTOMÁTICO              ║
╚════════════════════════════════════════════════════════════╝

🔢 IDENTIFICAÇÃO
   Protocolo: #{protocolo}
   Data/Hora: {agora.strftime('%d/%m/%Y')} às {agora.strftime('%H:%M')}
   Canal: {contato.get('custom_attributes', {}).get('origem', 'Website')}
   
👤 INFORMAÇÕES DO CLIENTE
   Nome: {contato.get('name', 'N/A')}
   Email: {contato.get('email', 'N/A')}
   Telefone: {contato.get('phone_number', 'N/A')}
   Tipo: {contato.get('custom_attributes', {}).get('tipo_cliente', 'Padrão')}
   Score: {random.choice(['🔴 Frio', '🟡 Morno', '🟢 Quente'])}
   
📊 TRIAGEM AUTOMÁTICA
   Categoria: {categoria}
   Prioridade: {prioridade}
   SLA 1ª Resposta: {sla['primeira_resposta']} minutos
   SLA Resolução: {sla['resolucao']} minutos
   Time: {time.get('nome', 'Não atribuído') if time else 'Geral'}
   Agente: {agente.get('nome', 'Aguardando') if agente else 'Em fila'}
   
💰 OPORTUNIDADE
   Valor Estimado: {valor_estimado}
   Categoria de Produto: {contato.get('custom_attributes', {}).get('categoria_interesse', 'A identificar')}
   Probabilidade: {random.choice(['20%', '50%', '80%'])}
   
⏱️ MÉTRICAS DE TEMPO
   Criação: {agora.strftime('%H:%M:%S')}
   Meta 1ª Resposta: {(agora + timedelta(minutes=sla['primeira_resposta'])).strftime('%H:%M:%S')}
   Meta Resolução: {(agora + timedelta(minutes=sla['resolucao'])).strftime('%H:%M:%S')}
   Posição na Fila: {random.randint(1, 5)}º
   
🎯 AÇÕES SUGERIDAS
   → {acoes[0]}
   → {acoes[1] if len(acoes) > 1 else 'Manter cliente informado'}
   → {acoes[2] if len(acoes) > 2 else 'Registrar conclusão'}
   
📝 MENSAGEM INICIAL DO CLIENTE
   "{mensagem_inicial[:200]}{'...' if len(mensagem_inicial) > 200 else ''}"
   
📌 OBSERVAÇÕES
   • Primeira interação: {'Sim' if not contato.get('conversations_count') else 'Não'}
   • Histórico de compras: {random.choice(['Nenhuma', '1-2 compras', '3+ compras'])}
   • Última interação: {random.choice(['Nunca', '7 dias atrás', '30 dias atrás'])}

═══════════════════════════════════════════════════════════════
Sistema: WhatPro Chat | Gerado automaticamente
Data: {agora.strftime('%d/%m/%Y %H:%M:%S')}
═══════════════════════════════════════════════════════════════
"""
        
        return nota
    
    def gerar_mensagem_cliente(self, protocolo: str, prioridade: str) -> str:
        """Gera mensagem automática para o cliente"""
        
        agora = datetime.now()
        sla = self.definir_sla(prioridade)
        posicao = random.randint(1, 5)
        
        mensagem = f"""🤖 **Atendimento Automático**

Olá! Seu atendimento foi registrado com sucesso.

📋 **Protocolo:** #{protocolo}
📅 **Data:** {agora.strftime('%d/%m/%Y')}
⏰ **Horário:** {agora.strftime('%H:%M')}
📍 **Posição na fila:** {posicao}º

---

Um de nossos atendentes responderá em breve.

⏱️ **Tempo médio de espera:** {sla['primeira_resposta']} minutos

💡 **Dica:** Guarde este número de protocolo para futuras referências!

Obrigado pela preferência! 😊
"""
        
        return mensagem
```

---

## 🚀 Como Usar no Script

Adicione ao `gerar_demo_pro.py`:

```python
from protocolo_atendimento import ProtocoloAtendimento

# No __init__:
self.protocolo_sistema = ProtocoloAtendimento(prefixo="WP")

# Ao criar conversa:
def criar_conversas_com_protocolo(self, ...):
    # ... criar conversa normal ...
    
    # Gerar protocolo
    protocolo = self.protocolo_sistema.gerar_numero(conv_id)
    
    # Adicionar como atributo
    self._fazer_request('PUT', f'/conversations/{conv_id}', {
        'custom_attributes': {
            'protocolo': protocolo,
            'protocolo_prioridade': prioridade,
            'protocolo_categoria': categoria
        }
    })
    
    # Criar nota privada
    nota = self.protocolo_sistema.gerar_nota_completa(
        protocolo, conv_id, contato, primeira_mensagem, agente, time
    )
    self._adicionar_nota_privada(conv_id, nota)
    
    # Enviar mensagem ao cliente (opcional)
    msg_cliente = self.protocolo_sistema.gerar_mensagem_cliente(protocolo, prioridade)
    self._adicionar_mensagem(conv_id, msg_cliente, "outgoing")
```

---

**Desenvolvido para WhatPro Chat**

🎫 Sistema completo de protocolo de atendimento automático!
