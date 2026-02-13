#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatPro Chat - Visualizador de Conta
Exibe um raio-X completo da conta Chatwoot
"""

import sys
import requests
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from lib.config import obter_config_validada

class ChatwootViewer:
    def __init__(self, api_url: str, api_key: str, account_id: int):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.account_id = account_id
        self.base_endpoint = f"{self.api_url}/api/v1/accounts/{self.account_id}"
        self.headers = {
            'api_access_token': api_key,
            'Content-Type': 'application/json'
        }

    def _get(self, endpoint: str):
        try:
            response = requests.get(f"{self.base_endpoint}{endpoint}", headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and 'payload' in data:
                    return data['payload']
                return data
            return []
        except:
            return []

    def exibir_info(self):
        print(f"\n{'='*60}")
        print(f"📊 RELATÓRIO DA CONTA (ID: {self.account_id})")
        print(f"{'='*60}")

        # 1. Agentes
        agentes = self._get('/agents')
        print(f"\n👥 Agentes ({len(agentes)}):")
        for a in agentes:
            role = a.get('role', 'agent')
            custom = f" (Role: {a.get('custom_role_id')})" if a.get('custom_role_id') else ""
            print(f"   • {a['name']} - {role}{custom} [{a['email']}]")

        # 2. Times
        times = self._get('/teams')
        print(f"\n🏢 Times ({len(times)}):")
        for t in times:
            print(f"   • {t['name']}")

        # 3. Inboxes
        inboxes = self._get('/inboxes')
        print(f"\n📥 Inboxes ({len(inboxes)}):")
        for i in inboxes:
            print(f"   • {i['name']} ({i['channel_type']})")

        # 4. Labels
        labels = self._get('/labels')
        print(f"\n🏷️  Labels ({len(labels)}):")
        tags = [l['title'] for l in labels]
        print(f"   {', '.join(tags)}")

        # 5. SLA Policies
        slas = self._get('/sla_policies')
        print(f"\n⏱️  SLA Policies ({len(slas)}):")
        for s in slas:
            print(f"   • {s['name']}")

        # 6. Automações
        autos = self._get('/automation_rules')
        print(f"\n⚡ Automações ({len(autos)}):")
        for a in autos:
            print(f"   • {a['name']}")

        # 7. Custom Attributes
        attrs = self._get('/custom_attribute_definitions')
        print(f"\n📝 Custom Attributes ({len(attrs)}):")
        for a in attrs:
            model = "Contato" if a['attribute_model'] == 0 else "Conversa"
            print(f"   • {a['attribute_display_name']} [{model}]")

        # 8. Stats Rápidos
        contatos = self._get('/contacts?page=1')
        num_contatos = len(contatos) if isinstance(contatos, list) else 0
        
        print(f"\n📈 Estatísticas:")
        print(f"   • Contatos (amostra): {num_contatos}+")
        print(f"{'='*60}\n")

def main():
    config = obter_config_validada()
    if not config:
        return

    viewer = ChatwootViewer(
        config['api_url'], 
        config['api_key'], 
        int(config['account_id'])
    )
    viewer.exibir_info()

if __name__ == "__main__":
    main()
