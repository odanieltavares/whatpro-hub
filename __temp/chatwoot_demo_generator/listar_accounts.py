#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Listar Accounts/Empresas - WhatPro Chat
Lista todas as contas que seu token de acesso tem permissão
"""

import os
import sys
import json
from typing import List, Dict

try:
    import requests
except ImportError:
    print("❌ Instalando dependências...")
    os.system("pip install requests --break-system-packages")
    import requests

def carregar_config():
    """Carrega configurações do .env"""
    config = {}
    
    # Tentar ler do .env
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for linha in f:
                linha = linha.strip()
                if linha and not linha.startswith('#'):
                    if '=' in linha:
                        chave, valor = linha.split('=', 1)
                        config[chave.strip()] = valor.strip()
    
    # Tentar variáveis de ambiente
    config['api_url'] = config.get('CHATWOOT_API_URL') or os.getenv('CHATWOOT_API_URL')
    config['api_key'] = config.get('CHATWOOT_API_KEY') or os.getenv('CHATWOOT_API_KEY')
    
    return config

def listar_accounts(api_url: str, api_key: str) -> List[Dict]:
    """Lista todas as contas/empresas disponíveis"""
    
    url = f"{api_url.rstrip('/')}/api/v1/accounts"
    
    headers = {
        'api_access_token': api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            print("❌ ERRO: API Key inválida ou expirada")
            print("   Gere uma nova em: Settings → Profile → Access Token")
            return []
        elif response.status_code == 403:
            print("❌ ERRO: Sem permissão de acesso")
            return []
        else:
            print(f"❌ ERRO: {response.status_code}")
            print(f"   Resposta: {response.text}")
            return []
            
    except requests.exceptions.ConnectionError:
        print(f"❌ ERRO: Não foi possível conectar a {api_url}")
        print("   Verifique se a URL está correta e se você tem internet")
        return []
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return []

def exibir_accounts(accounts: List[Dict]):
    """Exibe as contas de forma formatada"""
    
    if not accounts:
        print("\n❌ Nenhuma conta encontrada.")
        return
    
    print(f"\n{'='*70}")
    print(f"  📊 CONTAS/EMPRESAS DISPONÍVEIS ({len(accounts)})")
    print(f"{'='*70}\n")
    
    for i, account in enumerate(accounts, 1):
        account_id = account.get('id')
        name = account.get('name', 'Sem nome')
        locale = account.get('locale', 'pt_BR')
        domain = account.get('domain', 'N/A')
        support_email = account.get('support_email', 'N/A')
        
        # Status da conta
        status = account.get('status', 'active')
        status_emoji = '✅' if status == 'active' else '❌'
        
        print(f"[{i}] {status_emoji} {name}")
        print(f"    ID: {account_id}")
        print(f"    Domínio: {domain}")
        print(f"    Email: {support_email}")
        print(f"    Idioma: {locale}")
        print(f"    Status: {status}")
        
        # Features disponíveis
        features = account.get('features', {})
        if features:
            print(f"    Features ativas: {', '.join([k for k, v in features.items() if v])}")
        
        print()
    
    print(f"{'='*70}\n")

def obter_detalhes_account(api_url: str, api_key: str, account_id: int) -> Dict:
    """Obtém detalhes completos de uma conta específica"""
    
    url = f"{api_url.rstrip('/')}/api/v1/accounts/{account_id}"
    
    headers = {
        'api_access_token': api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {}
            
    except Exception as e:
        print(f"❌ Erro ao obter detalhes: {e}")
        return {}

def main():
    print(f"\n{'='*70}")
    print("  🏢 LISTAR CONTAS/EMPRESAS - WhatPro Chat")
    print(f"{'='*70}\n")
    
    # Carregar configuração
    config = carregar_config()
    
    api_url = config.get('api_url')
    api_key = config.get('api_key')
    
    # Validar credenciais
    if not api_url or not api_key:
        print("❌ ERRO: Credenciais não configuradas!")
        print("\n📝 Configure o arquivo .env com:")
        print("   CHATWOOT_API_URL=https://chat.whatpro.com.br")
        print("   CHATWOOT_API_KEY=sua-chave-aqui")
        print("\n💡 Ou passe como argumentos:")
        print("   python listar_accounts.py --api-url URL --api-key KEY")
        sys.exit(1)
    
    print(f"🔗 Conectando a: {api_url}")
    print(f"🔑 Token: {api_key[:10]}...{api_key[-10:]}\n")
    
    # Listar accounts
    print("⏳ Buscando contas...")
    accounts = listar_accounts(api_url, api_key)
    
    # Exibir
    exibir_accounts(accounts)
    
    # Opção de ver detalhes
    if accounts:
        print("\n💡 DICA: Use o ID da conta no seu .env:")
        print(f"   CHATWOOT_ACCOUNT_ID={accounts[0]['id']}")
        print()
        
        # Salvar em JSON (opcional)
        try:
            with open('accounts.json', 'w', encoding='utf-8') as f:
                json.dump(accounts, f, ensure_ascii=False, indent=2)
            print("✅ Lista salva em: accounts.json\n")
        except:
            pass
        
        # Perguntar se quer detalhes
        if len(accounts) == 1:
            print(f"📊 Você tem acesso a 1 conta: '{accounts[0]['name']}'")
            print(f"   Use este ID no .env: CHATWOOT_ACCOUNT_ID={accounts[0]['id']}")
        else:
            print(f"📊 Você tem acesso a {len(accounts)} contas.")
            print("   Escolha qual usar no .env: CHATWOOT_ACCOUNT_ID=ID")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Listar contas/empresas do Chatwoot')
    parser.add_argument('--api-url', type=str, help='URL da API')
    parser.add_argument('--api-key', type=str, help='Chave da API')
    parser.add_argument('--json', action='store_true', help='Exibir em JSON')
    
    args = parser.parse_args()
    
    # Se passou argumentos, sobrescrever .env
    if args.api_url:
        os.environ['CHATWOOT_API_URL'] = args.api_url
    if args.api_key:
        os.environ['CHATWOOT_API_KEY'] = args.api_key
    
    main()
