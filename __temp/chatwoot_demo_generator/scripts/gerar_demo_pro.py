#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Gerador PRO de Demos Mockadas v2.0
Versão completa com TODAS as features do Chatwoot:
- Custom Attributes (Contato e Conversa)
- Custom Roles (Funções personalizadas)
- SLA Policies
- Times/Equipes
- Agentes com roles
- Notas de Contato
- Prioridades
- Notas privadas em conversas
- Respostas prontas
- Automações
- CSAT
"""

import json
import os
import sys
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import argparse
import time
import subprocess

# Adicionar diretório raiz ao path para importar lib
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importar config centralizada
from lib.config import obter_config_validada

try:
    from faker import Faker
    import requests
except ImportError:
    print("❌ Instalando dependências necessárias...")
    os.system("pip install faker requests --break-system-packages")
    from faker import Faker
    import requests

fake = Faker('pt_BR')


class ChatwootProGenerator:
    """Gerador PRO de demos mockadas com todas as features do Chatwoot"""
    
    def __init__(self, api_url: str, api_key: str, account_id: int):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.account_id = account_id
        self.headers = {
            'api_access_token': api_key,
            'Content-Type': 'application/json'
        }
        self.base_endpoint = f"{self.api_url}/api/v1/accounts/{self.account_id}"
        
        # Cache de recursos criados
        self.cache = {
            'agentes': [],
            'times': [],
            'labels': [],
            'canned_responses': [],
            'automation_rules': [],
            'custom_attributes': [],
            'custom_roles': [],
            'sla_policies': [],
            'contatos': [],
            'inbox_id': None
        }
    
    def carregar_template(self, nicho: str) -> Dict:
        """Carrega template PRO de nicho específico"""
        # Caminho relativo a partir de scripts/
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(base_path, "templates_pro", f"{nicho}.json")
        
        if not os.path.exists(template_path):
            # Fallback para template básico
            print(f"⚠️  Template PRO não encontrado para '{nicho}'. Usando template básico.")
            template_path = os.path.join(base_path, "templates", f"{nicho}.json")
            
        if not os.path.exists(template_path):
            print(f"❌ Template '{nicho}' não encontrado!")
            sys.exit(1)
            
        with open(template_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _fazer_request(self, method: str, endpoint: str, data: Dict = None, 
                      max_retries: int = 3) -> Optional[requests.Response]:
        """Faz request com retry automático em caso de rate limit"""
        url = f"{self.base_endpoint}{endpoint}"
        
        for tentativa in range(max_retries):
            try:
                if method.upper() == 'GET':
                    response = requests.get(url, headers=self.headers)
                elif method.upper() == 'POST':
                    response = requests.post(url, headers=self.headers, json=data)
                elif method.upper() == 'PUT':
                    response = requests.put(url, headers=self.headers, json=data)
                elif method.upper() == 'PATCH':
                    response = requests.patch(url, headers=self.headers, json=data)
                elif method.upper() == 'DELETE':
                    response = requests.delete(url, headers=self.headers)
                else:
                    return None
                
                # Rate limit
                if response.status_code == 429:
                    wait_time = 2 ** tentativa
                    print(f"⏳ Rate limit atingido. Aguardando {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                
                return response
                
            except Exception as e:
                print(f"⚠️  EXCEÇÃO REAL na requisição {method} {url}: {type(e).__name__} - {e}")
                if tentativa < max_retries - 1:
                    time.sleep(1)
                continue
        
        return None
        return None

    def _get_all(self, endpoint: str) -> List[Dict]:
        """Busca todos os itens de um endpoint (com paginação simples se necessário)"""
        # Simplificação: assumindo que a maioria dos endpoints retorna tudo ou tem paginação
        # Para garantir idempotência robusta, o ideal seria paginar.
        # Aqui vamos implementar uma busca simples na página 1, mas preparada para expansão.
        url = f"{self.base_endpoint}{endpoint}"
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict) and 'payload' in data:
                    return data['payload']
                return []
        except:
            pass
        return []

    def _get_existentes_map(self, endpoint: str, key_field: str = 'name') -> Dict[str, int]:
        """Retorna dicionário {nome: id} de recursos existentes"""
        itens = self._get_all(endpoint)
        return {item[key_field]: item['id'] for item in itens if key_field in item}

    # ==================== CUSTOM ATTRIBUTES ====================
    
    def criar_custom_attributes(self, template: Dict) -> List[Dict]:
        """Cria custom attributes para contatos e conversas (Idempotente)"""
        attrs_criados = []
        
        print("\n📊 Criando Custom Attributes...")
        
        # Buscar existentes
        existentes = self._get_all('/custom_attribute_definitions')
        # Mapear: "chave_modelo" -> id    (modelo: 0=contact, 1=conversation)
        existentes_keys = {f"{a['attribute_key']}_{a['attribute_model']}": a['id'] for a in existentes}
        
        # Atributos de contato (model 0)
        for attr in template.get('custom_attributes_contato', []):
            chave_unica = f"{attr['chave']}_0"
            if chave_unica in existentes_keys:
                print(f"  ⏩ Atributo já existe: {attr['nome']}")
                attrs_criados.append({**attr, 'model': 'contact'})
                continue

            data = {
                "attribute_display_name": attr['nome'],
                "attribute_display_type": 0,  # 0 = Contact, 1 = Conversation
                "attribute_key": attr['chave'],
                "attribute_model": 0  # 0 = Contact
            }
            
            # Definir tipo
            tipo_map = {'text': 0, 'number': 1, 'link': 2, 'date': 3, 'list': 4, 'checkbox': 5}
            data['attribute_display_type'] = tipo_map.get(attr['tipo'], 0)
            
            # Adicionar valores para list
            if attr['tipo'] == 'list' and 'valores' in attr:
                data['attribute_values'] = attr['valores']
            
            response = self._fazer_request('POST', '/custom_attribute_definitions', data)
            if response and response.status_code in [200, 201]:
                attrs_criados.append({**attr, 'model': 'contact'})
                print(f"  ✓ Contato: {attr['nome']}")
        
        # Atributos de conversa (model 1)
        for attr in template.get('custom_attributes_conversa', []):
            chave_unica = f"{attr['chave']}_1"
            if chave_unica in existentes_keys:
                print(f"  ⏩ Atributo já existe: {attr['nome']}")
                attrs_criados.append({**attr, 'model': 'conversation'})
                continue

            data = {
                "attribute_display_name": attr['nome'],
                "attribute_display_type": 0,
                "attribute_key": attr['chave'],
                "attribute_model": 1  # 1 = Conversation
            }
            
            tipo_map = {'text': 0, 'number': 1, 'link': 2, 'date': 3, 'list': 4, 'checkbox': 5}
            data['attribute_display_type'] = tipo_map.get(attr['tipo'], 0)
            
            if attr['tipo'] == 'list' and 'valores' in attr:
                data['attribute_values'] = attr['valores']
            
            response = self._fazer_request('POST', '/custom_attribute_definitions', data)
            if response and response.status_code in [200, 201]:
                attrs_criados.append({**attr, 'model': 'conversation'})
                print(f"  ✓ Conversa: {attr['nome']}")
        
        self.cache['custom_attributes'] = attrs_criados
        return attrs_criados

    # ==================== CUSTOM ROLES ====================
    
    def criar_custom_roles(self, template: Dict) -> List[Dict]:
        """Cria custom roles (Idempotente)"""
        roles_config = template.get('custom_roles', [])
        roles_criados = []
        
        if not roles_config:
            return roles_criados
        
        print("\n👔 Criando Custom Roles...")
        existentes_map = self._get_existentes_map('/custom_roles', 'name')
        
        for role in roles_config:
            if role['nome'] in existentes_map:
                print(f"  ⏩ Role já existe: {role['nome']}")
                roles_criados.append({
                    'id': existentes_map[role['nome']],
                    'nome': role['nome']
                })
                continue

            data = {
                "name": role['nome'],
                "description": role.get('descricao', ''),
                "permissions": role.get('permissoes', [])
            }
            
            response = self._fazer_request('POST', '/custom_roles', data)
            if response and response.status_code in [200, 201]:
                role_data = response.json()
                roles_criados.append({
                    'id': role_data.get('id'),
                    'nome': role['nome']
                })
                print(f"  ✓ {role['nome']}")
        
        self.cache['custom_roles'] = roles_criados
        return roles_criados

    # ==================== SLA POLICIES ====================
    
    def criar_sla_policies(self, template: Dict) -> List[Dict]:
        """Cria SLA policies (Idempotente)"""
        sla_config = template.get('sla_policies', [])
        sla_criados = []
        
        if not sla_config:
            return sla_criados
        
        print("\n⏱️  Criando SLA Policies...")
        existentes_map = self._get_existentes_map('/sla_policies', 'name')
        
        for sla in sla_config:
            if sla['nome'] in existentes_map:
                print(f"  ⏩ SLA já existe: {sla['nome']}")
                sla_criados.append({
                    'id': existentes_map[sla['nome']],
                    'nome': sla['nome']
                })
                continue

            data = {
                "name": sla['nome'],
                "description": sla.get('descricao', ''),
                "first_response_time_threshold": sla.get('primeira_resposta_minutos', 30) * 60,
                "next_response_time_threshold": sla.get('proxima_resposta_minutos', 60) * 60,
                "resolution_time_threshold": sla.get('tempo_resolucao_minutos', 1440) * 60,
                "only_during_business_hours": True
            }
            
            response = self._fazer_request('POST', '/sla_policies', data)
            if response and response.status_code in [200, 201]:
                sla_data = response.json()
                sla_criados.append({
                    'id': sla_data.get('id'),
                    'nome': sla['nome']
                })
                print(f"  ✓ {sla['nome']}")
        
        self.cache['sla_policies'] = sla_criados
        return sla_criados

    # ==================== TIMES/EQUIPES ====================
    
    def criar_times(self, template: Dict) -> List[Dict]:
        """Cria times/equipes (Idempotente)"""
        times_config = template.get('times', [])
        times_criados = []
        
        print("\n👥 Criando times...")
        existentes_map = self._get_existentes_map('/teams', 'name')
        
        for time_info in times_config:
            if time_info['nome'] in existentes_map:
                print(f"  ⏩ Time já existe: {time_info['nome']}")
                times_criados.append({
                    'id': existentes_map[time_info['nome']],
                    'nome': time_info['nome'],
                    'tipo': time_info.get('tipo', 'geral')
                })
                continue

            data = {
                "name": time_info['nome'],
                "description": time_info.get('descricao', ''),
                "allow_auto_assign": time_info.get('auto_assign', True)
            }
            
            response = self._fazer_request('POST', '/teams', data)
            
            if response and response.status_code in [200, 201]:
                time_data = response.json()
                times_criados.append({
                    'id': time_data['id'],
                    'nome': time_info['nome'],
                    'tipo': time_info.get('tipo', 'geral')
                })
                print(f"  ✓ Time '{time_info['nome']}' (ID: {time_data['id']})")
        
        self.cache['times'] = times_criados
        return times_criados

    # ==================== AGENTES ====================
    
    def criar_agentes(self, template: Dict, times: List[Dict]) -> List[Dict]:
        """Cria agentes com roles e atribui a times (Idempotente)"""
        agentes_config = template.get('agentes', [])
        agentes_criados = []
        
        print("\n🧑‍💼 Criando agentes...")
        existentes_map = self._get_existentes_map('/agents', 'email')
        
        for i, agente_info in enumerate(agentes_config):
            nome = fake.name()
            # Usar email fixo para o "cargo" para permitir idempotência, ou gerar determinístico?
            # Se usarmos fake.name() toda vez, nunca vai bater.
            # Para idempotência, precisaríamos de emails estáveis no template ou gerados de forma determinística
            # baseada no cargo/index.
            # Vou mudar para gerar baseado no indice e nicho para ser consistente? Não, fake.name muda.
            # Melhor: Tentar encontrar pelo ROLE ou criar estratégia de email fixo?
            # VOU MUDAR: usar um prefixo fixo baseado no cargo/index para o email.
            email = f"demo.{template['nome'].lower().replace(' ', '')}.{i}@demo.whatpro.com"
            
            if email in existentes_map:
                print(f"  ⏩ Agente já existe: {email}")
                agentes_criados.append({
                    'id': existentes_map[email],
                    'nome': nome, # Nome pode ser diferente, mas email é a chave
                    'email': email,
                    'role': agente_info.get('role', 'agent')
                })
                # TODO: Garantir que participa do time correto? (Deixando simples por enquanto)
                continue

            data = {
                "name": nome,
                "email": email,
                "role": agente_info.get('role', 'agent'),
                "availability_status": "online",
                "auto_offline": False,
                "confirmed": True  # Garantir status verificado
            }
            
            # Adicionar custom role se existir
            if 'custom_role' in agente_info and self.cache['custom_roles']:
                for role in self.cache['custom_roles']:
                    if role['nome'] == agente_info['custom_role']:
                        data['custom_role_id'] = role['id']
                        break
            
            response = self._fazer_request('POST', '/agents', data)
            
            if response and response.status_code in [200, 201]:
                agente = response.json()
                
                # Atribuir a time
                time_tipo = agente_info.get('time_tipo')
                time_id = None
                
                if time_tipo:
                    for time in times:
                        if time['tipo'] == time_tipo:
                            time_id = time['id']
                            break
                
                agente_criado = {
                    'id': agente['id'],
                    'nome': nome,
                    'email': email,
                    'role': agente_info.get('role', 'agent'),
                    'time_id': time_id,
                    'especialidade': agente_info.get('especialidade')
                }
                
                agentes_criados.append(agente_criado)
                
                role_label = {'administrator': '👑 Admin', 'agent': '👤 Agente'}.get(agente_criado['role'], '👤')
                print(f"  ✓ {role_label}: {nome}")
                
                # Adicionar agente ao time
                if time_id:
                    self._fazer_request('POST', f'/teams/{time_id}/team_members', {
                        'user_ids': [agente['id']]
                    })
        
        self.cache['agentes'] = agentes_criados
        return agentes_criados

    # ==================== LABELS ====================
    
    def criar_labels(self, template: Dict) -> List[str]:
        """Cria labels/etiquetas (Idempotente)"""
        labels = template.get('etiquetas', [])
        labels_criadas = []
        
        print("\n🏷️  Criando labels...")
        existentes_map = self._get_existentes_map('/labels', 'title')
        
        for label in labels:
            # Suportar formato antigo (string) e novo (dict)
            if isinstance(label, str):
                titulo = label
                cor = random.choice(['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'])
            else:
                titulo = label.get('titulo', label.get('title', 'label'))
                cor = label.get('cor', label.get('color', '#4ECDC4'))
            
            if titulo in existentes_map:
                # print(f"  ⏩ Label já existe: {titulo}") # Silencioso pois são muitas
                labels_criadas.append(titulo)
                continue

            data = {
                "title": titulo,
                "color": cor,
                "show_on_sidebar": True
            }
            
            response = self._fazer_request('POST', '/labels', data)
            
            if response and response.status_code in [200, 201]:
                labels_criadas.append(titulo)
        
        if labels_criadas:
            print(f"  ✓ {len(labels_criadas)} total labels processadas")
        
        self.cache['labels'] = labels_criadas
        return labels_criadas

    # ==================== RESPOSTAS PRONTAS ====================
    
    def criar_respostas_prontas(self, template: Dict) -> List[Dict]:
        """Cria canned responses (Idempotente)"""
        respostas = template.get('respostas_prontas', [])
        respostas_criadas = []
        
        print("\n💬 Criando respostas prontas...")
        existentes_map = self._get_existentes_map('/canned_responses', 'short_code')
        
        for resposta in respostas:
            if resposta['codigo'] in existentes_map:
                print(f"  ⏩ Resposta já existe: /{resposta['codigo']}")
                respostas_criadas.append({
                    'id': existentes_map[resposta['codigo']],
                    'codigo': resposta['codigo']
                })
                continue

            data = {
                "short_code": resposta['codigo'],
                "content": resposta['texto']
            }
            
            response = self._fazer_request('POST', '/canned_responses', data)
            
            if response and response.status_code in [200, 201]:
                resp = response.json()
                respostas_criadas.append({
                    'id': resp.get('id'),
                    'codigo': resposta['codigo']
                })
                print(f"  ✓ /{resposta['codigo']}")
        
        self.cache['canned_responses'] = respostas_criadas
        return respostas_criadas

    # ==================== AUTOMAÇÕES ====================
    
    def criar_automacoes(self, template: Dict, times: List[Dict]) -> List[Dict]:
        """Cria automation rules (Idempotente)"""
        automacoes = template.get('automacoes', [])
        automacoes_criadas = []
        
        print("\n⚡ Criando automações...")
        existentes_map = self._get_existentes_map('/automation_rules', 'name')
        
        for auto in automacoes:
            if auto['nome'] in existentes_map:
                print(f"  ⏩ Automação já existe: {auto['nome']}")
                automacoes_criadas.append({'id': existentes_map[auto['nome']], 'nome': auto['nome']})
                continue

            # Mapear time_tipo para time_id e sla_nome para sla_id
            actions = []
            for action in auto.get('actions', []):
                if action['action_name'] == 'assign_team':
                    time_tipo = action.get('time_tipo')
                    time_id = None
                    for time in times:
                        if time['tipo'] == time_tipo:
                            time_id = time['id']
                            break
                    if time_id:
                        actions.append({'action_name': 'assign_team', 'action_params': [time_id]})
                elif action['action_name'] == 'add_sla':
                    sla_nome = action.get('sla_nome')
                    sla_id = None
                    for sla in self.cache['sla_policies']:
                        if sla['nome'] == sla_nome:
                            sla_id = sla['id']
                            break
                    if sla_id:
                        actions.append({'action_name': 'add_sla', 'action_params': [sla_id]})
                else:
                    actions.append(action)
            
            data = {
                "name": auto['nome'],
                "description": auto.get('descricao', ''),
                "event_name": auto['evento'],
                "conditions": auto.get('conditions', []),
                "actions": actions,
                "active": True
            }
            
            response = self._fazer_request('POST', '/automation_rules', data)
            
            if response and response.status_code in [200, 201]:
                rule = response.json()
                automacoes_criadas.append({'id': rule.get('id'), 'nome': auto['nome']})
                print(f"  ✓ {auto['nome']}")
        
        self.cache['automation_rules'] = automacoes_criadas
        return automacoes_criadas

    # ==================== INBOX ====================
    
    def criar_inbox(self, nome: str, canal: str = "api") -> Optional[int]:
        """Cria inbox (Idempotente - Get or Create)"""
        # Verificar se já existe (Inboxes não tem endpoint de busca por nome fácil, listar todas)
        inboxes = self._get_all('/inboxes')
        for ib in inboxes:
            if ib['name'] == nome:
                print(f"✅ Inbox '{nome}' já existe (ID: {ib['id']})")
                self.cache['inbox_id'] = ib['id']
                return ib['id']

        data = {
            "name": nome,
            "channel": {
                "type": canal,
                "webhook_url": ""  # Canal API requer webhook_url (pode ser vazio inicialmente)
            },
            "enable_auto_assignment": True
        }
        
        response = self._fazer_request('POST', '/inboxes', data)
        
        if response and response.status_code in [200, 201]:
            inbox = response.json()
            inbox_id = inbox.get('id')
            self.cache['inbox_id'] = inbox_id
            print(f"✅ Inbox '{nome}' criada (ID: {inbox_id})")
            return inbox_id
        
        print(f"❌ Falha ao criar inbox! Status: {response.status_code if response else 'None'}")
        if response:
            print(f"   Detalhe: {response.text}")
        return None

    # ==================== CONTATOS ====================
    
    def criar_contatos(self, quantidade: int, template: Dict) -> List[Dict]:
        """Cria contatos mockados (Idempotente - Completa até a quantidade)"""
        contatos = [] # Aqui vamos retornar TODOS os válidos (existentes + novos) para uso nas conversas
        notas_exemplos = template.get('notas_contato_exemplos', [])
        attrs_contato = template.get('custom_attributes_contato', [])
        
        # Buscar existentes para contar e reutilizar
        print(f"\n👥 Verificando contatos existentes...")
        existentes = self._get_all('/contacts')
        qtd_existente = len(existentes)
        
        # Adicionar existentes à lista de retorno
        contatos.extend(existentes)
        
        faltam = max(0, quantidade - qtd_existente)
        
        if faltam == 0:
            print(f"✅ Já existem {qtd_existente} contatos (Meta: {quantidade}). Nenhum novo contato será criado.")
            self.cache['contatos'] = contatos
            return contatos
            
        print(f"📉 Faltam {faltam} contatos para atingir a meta. Criando...")
        
        contatos_novos = []
        
        for i in range(faltam):
            # Dados básicos
            # Gerar telefone formato E.164 obrigatório para Chatwoot (+55...)
            phone = f"+55119{random.randint(10000000, 99999999)}"
            
            contato_data = {
                "name": fake.name(),
                "email": fake.email(),
                "phone_number": phone, # Antes: fake.cellphone_number()
                "custom_attributes": {}
            }
            
            # Preencher custom attributes
            for attr in attrs_contato:
                if attr['tipo'] == 'list' and 'valores' in attr:
                    contato_data['custom_attributes'][attr['chave']] = random.choice(attr['valores'])
                elif attr['tipo'] == 'text':
                    if 'cnpj' in attr['chave'].lower():
                        contato_data['custom_attributes'][attr['chave']] = fake.cnpj()
                    elif 'cpf' in attr['chave'].lower():
                        contato_data['custom_attributes'][attr['chave']] = fake.cpf()
                    elif 'cep' in attr['chave'].lower():
                        contato_data['custom_attributes'][attr['chave']] = fake.postcode()
                elif attr['tipo'] == 'number':
                    contato_data['custom_attributes'][attr['chave']] = random.randint(100, 10000)
                elif attr['tipo'] == 'checkbox':
                    contato_data['custom_attributes'][attr['chave']] = random.choice([True, False])
                elif attr['tipo'] == 'date':
                    delta = random.randint(-365, 0)
                    data = datetime.now() + timedelta(days=delta)
                    contato_data['custom_attributes'][attr['chave']] = data.strftime('%Y-%m-%d')
            
            # Delay para evitar sobrecarga (ReadTimeout)
            time.sleep(0.2)
            
            response = self._fazer_request('POST', '/contacts', contato_data)
            
            if response and response.status_code in [200, 201]:
                # O payload de resposta pode variar (envelope 'payload' ou direto)
                resp_json = response.json()
                cont = resp_json.get('payload', resp_json)
                contact_id = cont.get('id')
                
                if contact_id:
                    contatos_novos.append({'id': contact_id, **contato_data})
                    
                    # Adicionar nota ao contato (50% de chance)
                    if notas_exemplos and random.random() < 0.5:
                        nota = random.choice(notas_exemplos)
                        self._adicionar_nota_contato(contact_id, nota)
                    
                    if (i + 1) % 10 == 0:
                        print(f"  • {i + 1} contatos processados...")
            else:
                # IMPORTANTE: response é False bool se status for 4xx/5xx, então checar is not None
                status = response.status_code if response is not None else 'Sem resposta (None)'
                print(f"❌ Erro ao criar contato {contato_data['email']}: Status {status}")
                if response is not None:
                    print(f"   Detalhe: {response.text}")

        print(f"✅ {len(contatos_novos)} novos contatos criados!")
        
        # Combinar existentes com novos
        contatos.extend(contatos_novos)
        
        # Salvaguarda: Se lista final estiver vazia, tenta buscar tudo de novo
        if not contatos:
            print("⚠️  Lista de contatos vazia! Tentando recarregar da API...")
            contatos = self._get_all('/contacts')
            
        if not contatos:
            print("❌ ERRO CRÍTICO: Não foi possível obter ou criar contatos. Abortando criação de conversas.")
            return []

        self.cache['contatos'] = contatos
        return contatos

    def _adicionar_nota_contato(self, contact_id: int, nota: str):
        """Adiciona nota a um contato"""
        data = {"content": nota}
        self._fazer_request('POST', f'/contacts/{contact_id}/notes', data)

    # ==================== CONVERSAS ====================
    
    def criar_conversas(self, template: Dict, inbox_id: int, 
                       contatos: List[Dict], agentes: List[Dict]) -> List[Dict]:
        """Cria conversas completas (Idempotente - Completa até a quantidade)"""
        quantidade = template.get('num_conversas', 30)
        conversas = []
        
        print(f"\n💬 Verificando conversas existentes...")
        existentes = self._get_all(f'/conversations?inbox_id={inbox_id}')
        qtd_existente = len(existentes)
        conversas.extend(existentes)
        
        faltam = max(0, quantidade - qtd_existente)
        
        if faltam == 0:
             print(f"✅ Já existem {qtd_existente} conversas (Meta: {quantidade}). Nenhuma nova conversa será criada.")
             return conversas

        print(f"📉 Faltam {faltam} conversas. Criando...")
        
        status_opcoes = ["open", "pending", "resolved", "snoozed"]
        prioridades = [None, "low", "medium", "high", "urgent"]
        
        exemplo_msgs = template.get("exemplo_mensagens", {})
        labels = self.cache.get('labels', [])
        attrs_conversa = template.get('custom_attributes_conversa', [])
        
        for i in range(faltam):
            # Delay para evitar sobrecarga na criação de conversas
            time.sleep(0.2)
            
            contato = random.choice(contatos)
            agente = random.choice(agentes) if agentes else None
            status = random.choice(status_opcoes)
            prioridade = random.choice(prioridades)
            
            # Criar conversa
            conv_data = {
                "inbox_id": inbox_id,
                "contact_id": contato['id'],
                "status": status
            }
            
            if prioridade:
                conv_data['priority'] = prioridade
            
            if agente:
                conv_data['assignee_id'] = agente['id']
            
            response = self._fazer_request('POST', '/conversations', conv_data)
            
            if not response or response.status_code not in [200, 201]:
                continue
            
            conv = response.json()
            conv_id = conv.get('id')
            
            # Definir custom attributes da conversa
            if attrs_conversa:
                custom_attrs = {}
                for attr in attrs_conversa:
                    if attr['tipo'] == 'list' and 'valores' in attr:
                        custom_attrs[attr['chave']] = random.choice(attr['valores'])
                    elif attr['tipo'] == 'number':
                        custom_attrs[attr['chave']] = random.randint(50, 5000)
                    elif attr['tipo'] == 'text':
                        if 'pedido' in attr['chave'].lower() or 'protocolo' in attr['chave'].lower():
                            custom_attrs[attr['chave']] = f"#{random.randint(10000, 99999)}"
                        elif 'rastreio' in attr['chave'].lower():
                            custom_attrs[attr['chave']] = f"BR{random.randint(100000, 999999)}XX"
                
                if custom_attrs:
                    self._fazer_request('POST', f'/conversations/{conv_id}/custom_attributes', {
                        'custom_attributes': custom_attrs
                    })
            
            # Adicionar mensagens
            num_msgs = random.randint(3, 8)
            for j in range(num_msgs):
                time.sleep(0.2) # Throttle para evitar ReadTimeout
                is_agente = j % 2 == 1
                
                if is_agente:
                    conteudo = random.choice(exemplo_msgs.get("agente", ["Como posso ajudar?"]))
                    tipo = "outgoing"
                else:
                    conteudo = random.choice(exemplo_msgs.get("cliente", ["Olá"]))
                    tipo = "incoming"
                
                self._adicionar_mensagem(conv_id, conteudo, tipo)
            
            # Adicionar nota privada (30% das conversas)
            if random.random() < 0.3:
                notas = [
                    "Cliente VIP, dar prioridade",
                    "Já comprou antes, verificar histórico",
                    "Lead quente, agendar retorno",
                    "Problema recorrente, escalar para supervisor",
                    "Cliente insatisfeito na última interação"
                ]
                self._adicionar_nota_privada(conv_id, random.choice(notas))
            
            # Adicionar labels
            if labels:
                conv_labels = random.sample(labels, k=min(3, len(labels)))
                self._adicionar_labels(conv_id, conv_labels)
            
            conversas.append({
                'id': conv_id,
                'status': status,
                'prioridade': prioridade,
                'agente': agente['nome'] if agente else None
            })
            
            if (i + 1) % 10 == 0:
                print(f"  • {i + 1} conversas processadas...")
                time.sleep(0.5)
        
        print(f"✅ {len(conversas)} conversas criadas!")
        return conversas
    
    def _adicionar_mensagem(self, conv_id: int, conteudo: str, tipo: str):
        data = {"content": conteudo, "message_type": tipo, "private": False}
        self._fazer_request('POST', f'/conversations/{conv_id}/messages', data)
    
    def _adicionar_nota_privada(self, conv_id: int, nota: str):
        data = {"content": f"📝 {nota}", "message_type": "outgoing", "private": True}
        self._fazer_request('POST', f'/conversations/{conv_id}/messages', data)
    
    def _adicionar_labels(self, conv_id: int, labels: List[str]):
        data = {"labels": labels}
        self._fazer_request('POST', f'/conversations/{conv_id}/labels', data)

    # ==================== GERAÇÃO COMPLETA ====================
    
    def _check_and_prompt_clean(self, nome_empresa_atual: Optional[str]) -> tuple[bool, str]:
        """
        Verifica se conta tem dados e pergunta se quer Limpar ou Mesclar.
        Retorna (Sucesso, NomeEmpresaDefinitivo).
        """
        print(f"\n🔍 Verificando estado da conta...")
        
        # Verificar se existem recursos chave
        inboxes = self._get_all('/inboxes')
        times = self._get_all('/teams')
        agentes = self._get_all('/agents')
        
        # Filtrar agentes reais vs demo
        agentes_demo = [a for a in agentes if '@demo.whatpro.com' in a['email']]
        
        tem_dados = len(inboxes) > 0 or len(times) > 0 or len(agentes_demo) > 0
        
        # Se conta limpa, apenas retorna True e pede nome se não tiver
        if not tem_dados:
            if not nome_empresa_atual:
                nome_empresa_atual = input("\n🏢 Digite o nome da Empresa para a Demo: ").strip()
            return True, nome_empresa_atual            
            
        print(f"\n⚠️  ATENÇÃO: A conta NÃO está vazia!")
        print(f"   • {len(inboxes)} Inboxes encontradas")
        print(f"   • {len(times)} Times encontrados")
        print(f"   • {len(agentes_demo)} Agentes Demo encontrados")
        
        # Se empresa já veio definida (ex: argumento), mostramos. Se não, pedimos depois.
        if nome_empresa_atual:
            print("\nVocê solicitou gerar para: " + nome_empresa_atual)

        print("\nO que deseja fazer?")
        print("   [C] CONTINUAR (Mesclar/Completar dados existentes)")
        print("   [L] LIMPAR TUDO ANTES (Apaga tudo e cria do zero)")
        print("   [S] SAIR (Cancelar)")
        
        resp = input("\nEscolha [C/L/S]: ").upper().strip()
        
        if resp == 'L':
            print("\n🧹 Iniciando limpeza prévia...")
            script_limpeza = os.path.join(os.path.dirname(os.path.abspath(__file__)), "limpar_demo.py")
            
            try:
                subprocess.run([sys.executable, script_limpeza], cwd=os.path.dirname(os.path.dirname(script_limpeza)))
                print("\n✅ Limpeza concluída! Iniciando geração...")
                
                # Resetar cache
                self.cache = {k: [] for k in self.cache}
                self.cache['inbox_id'] = None
                
                # Como limpou, agora é hora de pedir o nome da empresa se não tiver
                if not nome_empresa_atual:
                    nome_empresa_atual = input("\n🏢 Digite o nome da nova Empresa: ").strip()
                
                return True, nome_empresa_atual
            except Exception as e:
                print(f"❌ Erro ao executar limpeza: {e}")
                return False, ""
                
        elif resp == 'C':
            print("\n⏩ Modo CONTINUAR selecionado. Dados serão mesclados/completados.")
            if not nome_empresa_atual:
                # Se for mesclar, talvez o usuário queira usar o nome que já existe na inbox?
                # Ou criar uma nova inbox com outro nome?
                # Vamos simplificar: pede o nome.
                nome_empresa_atual = input("\n🏢 Digite o nome da Empresa para a Demo: ").strip()
            return True, nome_empresa_atual
            
        return False, ""

    def gerar_demo_completa(self, nicho: str, nome_empresa: Optional[str] = None):
        """Gera demo COMPLETA com todas as features"""
        print(f"\n{'='*70}")
        print(f"🚀 GERADOR PRO v2.0 - Nicho: {nicho.upper()}")
        print(f"{'='*70}")
        
        # Carregar template
        template = self.carregar_template(nicho)
        print(f"✅ Template carregado: {template['nome']}")
        
        # Se nome da empresa não veio por argumento, será None aqui.
        # Definimos um default APENAS se precisarmos de fallback automático em modo não-interativo,
        # mas queremos pedir interativamente. Então passamos o que tem para o checker.
        
        # 0. Verificação de Segurança (Mesclar vs Limpar) e Definição de Nome
        sucesso, nome_empresa_final = self._check_and_prompt_clean(nome_empresa)
        
        if not sucesso:
            print("❌ Operação cancelada.")
            return

        # Aplicar nome final (pode ter vindo do input ou do argumento)
        nome_empresa = nome_empresa_final
        if not nome_empresa:
             nome_empresa = f"{template['nome']} Demo PRO" # Fallback último caso

        # 1. Custom Attributes
        attrs = self.criar_custom_attributes(template)
        
        # 2. Custom Roles
        roles = self.criar_custom_roles(template)
        
        # 3. SLA Policies
        slas = self.criar_sla_policies(template)
        
        # 4. Times
        times = self.criar_times(template)
        
        # 5. Agentes
        agentes = self.criar_agentes(template, times)
        
        # 6. Labels
        labels = self.criar_labels(template)
        
        # 7. Respostas Prontas
        respostas = self.criar_respostas_prontas(template)
        
        # 8. Automações
        automacoes = self.criar_automacoes(template, times)
        
        # 9. Inbox
        print(f"\n📥 Criando inbox...")
        inbox_id = self.criar_inbox(nome_empresa)
        if not inbox_id:
            print("❌ Falha ao criar inbox!")
            return
        
        # 10. Contatos (com notas)
        contatos = self.criar_contatos(template.get('num_contatos', 25), template)
        
        if not contatos:
            print("❌ ABORTANDO: Não há contatos disponíveis para levar adiante a criação de conversas.")
            # Não crasha, mas para por aqui
            return

        # 11. Conversas (com atributos, mensagens, notas)
        conversas = self.criar_conversas(template, inbox_id, contatos, agentes)
        
        # Resumo final
        print(f"\n{'='*70}")
        print("✨ DEMO PRO v2.0 GERADA COM SUCESSO! ✨")
        print(f"{'='*70}")
        print(f"\n📊 Resumo Completo:")
        print(f"  🏢 Empresa: {nome_empresa}")
        print(f"  🏪 Nicho: {template['nome']}")
        print(f"  📥 Inbox ID: {inbox_id}")
        print(f"\n⚙️  Configurações Avançadas:")
        print(f"  • Custom Attributes: {len(attrs)}")
        print(f"  • Custom Roles: {len(roles)}")
        print(f"  • SLA Policies: {len(slas)}")
        print(f"\n👥 Recursos Organizacionais:")
        print(f"  • Times: {len(times)}")
        print(f"  • Agentes: {len(agentes)}")
        print(f"\n💬 Conteúdo:")
        print(f"  • Contatos: {len(contatos)} (com notas)")
        print(f"  • Conversas: {len(conversas)} (com atributos)")
        print(f"  • Labels: {len(labels)}")
        print(f"  • Respostas Prontas: {len(respostas)}")
        print(f"  • Automações: {len(automacoes)}")
        print(f"{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Gerador PRO v2.0 de Demos - WhatPro Chat',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('--nicho', type=str, help='Nicho para gerar demo')
    parser.add_argument('--empresa', type=str, help='Nome da empresa')
    
    args = parser.parse_args()
    
    if not args.nicho:
        print("Uso: python gerar_demo_pro.py --nicho <nicho> [--empresa <nome>]")
        print("\nNichos disponíveis: ecommerce, contabilidade, concessionaria, paroquia, pecas-moto")
        return
    
    # Obter config validada
    config = obter_config_validada()
    if not config:
        return
    
    # Gerar demo
    generator = ChatwootProGenerator(
        config['api_url'], 
        config['api_key'], 
        int(config['account_id'])
    )
    generator.gerar_demo_completa(args.nicho, args.empresa)


if __name__ == "__main__":
    main()
