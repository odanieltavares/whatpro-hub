#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Inicializador Automático
Verifica dependências, .env e inicia o sistema
"""

import os
import sys
import subprocess

def limpar_tela():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_banner():
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           🚀 WHATPRO CHAT - GERADOR DE DEMOS 🚀                  ║
║                  Inicializador Automático                         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

def verificar_python():
    """Verifica versão do Python"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python 3.7+ é necessário!")
        print(f"   Você tem: Python {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor} OK")
    return True

def verificar_dependencias():
    """Verifica se dependências estão instaladas"""
    try:
        import requests
        from faker import Faker
        print("✅ Dependências instaladas")
        return True
    except ImportError:
        print("❌ Dependências não instaladas")
        return False

def instalar_dependencias():
    """Instala dependências automaticamente"""
    print("\n📦 Instalando dependências...")
    print("   Isso pode levar alguns segundos...\n")
    
    python_cmd = 'python' if os.name == 'nt' else 'python3'
    
    try:
        if os.name == 'nt':  # Windows
            subprocess.run([python_cmd, '-m', 'pip', 'install', 'faker', 'requests'], 
                         check=True, capture_output=True)
        else:  # Linux/Mac
            subprocess.run([python_cmd, '-m', 'pip', 'install', 'faker', 'requests', '--break-system-packages'], 
                         check=True, capture_output=True)
        
        print("✅ Dependências instaladas com sucesso!")
        return True
        
    except subprocess.CalledProcessError:
        print("❌ Erro ao instalar dependências")
        print("\n💡 Tente manualmente:")
        print(f"   {python_cmd} -m pip install faker requests")
        return False

def verificar_env():
    """Verifica se .env existe e está configurado"""
    if not os.path.exists('.env'):
        print("❌ Arquivo .env não encontrado")
        return False
    
    with open('.env', 'r', encoding='utf-8') as f:
        conteudo = f.read()
        
    if 'CHATWOOT_API_URL=' in conteudo and \
       'CHATWOOT_API_KEY=' in conteudo and \
       'CHATWOOT_ACCOUNT_ID=' in conteudo:
        print("✅ Arquivo .env configurado")
        return True
    else:
        print("⚠️  Arquivo .env existe mas não está configurado")
        return False

def criar_env_exemplo():
    """Cria .env se não existir"""
    if not os.path.exists('.env') and os.path.exists('.env.example'):
        import shutil
        shutil.copy('.env.example', '.env')
        print("📝 Arquivo .env criado do exemplo")
        return True
    return False

def main():
    limpar_tela()
    print_banner()
    
    print("\n🔍 VERIFICAÇÃO AUTOMÁTICA\n")
    
    # 1. Verificar Python
    if not verificar_python():
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    
    # 2. Verificar dependências
    deps_ok = verificar_dependencias()
    
    if not deps_ok:
        print("\n💡 Deseja instalar as dependências automaticamente?")
        resposta = input("   (s/n): ").strip().lower()
        
        if resposta == 's':
            deps_ok = instalar_dependencias()
        else:
            print("\n❌ Dependências são necessárias para continuar!")
            input("\nPressione ENTER para sair...")
            sys.exit(1)
    
    if not deps_ok:
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    
    # 3. Verificar .env
    print()
    if not os.path.exists('.env'):
        print("📝 Criando arquivo .env...")
        criar_env_exemplo()
    
    env_ok = verificar_env()
    
    if not env_ok:
        print("\n💡 O arquivo .env precisa ser configurado antes de usar o sistema.")
        print("   Você pode configurar agora pelo menu ou manualmente.\n")
    
    # 4. Tudo OK, iniciar sistema
    print("\n" + "="*70)
    print("✅ VERIFICAÇÃO COMPLETA!")
    print("="*70)
    
    input("\nPressione ENTER para iniciar o sistema...")
    
    # Iniciar menu completo
    python_cmd = 'python' if os.name == 'nt' else 'python3'
    
    try:
        subprocess.run([python_cmd, 'menu_completo.py'])
    except KeyboardInterrupt:
        limpar_tela()
        print("\n👋 Sistema encerrado pelo usuário.\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erro ao iniciar sistema: {e}")
        input("\nPressione ENTER para sair...")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        limpar_tela()
        print("\n👋 Sistema encerrado pelo usuário.\n")
        sys.exit(0)
