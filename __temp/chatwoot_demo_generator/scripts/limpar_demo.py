#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Limpador de Demo Completo
Remove TODOS os recursos criados na conta para deixá-la limpa.
"""

import sys
import time
import requests
from typing import Dict, List, Optional
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from lib.config import obter_config_validada

class ChatwootCleaner:
    def __init__(self, api_url: str, api_key: str, account_id: int):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.account_id = account_id
        self.base_endpoint = f"{self.api_url}/api/v1/accounts/{self.account_id}"
        self.headers = {
            'api_access_token': api_key,
            'Content-Type': 'application/json'
        }

    def _get(self, endpoint: str) -> List[Dict]:
        """Faz GET retornando lista (trata paginação se necessário futuramente)"""
        try:
            url = f"{self.base_endpoint}{endpoint}"
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict) and 'payload' in data:
                    return data['payload']
                return []
            return []
        except Exception as e:
            print(f"⚠️ Erro ao listar {endpoint}: {e}")
            return []

    def _delete(self, endpoint: str):
        """Faz DELETE no endpoint"""
        try:
            url = f"{self.base_endpoint}{endpoint}"
            requests.delete(url, headers=self.headers)
            # Pequeno delay para evitar rate limit agressivo
            time.sleep(0.2)
        except Exception as e:
            print(f"⚠️ Erro ao deletar {endpoint}: {e}")

    def limpar_conversas(self):
        print("🗑️  Limpando conversas...")
        # Paginação simples para deletar muitas conversas
        count = 0
        while True:
            # Lista conversas (status 'all' para pegar tudo)
            conversas = self._get('/conversations?status=all')
            if not conversas:
                # Tenta endpoints específicos se 'all' não funcionar
                conversas = self._get('/conversations?status=open') + \
                           self._get('/conversations?status=resolved') + \
                           self._get('/conversations?status=pending')
            
            # Remover duplicatas por ID
            ids_unicos = {c['id'] for c in conversas}
            
            if not ids_unicos:
                break
                
            print(f"   Encontradas {len(ids_unicos)} conversas nesta página...")
            
            for conv_id in ids_unicos:
                # Chatwoot não tem DELETE /conversations/{id}, mas deletar o contato deleta as conversas.
                # Porém, vamos tentar deletar via API se possível, ou ignorar e deixar a limpeza de contatos resolver.
                # Atualmente a API publica não expõe delete de conversa facilmente, 
                # mas deletar o inbox ou o contato costuma limpar.
                # Vamos focar em deletar contatos e inboxes que é mais garantido.
                pass
            
            # Se não consegue deletar conversas diretamente, paramos o loop para ir pros contatos
            break

    def limpar_contatos(self):
        print("🗑️  Limpando contatos...")
        pagina = 1
        total_removidos = 0
        
        while True:
            # Ordenar por data decrescente para pegar os mais recentes (mockados)
            contatos = self._get(f'/contacts?sort=-created_at&page={pagina}')
            
            if not contatos:
                break
            
            # Filtra contatos que parecem mockados (sem conversas reais antigas, etc)
            # Como vamos limpar TUDO, deletamos todos.
            # CUIDADO: Isso limpa contatos reais também. 
            
            removidos_nesta_pag = 0
            for contato in contatos:
                self._delete(f'/contacts/{contato["id"]}')
                removidos_nesta_pag += 1
                sys.stdout.write(f"\r   Removidos: {total_removidos + removidos_nesta_pag}")
                sys.stdout.flush()
            
            total_removidos += removidos_nesta_pag
            
            # Se deletou tudo da página, tenta pegar a página 1 de novo (que agora tem os próximos)
            if removidos_nesta_pag > 0:
                pagina = 1 
            else:
                break
                
        print(f"\n   Total de contatos removidos: {total_removidos}")

    def limpar_inboxes(self):
        print("🗑️  Limpando inboxes...")
        inboxes = self._get('/inboxes')
        for inbox in inboxes:
            print(f"   - Removendo Inbox: {inbox['name']}")
            self._delete(f'/inboxes/{inbox["id"]}')

    def limpar_automacoes(self):
        print("🗑️  Limpando automações...")
        regras = self._get('/automation_rules')
        for regra in regras:
            print(f"   - Removendo Automação: {regra['name']}")
            self._delete(f'/automation_rules/{regra["id"]}')

    def limpar_respostas_prontas(self):
        print("🗑️  Limpando respostas prontas...")
        respostas = self._get('/canned_responses')
        for resp in respostas:
            print(f"   - Removendo Resposta: /{resp['short_code']}")
            self._delete(f'/canned_responses/{resp["id"]}')

    def limpar_labels(self):
        print("🗑️  Limpando labels...")
        labels = self._get('/labels')
        for label in labels:
            print(f"   - Removendo Label: {label['title']}")
            self._delete(f'/labels/{label["id"]}') # API v1 usa ID ou Title dependendo da versão, tentando ID

    def limpar_times(self):
        print("🗑️  Limpando times/equipes...")
        times = self._get('/teams')
        for time_obj in times:
            print(f"   - Removendo Time: {time_obj['name']}")
            self._delete(f'/teams/{time_obj["id"]}')

    def limpar_sla_policies(self):
        print("🗑️  Limpando SLA policies...")
        slas = self._get('/sla_policies')
        for sla in slas:
            print(f"   - Removendo SLA: {sla['name']}")
            self._delete(f'/sla_policies/{sla["id"]}')

    def limpar_custom_roles(self):
        print("🗑️  Limpando custom roles...")
        roles = self._get('/custom_roles')
        for role in roles:
            print(f"   - Removendo Role: {role['name']}")
            self._delete(f'/custom_roles/{role["id"]}')

    def limpar_custom_attributes(self):
        print("🗑️  Limpando custom attributes...")
        attrs = self._get('/custom_attribute_definitions')
        for attr in attrs:
            print(f"   - Removendo Atributo: {attr['attribute_display_name']}")
            self._delete(f'/custom_attribute_definitions/{attr["id"]}')

    def limpar_agentes_demo(self):
        print("🗑️  Limpando agentes demo...")
        agentes = self._get('/agents')
        
        # Identificar admin atual para não deletar a si mesmo (se possível)
        # self.api_key não dá o user_id direto, mas podemos assumir que não deletamos quem não tem email @demo.whatpro.com
        
        count = 0
        for agente in agentes:
            email = agente.get('email', '')
            # Proteção contra exclusão do admin principal e agentes que não são demo
            if email == 'danieltavares.suporte@gmail.com' or '@demo.whatpro.com' not in email:
                print(f"   ⏩ Pulando admin/real: {agente['name']} ({email})")
                continue
                
            if '@demo.whatpro.com' in email:
                print(f"   - Removendo Agente: {agente['name']} ({email})")
                self._delete(f'/agents/{agente["id"]}')
                count += 1
        
        if count == 0:
            print("   Nenhum agente de demonstração encontrado.")

    def limpeza_completa(self):
        print(f"\n{'='*60}")
        print("🧹 LIMPEZA COMPLETA DA CONTA")
        print(f"{'='*60}")
        print("⚠️  ATENÇÃO: ISSO IRÁ REMOVER DADOS DA CONTA!")
        print("   Conversas, Contatos, Agentes(demo), Times, etc.")
        
        confirm = input("\nTem certeza? Digite 'LIMPAR' para confirmar: ")
        if confirm != 'LIMPAR':
            print("❌ Operação cancelada.")
            return

        # Ordem importa para evitar erros de dependência
        self.limpar_contatos()      # Remove conversas junto
        self.limpar_inboxes()       # Remove inboxes
        self.limpar_automacoes()    # Remove automações que usam times/labels
        self.limpar_respostas_prontas()
        self.limpar_labels()
        self.limpar_times()         # Remove times (agentes ficam sem time)
        self.limpar_sla_policies()
        self.limpar_agentes_demo()  # Remove agentes criados
        self.limpar_custom_roles()  # Remove roles (depois dos agentes)
        self.limpar_custom_attributes()

        print(f"\n{'='*60}")
        print("✨ LIMPEZA CONCLUÍDA! CONTA ESTÁ ZERADA. ✨")
        print(f"{'='*60}\n")

def main():
    config = obter_config_validada()
    if not config:
        return

    cleaner = ChatwootCleaner(
        config['api_url'], 
        config['api_key'], 
        int(config['account_id'])
    )
    cleaner.limpeza_completa()

if __name__ == "__main__":
    main()
