#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Menu Principal v2.2 (Correção de Paths)
Interface unificada para o Gerador de Demos (Básico e PRO)
"""

import os
import sys
import time
import subprocess
from lib.config import obter_config_validada

# Determinar diretório raiz do projeto de forma robusta
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# print(f"DEBUG: Executando em {BASE_DIR}") # Descomentar se necessário debugar

def get_script_path(script_name):
    """Retorna caminho absoluto para scripts na pasta scripts/"""
    return os.path.join(BASE_DIR, "scripts", script_name)

def limpar_tela():
    os.system('cls' if os.name == 'nt' else 'clear')

def mostrar_cabecalho():
    limpar_tela()
    print("="*60)
    print("   🤖 WHATPRO CHAT - DEMO GENERATOR")
    print("="*60)
    print("   Ferramenta para criar e gerenciar ambientes de demo.")
    print("="*60)
    print()

def verificar_dependencias():
    try:
        import faker
        import requests
        import dotenv
    except ImportError:
        print("📦 Instalando dependências...")
        requirements_path = os.path.join(BASE_DIR, "requirements.txt")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_path], cwd=BASE_DIR)
        print("✅ Dependências instaladas!")
        time.sleep(1)

def menu_principal():
    verificar_dependencias()
    
    # Validar conexão e carregar config
    config = obter_config_validada()
    if not config:
        input("\nPressione ENTER para sair...")
        return

    while True:
        mostrar_cabecalho()
        print(f"📡 Conectado em: {config['api_url']} (Conta: {config['account_id']})")
        print("-" * 60)
        print("1. 🚀 Gerar Demo PRO (Recomendado - Completa com SLAs/Roles)")
        print("2. ⚡ Gerar Demo BÁSICA (Apenas contatos/conversas simples)")
        print("3. 🧹 Limpar Conta (Remover TUDO)")
        print("4. 📊 Ver Status da Conta")
        print("0. ❌ Sair")
        print("="*60)
        
        # input().strip() previne erros com espaços
        opcao = input("\nEscolha uma opção: ").strip()
        
        if opcao == '1': # Gerar Demo PRO
            menu_nicho(config, tipo="pro")
        elif opcao == '2': # Gerar Demo Básica
            menu_nicho(config, tipo="basica")
        elif opcao == '3': # Limpar
            menu_limpeza()
        elif opcao == '4': # Ver Conta
            script = get_script_path("ver_conta.py")
            subprocess.run([sys.executable, script], cwd=BASE_DIR)
            input("\nPressione ENTER para continuar...")
        elif opcao == '0':
            print("\nAté logo! 👋")
            break
        else:
            print("❌ Opção inválida!")
            time.sleep(1)

def menu_limpeza():
    mostrar_cabecalho()
    print("🧹 MENU DE LIMPEZA")
    print("-" * 30)
    print("⚠️  AVISO: Esta ação é IRREVERSÍVEL!")
    print("Isso apagará conversas, contatos, times, automações, etc.")
    print("-" * 30)
    print("1. Confirmar Limpeza Completa")
    print("0. Cancelar e Voltar")
    
    op = input("\nOpção: ").strip()
    
    if op == '1':
        print("\nPara confirmar, digite 'LIMPAR' em maiúsculas:")
        confirm = input("> ").strip()
        if confirm == 'LIMPAR':
            script = get_script_path("limpar_demo.py")
            subprocess.run([sys.executable, script], cwd=BASE_DIR)
        else:
            print("❌ Confirmação incorreta. Cancelado.")
    
    input("\nPressione ENTER para continuar...")

def menu_nicho(config, tipo="pro"):
    while True:
        mostrar_cabecalho()
        titulo = "PRO (Completa)" if tipo == "pro" else "BÁSICA (Simples)"
        print(f"📍 ESCOLHA O NICHO DA DEMO {titulo}:")
        print("-" * 30)
        print("1. 🏪 Concessionária de Veículos")
        print("2. 💼 Escritório de Contabilidade")
        print("3. ✝️  Paróquia / Igreja")
        print("4. 🏍️  Loja de Peças de Moto")
        print("5. 🛒 E-commerce (Varejo)")
        print("0. 🔙 Voltar ao Menu Principal")
        print("-" * 30)
        
        opcao = input("\nOpção: ").strip()
        
        nichos = {
            '1': ('concessionaria', 'Auto Motors'),
            '2': ('contabilidade', 'Confiança Contábil'),
            '3': ('paroquia', 'Paróquia São José'),
            '4': ('pecas-moto', 'MotoParts Express'),
            '5': ('ecommerce', 'Loja Virtual Demo')
        }
        
        if opcao == '0':
            break
            
        if opcao in nichos:
            nicho, empresa_padrao = nichos[opcao]
            
            # empresa = input(f"\nNome da Empresa (Enter para '{empresa_padrao}'): ").strip() or empresa_padrao
            # Removido: O script agora pede o nome após verificar se a conta está limpa.
            
            script_name = "gerar_demo_pro.py" if tipo == "pro" else "gerar_demo.py"
            script_path = get_script_path(script_name)
            
            # Verificar existência antes de tentar rodar
            if not os.path.exists(script_path):
                print(f"❌ Script não encontrado: {script_path}")
                print("Verifique se a pasta 'scripts' contém todos os arquivos necessários.")
                time.sleep(3)
                break

            print(f"\n🚀 Iniciando geração {tipo.upper()} para: {nicho.upper()}...")
            
            # Executar script (sem mandar empresa, o script vai pedir se precisar)
            cmd = [sys.executable, script_path, "--nicho", nicho]
            # Se for demo básica, ela ainda espera --empresa ou pede lá? 
            # O script básico não tem a verificação avançada. Vamos passar empresa_padrao para o básico
            if tipo == "basica":
                 # Para o básico mantemos o comportamento simples por enquanto ou migramos?
                 # O usuário falou do fluxo de verificação. Isso é mais pro PRO.
                 # Mas se eu não passar e o básico pedir, ok. Se ele exigir argumento, quebra.
                 # O básico pede via argparse mas não exige. Se não tiver, ele usa default ou pede?
                 # Vou passar empresa_padrao como argumento pro básico para não quebrar.
                 cmd.extend(["--empresa", empresa_padrao])
                 
            subprocess.run(cmd, cwd=BASE_DIR)
            
            input("\n✨ Pressione ENTER para voltar ao menu...")
            break
        else:
            print("❌ Opção inválida! Tente 1, 2, 3, 4, 5 ou 0.")
            time.sleep(1)

if __name__ == "__main__":
    menu_principal()
