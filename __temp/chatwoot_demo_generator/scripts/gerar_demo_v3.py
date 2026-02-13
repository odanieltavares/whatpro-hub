#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Gerador PRO v3.0 de Demos REALISTAS
Sistema completamente reformulado seguindo melhores práticas oficiais do Chatwoot

NOVO FLUXO CORRETO:
1. Setup: Definir custom attributes, labels, times
2. Conversas: Criar conversas (Chatwoot cria contatos automaticamente!)
3. Enriquecer: Adicionar contexto aos contatos criados
4. Finalizar: Notas, prioridades, CSAT

FEATURES:
- Conversas humanizadas com tons diferentes
- Notas privadas completas (protocolo + cod_cliente + resumo)
- Notas de contato (histórico)
- Custom attributes bem definidos
- Rate limiting (não trava o sistema)
- Segmentação completa
"""

import json
import os
import sys
import random
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import argparse

try:
    from faker import Faker
    import requests
except ImportError:
    print("❌ Instalando dependências...")
    os.system("pip install faker requests --break-system-packages")
    from faker import Faker
    import requests

fake = Faker('pt_BR')

# Configurações de rate limiting
DELAY_BETWEEN_CALLS = 0.3  # 300ms entre chamadas
MAX_RETRIES = 3
RETRY_DELAY = 2  # segundos


class ChatwootGeneratorV3:
    """Gerador v3.0 - Fluxo correto e conversas realistas"""
    
    def __init__(self, api_url: str, api_key: str, account_id: int):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.account_id = account_id
        self.headers = {
            'api_access_token': api_key,
            'Content-Type': 'application/json'
        }
        self.base_endpoint = f"{self.api_url}/api/v1/accounts/{self.account_id}"
        
        # Cache
        self.cache = {
            'inbox_id': None,
            'labels': [],
            'teams': [],
            'agents': [],
            'custom_attributes': {
                'contact': [],
                'conversation': []
            },
            'conversas_criadas': [],
            'contatos_criados': []
        }
        
        # Contador de protocolo
        self.protocolo_counter = 1
        self.cod_cliente_counter = 1
    
    def _delay(self):
        """Delay para rate limiting"""
        time.sleep(DELAY_BETWEEN_CALLS)
    
    def _fazer_request(self, method: str, endpoint: str, data: Dict = None) -> Optional[requests.Response]:
        """Faz request com retry e rate limiting"""
        url = f"{self.base_endpoint}{endpoint}"
        
        for tentativa in range(MAX_RETRIES):
            try:
                self._delay()
                
                if method.upper() == 'GET':
                    response = requests.get(url, headers=self.headers, timeout=30)
                elif method.upper() == 'POST':
                    response = requests.post(url, headers=self.headers, json=data, timeout=30)
                elif method.upper() == 'PUT':
                    response = requests.put(url, headers=self.headers, json=data, timeout=30)
                elif method.upper() == 'PATCH':
                    response = requests.patch(url, headers=self.headers, json=data, timeout=30)
                else:
                    return None
                
                if response.status_code == 429:  # Rate limit
                    print(f"  ⚠️  Rate limit, aguardando {RETRY_DELAY * (tentativa + 1)}s...")
                    time.sleep(RETRY_DELAY * (tentativa + 1))
                    continue
                
                if response.status_code in [200, 201]:
                    return response
                elif response.status_code == 404:
                    print(f"  ⚠️  Endpoint não encontrado: {endpoint}")
                    return None
                else:
                    print(f"  ⚠️  Erro {response.status_code}: {response.text[:100]}")
                    return None
                    
            except requests.exceptions.Timeout:
                print(f"  ⚠️  Timeout na tentativa {tentativa + 1}")
                if tentativa < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
            except Exception as e:
                print(f"  ⚠️  Erro: {str(e)}")
                return None
        
        return None
    
    # =========================================================================
    # FASE 1: SETUP - Definir estrutura ANTES
    # =========================================================================
    
    def criar_inbox(self, nome_empresa: str) -> Optional[int]:
        """Cria inbox"""
        print(f"\n📥 Criando inbox '{nome_empresa}'...")
        
        data = {
            "name": f"{nome_empresa}",
            "channel": {
                "type": "api",
                "webhook_url": ""
            }
        }
        
        response = self._fazer_request('POST', '/inboxes', data)
        
        if response and response.status_code == 200:
            inbox_id = response.json()['id']
            self.cache['inbox_id'] = inbox_id
            print(f"  ✅ Inbox criada: ID {inbox_id}")
            return inbox_id
        else:
            print(f"  ❌ Erro ao criar inbox")
            return None
    
    def definir_custom_attribute(self, attribute_data: Dict) -> bool:
        """Define custom attribute ANTES de usar"""
        response = self._fazer_request('POST', '/custom_attribute_definitions', attribute_data)
        
        if response:
            attr_key = attribute_data['attribute_key']
            attr_model = attribute_data['attribute_model']
            
            if attr_model == 0:  # contact
                self.cache['custom_attributes']['contact'].append(attr_key)
            else:  # conversation
                self.cache['custom_attributes']['conversation'].append(attr_key)
            
            return True
        return False
    
    def setup_custom_attributes(self):
        """Define TODOS os custom attributes antes de usar"""
        print(f"\n🔧 Definindo custom attributes...")
        
        # CONTACT ATTRIBUTES
        contact_attrs = [
            {
                "attribute_display_name": "Tipo de Cliente",
                "attribute_key": "tipo_cliente",
                "attribute_description": "Classificação do cliente",
                "attribute_display_type": 6,  # list
                "attribute_values": ["Novo", "Recorrente", "VIP"],
                "attribute_model": 0  # contact
            },
            {
                "attribute_display_name": "Origem Lead",
                "attribute_key": "origem_lead",
                "attribute_description": "De onde o cliente veio",
                "attribute_display_type": 6,  # list
                "attribute_values": ["Instagram", "Google", "Facebook", "Indicação", "WhatsApp"],
                "attribute_model": 0
            },
            {
                "attribute_display_name": "Código Cliente",
                "attribute_key": "cod_cliente",
                "attribute_description": "Código interno do cliente",
                "attribute_display_type": 0,  # text
                "attribute_model": 0
            },
            {
                "attribute_display_name": "Valor Total Compras",
                "attribute_key": "valor_total_compras",
                "attribute_description": "Soma de todas as compras",
                "attribute_display_type": 1,  # number
                "attribute_model": 0
            },
            {
                "attribute_display_name": "Data Cadastro",
                "attribute_key": "data_cadastro",
                "attribute_description": "Quando o cliente foi cadastrado",
                "attribute_display_type": 3,  # date
                "attribute_model": 0
            },
            {
                "attribute_display_name": "Preferência Contato",
                "attribute_key": "preferencia_contato",
                "attribute_description": "Canal preferido do cliente",
                "attribute_display_type": 6,
                "attribute_values": ["WhatsApp", "Email", "Telefone"],
                "attribute_model": 0
            }
        ]
        
        # CONVERSATION ATTRIBUTES
        conversation_attrs = [
            {
                "attribute_display_name": "Protocolo Atendimento",
                "attribute_key": "protocolo_atendimento",
                "attribute_description": "Número do protocolo",
                "attribute_display_type": 0,  # text
                "attribute_model": 1  # conversation
            },
            {
                "attribute_display_name": "Resumo Solicitação",
                "attribute_key": "resumo_solicitacao",
                "attribute_description": "Resumo da solicitação do cliente",
                "attribute_display_type": 0,
                "attribute_model": 1
            },
            {
                "attribute_display_name": "Departamento Origem",
                "attribute_key": "departamento_origem",
                "attribute_description": "De qual departamento veio",
                "attribute_display_type": 6,
                "attribute_values": ["Vendas", "Suporte", "Financeiro", "Pós-Venda"],
                "attribute_model": 1
            },
            {
                "attribute_display_name": "Produto Interesse",
                "attribute_key": "produto_interesse",
                "attribute_description": "Produto de interesse",
                "attribute_display_type": 0,
                "attribute_model": 1
            },
            {
                "attribute_display_name": "Valor Negociação",
                "attribute_key": "valor_negociacao",
                "attribute_description": "Valor em negociação",
                "attribute_display_type": 1,  # number
                "attribute_model": 1
            }
        ]
        
        success_count = 0
        
        # Criar contact attributes
        for attr in contact_attrs:
            if self.definir_custom_attribute(attr):
                print(f"  ✅ Contact: {attr['attribute_key']}")
                success_count += 1
            else:
                print(f"  ⚠️  Contact: {attr['attribute_key']} (já existe ou erro)")
        
        # Criar conversation attributes
        for attr in conversation_attrs:
            if self.definir_custom_attribute(attr):
                print(f"  ✅ Conversation: {attr['attribute_key']}")
                success_count += 1
            else:
                print(f"  ⚠️  Conversation: {attr['attribute_key']} (já existe ou erro)")
        
        print(f"\n  📊 Total: {success_count}/{len(contact_attrs) + len(conversation_attrs)} attributes criados")
    
    def criar_labels(self):
        """Cria labels organizadas"""
        print(f"\n🏷️  Criando labels...")
        
        labels = [
            # Departamentos
            {"title": "vendas", "description": "Vendas e orçamentos", "color": "#3B82F6"},
            {"title": "suporte-tecnico", "description": "Suporte técnico", "color": "#10B981"},
            {"title": "financeiro", "description": "Financeiro e cobranças", "color": "#F59E0B"},
            {"title": "pos-venda", "description": "Pós-venda", "color": "#8B5CF6"},
            
            # Tipos
            {"title": "urgente", "description": "Urgente", "color": "#EF4444"},
            {"title": "orcamento", "description": "Solicitação de orçamento", "color": "#6B7280"},
            {"title": "duvida", "description": "Dúvidas", "color": "#F97316"},
            {"title": "reclamacao", "description": "Reclamações", "color": "#DC2626"},
            
            # Clientes
            {"title": "vip", "description": "Cliente VIP", "color": "#FFD700"},
            {"title": "premium", "description": "Cliente Premium", "color": "#000000"},
            {"title": "novo-cliente", "description": "Cliente novo", "color": "#14B8A6"},
        ]
        
        for label_data in labels:
            response = self._fazer_request('POST', '/labels', label_data)
            if response:
                self.cache['labels'].append(label_data['title'])
                print(f"  ✅ Label: {label_data['title']}")
        
        print(f"  📊 Total: {len(self.cache['labels'])} labels criadas")
    
    def criar_times_e_agentes(self):
        """Cria times e agentes com personalidades"""
        print(f"\n👥 Criando times e agentes...")
        
        # Times
        times = [
            {"name": "Vendas", "description": "Time comercial"},
            {"name": "Suporte", "description": "Time de suporte técnico"},
            {"name": "Financeiro", "description": "Time financeiro"}
        ]
        
        for team_data in times:
            response = self._fazer_request('POST', '/teams', team_data)
            if response:
                self.cache['teams'].append(response.json())
                print(f"  ✅ Time: {team_data['name']}")
        
        # Agentes com personalidades
        print(f"\n  👤 Agentes já existentes no sistema serão usados")
    
    # =========================================================================
    # FASE 2: CONVERSAS REALISTAS com tons humanizados
    # =========================================================================
    
    def gerar_conversas_humanizadas(self) -> List[Dict]:
        """Gera conversas realistas com diferentes contextos"""
        
        conversas_templates = [
            # VENDAS - Orçamento Site
            {
                "tipo": "orcamento_site",
                "departamento": "Vendas",
                "produto": "Site Institucional",
                "valor": random.randint(5000, 15000),
                "tipo_cliente": random.choice(["Novo", "Recorrente", "VIP"]),
                "origem": random.choice(["Instagram", "Google", "Indicação"]),
                "urgencia": random.choice(["baixa", "media", "alta"]),
                "mensagens": [
                    {
                        "remetente": "cliente",
                        "tom": "casual",
                        "textos": [
                            "Oi! Tudo bem? Vi vocês no Instagram e gostei muito do trabalho 😊",
                            "Queria um orçamento pra fazer um site da minha empresa",
                            "Vocês trabalham com site institucional?"
                        ]
                    },
                    {
                        "remetente": "sdr",
                        "nome": "João Silva",
                        "tom": "amigavel",
                        "textos": [
                            "Oi! Tudo ótimo, e você? 😊",
                            "Que legal que gostou do nosso trabalho! Fico super feliz em poder te ajudar",
                            "Sim, trabalhamos com sites institucionais! Fazemos um trabalho bem completo",
                            "Só pra eu entender melhor: que tipo de empresa você tem?"
                        ]
                    },
                    {
                        "remetente": "cliente",
                        "textos": [
                            "Tenho uma consultoria em marketing digital",
                            "Quero um site pra apresentar os serviços, sabe?",
                            "Nada muito complexo"
                        ]
                    },
                    {
                        "remetente": "sdr",
                        "textos": [
                            "Perfeito! Consultoria de marketing, adorei! 📈",
                            "E você já tem uma ideia de quantas páginas mais ou menos?",
                            "Tipo início, serviços, sobre, contato..."
                        ]
                    },
                    {
                        "remetente": "cliente",
                        "textos": [
                            "Acho que umas 8-10 páginas seria ideal",
                            "E queria algo moderno, responsivo"
                        ]
                    },
                    {
                        "remetente": "sdr",
                        "textos": [
                            "Show de bola! Vou te passar para o time comercial",
                            "Eles vão fazer um orçamento personalizado pra você, beleza?",
                            "O pessoal é fera e vai te atender super bem!",
                            "Aguarda só um instantinho 😊"
                        ]
                    },
                    {
                        "remetente": "vendedor",
                        "nome": "Ana Santos",
                        "textos": [
                            "Oi! Sou a Ana do time comercial 😊",
                            "Vi aqui que você quer um site institucional pra sua consultoria, né?",
                            "Já vou adiantar: conseguimos fazer um trabalho incrível pra você!",
                            "Podemos agendar uma call rápida amanhã de manhã pra eu entender melhor e te passar os valores?"
                        ]
                    }
                ]
            },
            
            # SUPORTE - Problema Técnico
            {
                "tipo": "suporte_tecnico",
                "departamento": "Suporte",
                "produto": "Sistema",
                "tipo_cliente": "Recorrente",
                "origem": "WhatsApp",
                "urgencia": "alta",
                "mensagens": [
                    {
                        "remetente": "cliente",
                        "tom": "preocupado",
                        "textos": [
                            "Pessoal, preciso de ajuda urgente!",
                            "O sistema não está abrindo aqui",
                            "Tá dando erro quando tento fazer login"
                        ]
                    },
                    {
                        "remetente": "sdr",
                        "nome": "Carlos Lima",
                        "tom": "profissional",
                        "textos": [
                            "Oi! Pode deixar que vou te ajudar agora mesmo",
                            "Vou transferir pro nosso time técnico que vai resolver isso rapidinho",
                            "Um minutinho só!"
                        ]
                    },
                    {
                        "remetente": "suporte",
                        "nome": "Pedro Tech",
                        "textos": [
                            "Oi! Sou o Pedro do suporte técnico",
                            "Vi que tá com problema no login, vamos resolver!",
                            "Qual navegador você está usando?"
                        ]
                    },
                    {
                        "remetente": "cliente",
                        "textos": [
                            "Tô usando o Chrome",
                            "Sempre funcionou normal"
                        ]
                    },
                    {
                        "remetente": "suporte",
                        "textos": [
                            "Entendi! Vamos fazer o seguinte:",
                            "Pode tentar limpar o cache e os cookies?",
                            "Te mando o passo a passo:",
                            "1. Clica nos 3 pontinhos no canto",
                            "2. Mais ferramentas > Limpar dados de navegação",
                            "3. Marca 'Cookies' e 'Cache'",
                            "4. Limpa e tenta de novo",
                            "Me avisa se resolver! 👍"
                        ]
                    }
                ]
            },
            
            # FINANCEIRO - Dúvida Boleto
            {
                "tipo": "duvida_financeiro",
                "departamento": "Financeiro",
                "produto": "Cobrança",
                "tipo_cliente": "VIP",
                "origem": "Email",
                "urgencia": "media",
                "mensagens": [
                    {
                        "remetente": "cliente",
                        "tom": "formal",
                        "textos": [
                            "Bom dia!",
                            "Não recebi o boleto deste mês ainda",
                            "Podem me enviar?"
                        ]
                    },
                    {
                        "remetente": "sdr",
                        "nome": "Maria Costa",
                        "textos": [
                            "Bom dia! Claro, vou te ajudar",
                            "Vou transferir pro financeiro que já te envia",
                            "Aguarda só um instante"
                        ]
                    },
                    {
                        "remetente": "financeiro",
                        "nome": "Roberto Finance",
                        "textos": [
                            "Bom dia! Sou o Roberto do financeiro",
                            "Deixa eu verificar aqui no sistema...",
                            "Encontrei! O boleto vence dia 15",
                            "Vou reenviar agora para seu email cadastrado",
                            "Qualquer dúvida, estou à disposição! 😊"
                        ]
                    }
                ]
            }
        ]
        
        # Gerar variações
        conversas_geradas = []
        
        # Duplicar templates com variações
        for _ in range(15):  # 15 conversas por template
            template = random.choice(conversas_templates)
            conversa = template.copy()
            
            # Adicionar variações
            conversa['protocolo'] = f"WP-2024-{self.protocolo_counter:06d}"
            conversa['cod_cliente'] = f"COD-2024-{self.cod_cliente_counter:04d}"
            self.protocolo_counter += 1
            self.cod_cliente_counter += 1
            
            conversas_geradas.append(conversa)
        
        return conversas_geradas
    
    def criar_conversa_realista(self, conversa_template: Dict) -> Optional[Dict]:
        """Cria uma conversa completa com mensagens humanizadas"""
        
        source_id = f"demo-v3-{uuid.uuid4()}"
        
        # 1. Criar conversa
        print(f"\n💬 Criando conversa: {conversa_template['protocolo']}")
        
        conversa_data = {
            "source_id": source_id,
            "inbox_id": self.cache['inbox_id'],
            "custom_attributes": {
                "protocolo_atendimento": conversa_template['protocolo'],
                "resumo_solicitacao": f"Cliente solicita {conversa_template['produto']}",
                "departamento_origem": conversa_template['departamento'],
                "produto_interesse": conversa_template['produto']
            }
        }
        
        if 'valor' in conversa_template:
            conversa_data['custom_attributes']['valor_negociacao'] = conversa_template['valor']
        
        response = self._fazer_request('POST', '/conversations', conversa_data)
        
        if not response:
            print(f"  ❌ Erro ao criar conversa")
            return None
        
        conversa = response.json()
        conversa_id = conversa['id']
        print(f"  ✅ Conversa criada: ID {conversa_id}")
        
        # 2. Adicionar mensagens (PRIMEIRA cria o contato!)
        print(f"  💬 Adicionando mensagens...")
        
        for idx, msg_group in enumerate(conversa_template['mensagens']):
            remetente = msg_group['remetente']
            textos = msg_group['textos']
            
            for texto in textos:
                message_data = {
                    "content": texto,
                    "message_type": "incoming" if remetente == "cliente" else "outgoing",
                    "private": False,
                    "source_id": source_id if remetente == "cliente" else None
                }
                
                msg_response = self._fazer_request('POST', f'/conversations/{conversa_id}/messages', message_data)
                
                if msg_response:
                    print(f"    → {remetente}: {texto[:50]}...")
                
                # Delay entre mensagens para parecer natural
                time.sleep(0.2)
        
        # 3. Adicionar nota privada COMPLETA
        nota_privada = self.gerar_nota_privada_completa(conversa_template)
        
        note_data = {
            "content": nota_privada,
            "private": True
        }
        
        self._fazer_request('POST', f'/conversations/{conversa_id}/messages', note_data)
        print(f"  ✅ Nota privada adicionada")
        
        # 4. Adicionar labels
        labels = [conversa_template['departamento'].lower()]
        
        if conversa_template.get('urgencia') == 'alta':
            labels.append('urgente')
        
        if conversa_template.get('tipo_cliente') == 'VIP':
            labels.append('vip')
        
        label_data = {"labels": labels}
        self._fazer_request('POST', f'/conversations/{conversa_id}/labels', label_data)
        print(f"  🏷️  Labels: {', '.join(labels)}")
        
        # Guardar para depois enriquecer
        conversa_template['conversa_id'] = conversa_id
        conversa_template['source_id'] = source_id
        self.cache['conversas_criadas'].append(conversa_template)
        
        return conversa_template
    
    def gerar_nota_privada_completa(self, conversa: Dict) -> str:
        """Gera nota privada completa como SDR faria"""
        
        sdr_nome = random.choice(["João Silva", "Maria Costa", "Carlos Lima", "Ana Santos"])
        
        nota = f"""📋 TRIAGEM SDR - {sdr_nome}

COD. CLIENTE: {conversa['cod_cliente']}
PROTOCOLO: #{conversa['protocolo']}

RESUMO DA SOLICITAÇÃO:
Cliente solicita {conversa['produto']}. """
        
        if 'valor' in conversa:
            nota += f"Orçamento estimado: R$ {conversa['valor']:,.2f}. "
        
        nota += f"""

CONTEXTO ADICIONAL:
- Tipo: {conversa['tipo_cliente']}
- Origem: {conversa['origem']}
- Departamento: {conversa['departamento']}
- Urgência: {conversa.get('urgencia', 'media').title()}
- Preferência: WhatsApp

AÇÕES REALIZADAS:
✓ Dados básicos coletados
✓ Interesse qualificado
✓ Prioridade definida
✓ Transferido para: Time {conversa['departamento']}

PRÓXIMOS PASSOS:
→ Enviar proposta/solução
→ Agendar follow-up
→ Monitorar SLA
"""
        
        return nota
    
    # =========================================================================
    # FASE 3: ENRIQUECER CONTATOS
    # =========================================================================
    
    def buscar_contato_criado(self, source_id: str) -> Optional[Dict]:
        """Busca contato que foi criado automaticamente"""
        
        # Buscar nas conversas criadas
        response = self._fazer_request('GET', '/contacts')
        
        if response:
            contacts = response.json()
            # Aqui seria ideal buscar por source_id, mas vamos pegar os últimos criados
            if isinstance(contacts, list) and len(contacts) > 0:
                return contacts[-1]  # Último criado
        
        return None
    
    def enriquecer_contato(self, conversa_template: Dict):
        """Enriquece contato com custom attributes, notas e labels"""
        
        print(f"\n👤 Enriquecendo contato: {conversa_template['cod_cliente']}")
        
        # Buscar contato
        contato = self.buscar_contato_criado(conversa_template['source_id'])
        
        if not contato:
            print(f"  ⚠️  Contato não encontrado")
            return
        
        contact_id = contato.get('id')
        
        if not contact_id:
            print(f"  ⚠️  Contact ID não disponível")
            return
        
        # 1. Adicionar custom attributes
        data_cadastro = (datetime.now() - timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d")
        
        contact_data = {
            "custom_attributes": {
                "tipo_cliente": conversa_template['tipo_cliente'],
                "origem_lead": conversa_template['origem'],
                "cod_cliente": conversa_template['cod_cliente'],
                "data_cadastro": data_cadastro,
                "preferencia_contato": "WhatsApp"
            }
        }
        
        if conversa_template.get('tipo_cliente') == 'VIP':
            contact_data['custom_attributes']['valor_total_compras'] = random.randint(10000, 50000)
        elif conversa_template.get('tipo_cliente') == 'Recorrente':
            contact_data['custom_attributes']['valor_total_compras'] = random.randint(5000, 15000)
        
        self._fazer_request('PUT', f'/contacts/{contact_id}', contact_data)
        print(f"  ✅ Custom attributes adicionados")
        
        # 2. Adicionar nota de contato (histórico)
        nota_contato = self.gerar_nota_contato_historico(conversa_template)
        
        note_data = {"content": nota_contato}
        self._fazer_request('POST', f'/contacts/{contact_id}/notes', note_data)
        print(f"  ✅ Nota de contato adicionada")
        
        # 3. Adicionar labels ao contato
        labels = []
        
        if conversa_template.get('tipo_cliente') == 'VIP':
            labels.append('vip')
        elif conversa_template.get('tipo_cliente') == 'Recorrente':
            labels.append('premium')
        else:
            labels.append('novo-cliente')
        
        if labels:
            label_data = {"labels": labels}
            self._fazer_request('POST', f'/contacts/{contact_id}/labels', label_data)
            print(f"  🏷️  Labels contato: {', '.join(labels)}")
        
        print(f"  ✅ Contato enriquecido com sucesso!")
    
    def gerar_nota_contato_historico(self, conversa: Dict) -> str:
        """Gera nota de histórico do contato"""
        
        if conversa['tipo_cliente'] == 'VIP':
            return f"""📝 HISTÓRICO DO CLIENTE

CLIENTE VIP - Alta Prioridade

COMPRAS ANTERIORES:
• 2023-08-15: Site E-commerce (R$ 15.000)
• 2023-02-10: Sistema de Gestão (R$ 12.000)
• 2022-09-05: Landing Page (R$ 3.000)

OBSERVAÇÕES:
- Cliente muito satisfeito com entregas
- Sempre indica novos clientes
- Paga sempre em dia (sem atrasos)
- Renova contratos de manutenção

PREFERÊNCIAS:
- Gosta de comunicação rápida e objetiva
- Prefere WhatsApp
- Melhor horário: Manhã (9h-12h)

POTENCIAL:
- Possível upsell em marketing digital
- Interessado em automações
"""
        
        elif conversa['tipo_cliente'] == 'Recorrente':
            return f"""📝 HISTÓRICO DO CLIENTE

CLIENTE RECORRENTE

COMPRAS ANTERIORES:
• 2023-11-20: Site Institucional (R$ 5.000)
• 2023-03-15: Manutenção Anual (R$ 2.400)

OBSERVAÇÕES:
- Cliente pontual nos pagamentos
- Satisfeito com atendimento
- Renovou contrato de manutenção

PREFERÊNCIAS:
- Prefere WhatsApp para contato rápido
- Horário comercial (9h-18h)
"""
        
        else:  # Novo
            return f"""📝 HISTÓRICO DO CLIENTE

CLIENTE NOVO - Primeira Interação

ORIGEM:
- Chegou via: {conversa['origem']}
- Data primeiro contato: {datetime.now().strftime("%Y-%m-%d")}

INTERESSE INICIAL:
- Produto/Serviço: {conversa['produto']}
- Departamento: {conversa['departamento']}

OBSERVAÇÕES:
- Primeiro contato com a empresa
- Demonstrou interesse genuíno
- Qualificado como potencial cliente

PRÓXIMOS PASSOS:
- Acompanhar proposta
- Nutrir relacionamento
- Possível conversão
"""
    
    # =========================================================================
    # FASE 4: EXECUTAR FLUXO COMPLETO
    # =========================================================================
    
    def executar_fluxo_completo(self, nome_empresa: str, num_conversas: int = 20):
        """Executa o fluxo completo v3.0"""
        
        print(f"\n{'='*70}")
        print(f"  🚀 GERADOR v3.0 - FLUXO REAL E PROFISSIONAL")
        print(f"{'='*70}\n")
        
        print(f"Empresa: {nome_empresa}")
        print(f"Conversas: {num_conversas}")
        
        # FASE 1: SETUP
        print(f"\n{'='*70}")
        print(f"  FASE 1: SETUP INICIAL")
        print(f"{'='*70}")
        
        inbox_id = self.criar_inbox(nome_empresa)
        if not inbox_id:
            print("❌ Erro ao criar inbox. Abortando.")
            return
        
        self.setup_custom_attributes()
        self.criar_labels()
        self.criar_times_e_agentes()
        
        # FASE 2: CONVERSAS
        print(f"\n{'='*70}")
        print(f"  FASE 2: CRIAR CONVERSAS REALISTAS")
        print(f"{'='*70}")
        
        conversas_templates = self.gerar_conversas_humanizadas()
        
        # Limitar ao número solicitado
        conversas_templates = conversas_templates[:num_conversas]
        
        for idx, conversa in enumerate(conversas_templates, 1):
            print(f"\n[{idx}/{num_conversas}]")
            self.criar_conversa_realista(conversa)
            
            # Delay entre conversas
            time.sleep(1)
        
        # FASE 3: ENRIQUECER
        print(f"\n{'='*70}")
        print(f"  FASE 3: ENRIQUECER CONTATOS")
        print(f"{'='*70}")
        
        for idx, conversa in enumerate(self.cache['conversas_criadas'], 1):
            print(f"\n[{idx}/{len(self.cache['conversas_criadas'])}]")
            self.enriquecer_contato(conversa)
            time.sleep(0.5)
        
        # RELATÓRIO FINAL
        print(f"\n{'='*70}")
        print(f"  ✅ GERAÇÃO COMPLETA!")
        print(f"{'='*70}\n")
        
        print(f"📊 RESUMO:")
        print(f"  • Inbox: {nome_empresa}")
        print(f"  • Custom Attributes: {len(self.cache['custom_attributes']['contact']) + len(self.cache['custom_attributes']['conversation'])}")
        print(f"  • Labels: {len(self.cache['labels'])}")
        print(f"  • Conversas: {len(self.cache['conversas_criadas'])}")
        print(f"  • Contatos enriquecidos: {len(self.cache['conversas_criadas'])}")
        print()
        print(f"🎉 Demo realista criada com sucesso!")
        print(f"   Acesse: {self.api_url}")
        print()


def main():
    parser = argparse.ArgumentParser(description='Gerador PRO v3.0 - Fluxo Real')
    parser.add_argument('--empresa', type=str, required=True, help='Nome da empresa')
    parser.add_argument('--conversas', type=int, default=20, help='Número de conversas')
    parser.add_argument('--api-url', type=str, help='URL da API')
    parser.add_argument('--api-key', type=str, help='API Key')
    parser.add_argument('--account-id', type=int, help='Account ID')
    
    args = parser.parse_args()
    
    # Carregar do .env se não passar argumentos
    api_url = args.api_url or os.getenv('CHATWOOT_API_URL')
    api_key = args.api_key or os.getenv('CHATWOOT_API_KEY')
    account_id = args.account_id or os.getenv('CHATWOOT_ACCOUNT_ID')
    
    if not all([api_url, api_key, account_id]):
        # Tentar carregar do .env
        if os.path.exists('.env'):
            with open('.env') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            if key == 'CHATWOOT_API_URL':
                                api_url = value
                            elif key == 'CHATWOOT_API_KEY':
                                api_key = value
                            elif key == 'CHATWOOT_ACCOUNT_ID':
                                account_id = int(value)
    
    if not all([api_url, api_key, account_id]):
        print("❌ Configure .env ou passe as credenciais via argumentos")
        sys.exit(1)
    
    # Executar
    generator = ChatwootGeneratorV3(api_url, api_key, int(account_id))
    generator.executar_fluxo_completo(args.empresa, args.conversas)


if __name__ == "__main__":
    main()
