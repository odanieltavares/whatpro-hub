#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Gerador de Demos Mockadas por Nicho
Sistema de geração automatizada de dados para demonstrações do Chatwoot
"""

import json
import os
import sys
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
# Adicionar diretório raiz ao path para importar lib
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from lib.config import obter_config_validada

# Configuração do Faker para português do Brasil
fake = Faker('pt_BR')

class ChatwootDemoGenerator:
    """Gerador de demos mockadas para Chatwoot"""
    
    def __init__(self, api_url: str, api_key: str, account_id: int):
        """
        Inicializa o gerador
        
        Args:
            api_url: URL base da API do Chatwoot (ex: https://app.chatwoot.com)
            api_key: Chave de API do Chatwoot
            account_id: ID da conta no Chatwoot
        """
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.account_id = account_id
        self.headers = {
            'api_access_token': api_key,
            'Content-Type': 'application/json'
        }
        self.base_endpoint = f"{self.api_url}/api/v1/accounts/{self.account_id}"
        
    def carregar_template(self, nicho: str) -> Dict:
        """Carrega template de nicho específico"""
        # Caminho relativo a partir de scripts/
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(base_path, "templates", f"{nicho}.json")
        
        if not os.path.exists(template_path):
            print(f"❌ Template '{nicho}' não encontrado!")
            print(f"📁 Templates disponíveis:")
            self.listar_templates()
            sys.exit(1)
            
        with open(template_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def listar_templates(self):
        """Lista todos os templates disponíveis"""
        if not os.path.exists('templates'):
            print("⚠️  Pasta 'templates' não encontrada!")
            return
            
        templates = [f.replace('.json', '') for f in os.listdir('templates') if f.endswith('.json')]
        for t in templates:
            print(f"  • {t}")
    
    def gerar_agentes(self, quantidade: int = 5) -> List[Dict]:
        """Gera agentes fictícios"""
        agentes = []
        cargos = ["Atendente", "Supervisor", "Gerente", "Suporte", "Vendedor"]
        
        for i in range(quantidade):
            agente = {
                "name": fake.name(),
                "email": fake.email(),
                "role": random.choice(cargos)
            }
            agentes.append(agente)
        
        return agentes
    
    def gerar_contatos(self, quantidade: int, template: Dict) -> List[Dict]:
        """Gera contatos fictícios baseados no template"""
        contatos = []
        
        for i in range(quantidade):
            contato = {
                "name": fake.name(),
                "email": fake.email(),
                "phone_number": fake.cellphone_number(),
                "custom_attributes": {}
            }
            
            # Adiciona atributos personalizados do nicho
            if "custom_attributes" in template:
                for attr, valores in template["custom_attributes"].items():
                    contato["custom_attributes"][attr] = random.choice(valores)
            
            contatos.append(contato)
        
        return contatos
    
    def gerar_conversas(self, template: Dict, contatos: List[Dict], quantidade: int = 30) -> List[Dict]:
        """Gera conversas fictícias baseadas no template"""
        conversas = []
        status_opcoes = ["open", "resolved", "pending"]
        
        exemplos_msgs = template.get("exemplo_mensagens", [])
        etiquetas = template.get("etiquetas", [])
        
        for i in range(quantidade):
            # Escolhe um contato aleatório
            contato = random.choice(contatos)
            
            # Define status e prioridade
            status = random.choice(status_opcoes)
            prioridade = random.choice(["low", "medium", "high", None])
            
            # Gera histórico de mensagens
            num_mensagens = random.randint(2, 8)
            mensagens = []
            
            # Primeira mensagem sempre do cliente
            msg_inicial = random.choice(exemplos_msgs.get("cliente", ["Olá, preciso de ajuda"]))
            mensagens.append({
                "content": msg_inicial,
                "message_type": "incoming",
                "created_at": self._gerar_timestamp_recente()
            })
            
            # Mensagens subsequentes alternando entre cliente e agente
            for j in range(1, num_mensagens):
                is_agente = j % 2 == 1
                
                if is_agente:
                    conteudo = random.choice(exemplos_msgs.get("agente", ["Como posso ajudar?"]))
                    tipo = "outgoing"
                else:
                    conteudo = random.choice(exemplos_msgs.get("cliente", ["Obrigado"]))
                    tipo = "incoming"
                
                mensagens.append({
                    "content": conteudo,
                    "message_type": tipo,
                    "created_at": self._gerar_timestamp_recente()
                })
            
            conversa = {
                "contato": contato,
                "status": status,
                "priority": prioridade,
                "mensagens": mensagens,
                "labels": random.sample(etiquetas, k=min(3, len(etiquetas)))
            }
            
            conversas.append(conversa)
        
        return conversas
    
    def _gerar_timestamp_recente(self) -> str:
        """Gera timestamp dos últimos 30 dias"""
        dias_atras = random.randint(0, 30)
        horas_atras = random.randint(0, 23)
        data = datetime.now() - timedelta(days=dias_atras, hours=horas_atras)
        return data.isoformat()
    
    def criar_inbox(self, nome: str, canal: str = "website") -> Optional[int]:
        """Cria uma inbox no Chatwoot"""
        endpoint = f"{self.base_endpoint}/inboxes"
        
        payload = {
            "name": nome,
            "channel": {
                "type": canal,
                "website_url": "https://exemplo.com"
            }
        }
        
        try:
            response = requests.post(endpoint, headers=self.headers, json=payload)
            if response.status_code in [200, 201]:
                inbox_id = response.json().get('id')
                print(f"✅ Inbox '{nome}' criada com sucesso (ID: {inbox_id})")
                return inbox_id
            else:
                print(f"⚠️  Erro ao criar inbox: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Erro: {e}")
            return None
    
    def criar_contato(self, contato: Dict, inbox_id: int) -> Optional[int]:
        """Cria um contato no Chatwoot"""
        endpoint = f"{self.base_endpoint}/contacts"
        
        try:
            response = requests.post(endpoint, headers=self.headers, json=contato)
            if response.status_code in [200, 201]:
                return response.json().get('id')
            return None
        except Exception as e:
            print(f"⚠️  Erro ao criar contato: {e}")
            return None
    
    def criar_conversa(self, conversa: Dict, inbox_id: int, contato_id: int):
        """Cria uma conversa no Chatwoot"""
        endpoint = f"{self.base_endpoint}/conversations"
        
        payload = {
            "inbox_id": inbox_id,
            "contact_id": contato_id,
            "status": conversa["status"]
        }
        
        try:
            response = requests.post(endpoint, headers=self.headers, json=payload)
            if response.status_code in [200, 201]:
                conv_id = response.json().get('id')
                
                # Adiciona mensagens
                for msg in conversa["mensagens"]:
                    self._adicionar_mensagem(conv_id, msg)
                
                # Adiciona etiquetas
                if conversa.get("labels"):
                    self._adicionar_etiquetas(conv_id, conversa["labels"])
                
                return conv_id
            return None
        except Exception as e:
            print(f"⚠️  Erro ao criar conversa: {e}")
            return None
    
    def _adicionar_mensagem(self, conversa_id: int, mensagem: Dict):
        """Adiciona mensagem a uma conversa"""
        endpoint = f"{self.base_endpoint}/conversations/{conversa_id}/messages"
        
        payload = {
            "content": mensagem["content"],
            "message_type": mensagem["message_type"]
        }
        
        try:
            requests.post(endpoint, headers=self.headers, json=payload)
        except:
            pass
    
    def _adicionar_etiquetas(self, conversa_id: int, etiquetas: List[str]):
        """Adiciona etiquetas a uma conversa"""
        endpoint = f"{self.base_endpoint}/conversations/{conversa_id}/labels"
        
        payload = {"labels": etiquetas}
        
        try:
            requests.post(endpoint, headers=self.headers, json=payload)
        except:
            pass
    
    def gerar_demo_completa(self, nicho: str, nome_empresa: Optional[str] = None):
        """Gera demo completa para um nicho específico"""
        print(f"\n🚀 Gerando demo para o nicho: {nicho.upper()}")
        print("=" * 60)
        
        # Carrega template
        template = self.carregar_template(nicho)
        print(f"✅ Template carregado: {template['nome']}")
        
        # Nome da empresa
        if not nome_empresa:
            nome_empresa = f"{template['nome']} Demo"
        
        # 1. Criar Inbox
        print("\n📥 Criando inbox...")
        inbox_id = self.criar_inbox(nome_empresa, canal="website")
        if not inbox_id:
            print("❌ Falha ao criar inbox. Verifique as credenciais da API.")
            return
        
        # 2. Gerar e criar contatos
        print(f"\n👥 Gerando {template.get('num_contatos', 20)} contatos...")
        contatos_data = self.gerar_contatos(template.get('num_contatos', 20), template)
        contatos_criados = []
        
        for i, contato in enumerate(contatos_data, 1):
            contato_id = self.criar_contato(contato, inbox_id)
            if contato_id:
                contatos_criados.append({"id": contato_id, **contato})
                if i % 5 == 0:
                    print(f"  • {i} contatos criados...")
        
        print(f"✅ {len(contatos_criados)} contatos criados com sucesso!")
        
        # 3. Gerar e criar conversas
        print(f"\n💬 Gerando {template.get('num_conversas', 30)} conversas...")
        conversas = self.gerar_conversas(template, contatos_criados, template.get('num_conversas', 30))
        
        conversas_criadas = 0
        for i, conversa in enumerate(conversas, 1):
            contato_escolhido = random.choice(contatos_criados)
            conv_id = self.criar_conversa(conversa, inbox_id, contato_escolhido["id"])
            if conv_id:
                conversas_criadas += 1
                if i % 5 == 0:
                    print(f"  • {i} conversas processadas...")
        
        print(f"✅ {conversas_criadas} conversas criadas com sucesso!")
        
        # Resumo final
        print("\n" + "=" * 60)
        print("✨ DEMO GERADA COM SUCESSO! ✨")
        print("=" * 60)
        print(f"📊 Resumo:")
        print(f"  • Nicho: {template['nome']}")
        print(f"  • Empresa: {nome_empresa}")
        print(f"  • Inbox ID: {inbox_id}")
        print(f"  • Contatos: {len(contatos_criados)}")
        print(f"  • Conversas: {conversas_criadas}")
        print(f"  • Etiquetas: {', '.join(template.get('etiquetas', []))}")
        print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description='Gerador de Demos Mockadas para WhatPro Chat (Chatwoot)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  python gerar_demo.py --nicho ecommerce --empresa "Loja Virtual Demo"
  python gerar_demo.py --nicho contabilidade
  python gerar_demo.py --list
  
Configure as variáveis de ambiente:
  export CHATWOOT_API_URL="https://app.chatwoot.com"
  export CHATWOOT_API_KEY="sua-chave-api"
  export CHATWOOT_ACCOUNT_ID="1"
        """
    )
    
    parser.add_argument('--nicho', type=str, help='Nicho para gerar demo')
    parser.add_argument('--empresa', type=str, help='Nome da empresa (opcional)')
    parser.add_argument('--list', action='store_true', help='Listar nichos disponíveis')
    
    parser.add_argument('--api-url', type=str, help='URL da API do Chatwoot')
    parser.add_argument('--api-key', type=str, help='Chave da API')
    parser.add_argument('--account-id', type=int, help='ID da conta')
    
    args = parser.parse_args()
    
    # Listar templates
    if args.list:
        print("\n📋 Nichos disponíveis:")
        print("=" * 40)
        generator = ChatwootDemoGenerator("", "", 0)
        generator.listar_templates()
        print("=" * 40)
        return
    
    # Validar nicho
    if not args.nicho:
        parser.print_help()
        return
    
    args = parser.parse_args()
    
    # Obter config validada
    config = obter_config_validada()
    if not config:
        return
    
    # Criar gerador e executar
    generator = ChatwootDemoGenerator(
        config['api_url'], 
        config['api_key'], 
        int(config['account_id'])
    )
    generator.gerar_demo_completa(args.nicho, args.empresa)


if __name__ == "__main__":
    main()
