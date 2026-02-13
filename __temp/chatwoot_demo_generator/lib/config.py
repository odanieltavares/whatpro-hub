#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Configuração Centralizada
Módulo para carregar e validar configurações do .env
"""

import os
import sys
from typing import Dict, Optional

try:
    import requests
except ImportError:
    print("❌ Instalando requests...")
    os.system("pip install requests --break-system-packages")
    import requests


def carregar_config() -> Dict[str, Optional[str]]:
    """
    Carrega configurações do .env e variáveis de ambiente.
    Prioridade: .env > variáveis de ambiente
    """
    config = {}
    
    # Tentar carregar do .env (na raiz do projeto, um nível acima de lib)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(current_dir)
    env_path = os.path.join(root_dir, '.env')
    
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for linha in f:
                linha = linha.strip()
                if linha and not linha.startswith('#') and '=' in linha:
                    chave, valor = linha.split('=', 1)
                    config[chave.strip()] = valor.strip()
    
    return {
        'api_url': config.get('CHATWOOT_API_URL') or os.getenv('CHATWOOT_API_URL'),
        'api_key': config.get('CHATWOOT_API_KEY') or os.getenv('CHATWOOT_API_KEY'),
        'account_id': config.get('CHATWOOT_ACCOUNT_ID') or os.getenv('CHATWOOT_ACCOUNT_ID')
    }


def validar_config(config: Dict) -> bool:
    """Valida se todas as configurações necessárias estão presentes"""
    campos = ['api_url', 'api_key', 'account_id']
    
    for campo in campos:
        if not config.get(campo):
            print(f"❌ Configuração '{campo}' não encontrada!")
            return False
    
    return True


def testar_conexao(config: Dict) -> bool:
    """
    Testa a conexão com a API do Chatwoot.
    Retorna True se conectou com sucesso.
    """
    api_url = config['api_url'].rstrip('/')
    api_key = config['api_key']
    account_id = config['account_id']
    
    headers = {
        'api_access_token': api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        # Testar listando agentes (endpoint simples)
        url = f"{api_url}/api/v1/accounts/{account_id}/agents"
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return True
        elif response.status_code == 401:
            print("❌ Erro de autenticação! Verifique sua API Key.")
            return False
        elif response.status_code == 404:
            print("❌ Account ID não encontrado! Verifique o ID da conta.")
            return False
        else:
            print(f"❌ Erro na conexão: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Não foi possível conectar em: {api_url}")
        return False
    except requests.exceptions.Timeout:
        print("❌ Timeout na conexão!")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
        return False


def obter_config_validada() -> Optional[Dict]:
    """
    Carrega, valida e testa a configuração.
    Retorna config se tudo OK, None se falhar.
    """
    print("🔄 Carregando configurações...")
    config = carregar_config()
    
    if not validar_config(config):
        print("\n💡 Configure o arquivo .env com:")
        print("   CHATWOOT_API_URL=https://chat.seudominio.com.br")
        print("   CHATWOOT_API_KEY=sua-chave-de-api")
        print("   CHATWOOT_ACCOUNT_ID=1")
        return None
    
    print("✅ Configurações carregadas!")
    print(f"   URL: {config['api_url']}")
    print(f"   Account ID: {config['account_id']}")
    
    print("\n🔗 Testando conexão...")
    if not testar_conexao(config):
        return None
    
    print("✅ Conexão OK!\n")
    return config


# Para teste direto
if __name__ == "__main__":
    config = obter_config_validada()
    if config:
        print("🎉 Tudo pronto para usar!")
    else:
        sys.exit(1)
