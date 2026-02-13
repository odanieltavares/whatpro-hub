#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Quickstart Interativo
Interface amigável para gerar demos rapidamente
"""

import os
import sys
import subprocess

def limpar_tela():
    """Limpa a tela do terminal"""
    os.system('clear' if os.name != 'nt' else 'cls')

def mostrar_banner():
    """Mostra banner do sistema"""
    print("=" * 70)
    print("""
    ██╗    ██╗██╗  ██╗ █████╗ ████████╗██████╗ ██████╗  ██████╗ 
    ██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔═══██╗
    ██║ █╗ ██║███████║███████║   ██║   ██████╔╝██████╔╝██║   ██║
    ██║███╗██║██╔══██║██╔══██║   ██║   ██╔═══╝ ██╔══██╗██║   ██║
    ╚███╔███╔╝██║  ██║██║  ██║   ██║   ██║     ██║  ██║╚██████╔╝
     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝ ╚═════╝ 
    """)
    print("    🚀 Gerador de Demos Mockadas - Versão 1.0")
    print("=" * 70)

def verificar_configuracao():
    """Verifica se as variáveis de ambiente estão configuradas"""
    api_url = os.getenv('CHATWOOT_API_URL')
    api_key = os.getenv('CHATWOOT_API_KEY')
    account_id = os.getenv('CHATWOOT_ACCOUNT_ID')
    
    if not all([api_url, api_key, account_id]):
        print("\n⚠️  CONFIGURAÇÃO NECESSÁRIA\n")
        print("Antes de continuar, você precisa configurar as credenciais da API.")
        print("\nOpção 1: Criar arquivo .env (recomendado)")
        print("  1. Copie o arquivo .env.example para .env")
        print("  2. Edite o .env com suas credenciais")
        print("\nOpção 2: Variáveis de ambiente")
        print("  export CHATWOOT_API_URL='https://app.chatwoot.com'")
        print("  export CHATWOOT_API_KEY='sua-chave'")
        print("  export CHATWOOT_ACCOUNT_ID='1'")
        print("\n" + "=" * 70)
        return False
    
    return True

def mostrar_nichos():
    """Lista os nichos disponíveis"""
    nichos = {
        '1': {'nome': 'contabilidade', 'desc': 'Escritório de Contabilidade'},
        '2': {'nome': 'concessionaria', 'desc': 'Concessionária de Veículos'},
        '3': {'nome': 'pecas-moto', 'desc': 'Loja de Peças para Moto'},
        '4': {'nome': 'paroquia', 'desc': 'Paróquia / Igreja'},
        '5': {'nome': 'ecommerce', 'desc': 'E-commerce / Loja Virtual'},
        '6': {'nome': 'saude', 'desc': 'Clínica / Saúde'},
        '7': {'nome': 'imobiliaria', 'desc': 'Imobiliária'},
        '8': {'nome': 'restaurante', 'desc': 'Restaurante / Delivery'},
        '9': {'nome': 'educacao', 'desc': 'Escola / Educação'},
    }
    
    print("\n📋 NICHOS DISPONÍVEIS:\n")
    for num, info in nichos.items():
        print(f"  {num}. {info['desc']}")
    
    return nichos

def menu_principal():
    """Menu principal interativo"""
    while True:
        limpar_tela()
        mostrar_banner()
        
        if not verificar_configuracao():
            input("\nPressione ENTER para sair...")
            sys.exit(1)
        
        print("\n🎯 O QUE VOCÊ QUER FAZER?\n")
        print("  1. 🚀 Gerar nova demo")
        print("  2. 🧹 Limpar demos existentes")
        print("  3. 📋 Ver nichos disponíveis")
        print("  4. 🆘 Ajuda")
        print("  5. ❌ Sair")
        
        escolha = input("\nEscolha uma opção (1-5): ").strip()
        
        if escolha == '1':
            gerar_demo()
        elif escolha == '2':
            limpar_demos()
        elif escolha == '3':
            ver_nichos()
        elif escolha == '4':
            mostrar_ajuda()
        elif escolha == '5':
            print("\n👋 Até logo!")
            sys.exit(0)
        else:
            print("\n❌ Opção inválida!")
            input("Pressione ENTER para continuar...")

def gerar_demo():
    """Fluxo de geração de demo"""
    limpar_tela()
    mostrar_banner()
    
    nichos = mostrar_nichos()
    
    print("\n" + "-" * 70)
    escolha = input("\nEscolha o nicho (1-9) ou 0 para voltar: ").strip()
    
    if escolha == '0':
        return
    
    if escolha not in nichos:
        print("\n❌ Opção inválida!")
        input("Pressione ENTER para continuar...")
        return
    
    nicho_selecionado = nichos[escolha]['nome']
    nicho_desc = nichos[escolha]['desc']
    
    print(f"\n✅ Nicho selecionado: {nicho_desc}")
    print("\n" + "-" * 70)
    
    nome_empresa = input("\nNome da empresa (deixe vazio para usar padrão): ").strip()
    
    print("\n" + "=" * 70)
    print(f"🚀 Gerando demo para: {nicho_desc}")
    if nome_empresa:
        print(f"📍 Nome: {nome_empresa}")
    print("⏳ Aguarde, isso pode levar alguns minutos...")
    print("=" * 70 + "\n")
    
    # Executar comando
    cmd = ['python', 'gerar_demo.py', '--nicho', nicho_selecionado]
    if nome_empresa:
        cmd.extend(['--empresa', nome_empresa])
    
    try:
        subprocess.run(cmd, check=True)
        print("\n" + "=" * 70)
        print("✅ Demo gerada com sucesso!")
        print("=" * 70)
    except subprocess.CalledProcessError:
        print("\n❌ Erro ao gerar demo!")
    
    input("\nPressione ENTER para voltar ao menu...")

def limpar_demos():
    """Fluxo de limpeza de demos"""
    limpar_tela()
    mostrar_banner()
    
    print("\n🧹 OPÇÕES DE LIMPEZA:\n")
    print("  1. Limpar TUDO (conversas, contatos, inboxes)")
    print("  2. Limpar inbox específica")
    print("  3. ← Voltar")
    
    escolha = input("\nEscolha uma opção (1-3): ").strip()
    
    if escolha == '3':
        return
    elif escolha == '1':
        print("\n" + "=" * 70)
        print("⚠️  ATENÇÃO: Esta ação irá deletar TODAS as demos!")
        print("=" * 70)
        confirma = input("\nDigite 'SIM' para confirmar: ").strip().upper()
        
        if confirma == 'SIM':
            print("\n🧹 Limpando tudo...")
            try:
                subprocess.run(['python', 'limpar_demo.py', '--tudo', '--force'], check=True)
                print("\n✅ Limpeza concluída!")
            except subprocess.CalledProcessError:
                print("\n❌ Erro ao limpar!")
        else:
            print("\n❌ Operação cancelada.")
    
    elif escolha == '2':
        inbox_nome = input("\nNome da inbox para limpar: ").strip()
        if inbox_nome:
            print(f"\n🧹 Limpando inbox: {inbox_nome}")
            try:
                subprocess.run(['python', 'limpar_demo.py', '--inbox', inbox_nome], check=True)
                print("\n✅ Inbox limpa!")
            except subprocess.CalledProcessError:
                print("\n❌ Erro ao limpar inbox!")
        else:
            print("\n❌ Nome inválido!")
    else:
        print("\n❌ Opção inválida!")
    
    input("\nPressione ENTER para voltar ao menu...")

def ver_nichos():
    """Mostra detalhes dos nichos"""
    limpar_tela()
    mostrar_banner()
    
    nichos_info = {
        'Contabilidade': 'Declarações IR, MEI, folha pagamento, certidões',
        'Concessionária': 'Test-drive, financiamento, avaliações, vendas',
        'Peças Moto': 'Peças originais/genéricas, equipamentos, instalação',
        'Paróquia': 'Sacramentos, missas, pastorais, eventos religiosos',
        'E-commerce': 'Pedidos, rastreamento, trocas, devoluções',
        'Saúde': 'Consultas, exames, agendamentos, resultados',
        'Imobiliária': 'Alugar, comprar, visitas, documentação',
        'Restaurante': 'Delivery, reservas, cardápio, eventos',
        'Educação': 'Matrículas, mensalidades, eventos escolares'
    }
    
    print("\n📚 DETALHES DOS NICHOS:\n")
    print("-" * 70)
    
    for nicho, desc in nichos_info.items():
        print(f"\n🏪 {nicho}")
        print(f"   {desc}")
    
    print("\n" + "-" * 70)
    input("\nPressione ENTER para voltar ao menu...")

def mostrar_ajuda():
    """Mostra ajuda e documentação"""
    limpar_tela()
    mostrar_banner()
    
    print("\n📖 GUIA RÁPIDO:\n")
    print("-" * 70)
    print("""
1. CONFIGURAÇÃO INICIAL:
   - Configure as credenciais no arquivo .env
   - Obtenha a API Key em: Configurações > Perfil > Access Token
   
2. GERAR DEMO:
   - Escolha o nicho do prospect
   - Opcionalmente personalize o nome da empresa
   - Aguarde a geração (5-10 minutos)
   
3. APRESENTAR:
   - Acesse o Chatwoot
   - Mostre a inbox gerada
   - Demonstre as conversas contextualizadas
   
4. LIMPAR:
   - Após a reunião, limpe os dados
   - Pode limpar tudo ou apenas uma inbox específica
   
5. CASOS DE USO:
   - Demo genérica: use e-commerce ou restaurante
   - Prospect específico: gere demo personalizada
   - Múltiplas demos: mantenha várias inboxes ativas
   
📄 Documentação completa: README.md
    """)
    print("-" * 70)
    input("\nPressione ENTER para voltar ao menu...")

if __name__ == "__main__":
    try:
        menu_principal()
    except KeyboardInterrupt:
        print("\n\n👋 Até logo!")
        sys.exit(0)
