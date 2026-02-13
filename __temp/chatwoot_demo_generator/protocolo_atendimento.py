#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo de Protocolo de Atendimento Automático
Gera protocolos únicos e notas detalhadas para cada conversa
"""

import random
from datetime import datetime, timedelta
from typing import Dict, Optional, List

class ProtocoloAtendimento:
    """Sistema de protocolo de atendimento automático"""
    
    def __init__(self, prefixo: str = "WP"):
        self.prefixo = prefixo
        self.contador = 1000
        
    def gerar_numero(self, conv_id: Optional[int] = None) -> str:
        """Gera número único de protocolo"""
        ano = datetime.now().year
        numero = conv_id if conv_id else self.contador
        self.contador += 1
        
        return f"{self.prefixo}-{ano}-{str(numero).zfill(6)}"
    
    def inferir_categoria(self, mensagem: str, atributos: Dict) -> str:
        """Infere categoria baseada em keywords"""
        if not mensagem:
            return "Geral"
            
        mensagem_lower = mensagem.lower()
        
        keywords = {
            "Venda": ["comprar", "preço", "quanto custa", "orçamento", "valor", "produto"],
            "Suporte": ["problema", "erro", "não funciona", "ajuda", "bug", "suporte"],
            "Pós-Venda": ["troca", "devolução", "garantia", "defeito", "devolver"],
            "Informação": ["horário", "endereço", "como", "quando", "onde", "informação"],
            "Reclamação": ["insatisfeito", "reclamar", "péssimo", "horrível", "ruim"],
            "Agendamento": ["agendar", "marcar", "consulta", "reserva", "horário"],
            "Cancelamento": ["cancelar", "desistir", "não quero", "cancela"]
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
        """Define SLA baseado na prioridade (minutos)"""
        slas = {
            "Urgente": {"primeira_resposta": 2, "resolucao": 30},
            "Alta": {"primeira_resposta": 5, "resolucao": 60},
            "Normal": {"primeira_resposta": 15, "resolucao": 240},
            "Baixa": {"primeira_resposta": 30, "resolucao": 1440}
        }
        
        return slas.get(prioridade, slas["Normal"])
    
    def gerar_nota_completa(self, protocolo: str, conv_id: int, 
                           contato: Dict, mensagem_inicial: str = "",
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
            "Reclamação": f"R$ {random.randint(200, 2000):,.2f} (retenção)",
            "Agendamento": "N/A",
            "Cancelamento": f"R$ {random.randint(300, 3000):,.2f} (risco)"
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
            ],
            "Agendamento": [
                "Verificar disponibilidade",
                "Confirmar dados do cliente",
                "Enviar confirmação"
            ],
            "Cancelamento": [
                "Entender motivo do cancelamento",
                "Oferecer alternativas",
                "Se persistir, processar cancelamento"
            ]
        }
        
        acoes = acoes_por_categoria.get(categoria, [
            "Atender com cordialidade",
            "Identificar necessidade",
            "Oferecer solução adequada"
        ])
        
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
   Categoria: {contato.get('custom_attributes', {}).get('categoria_interesse', 'A identificar')}
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
   "{mensagem_inicial[:200] if mensagem_inicial else 'Aguardando primeira mensagem'}{'...' if len(mensagem_inicial) > 200 else ''}"
   
📌 OBSERVAÇÕES
   • Primeira interação: Sim
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

───────────────────────────

Um de nossos atendentes responderá em breve.

⏱️ **Tempo médio de espera:** {sla['primeira_resposta']} minutos

💡 **Dica:** Guarde este número de protocolo para futuras referências!

Obrigado pela preferência! 😊
"""
        
        return mensagem
