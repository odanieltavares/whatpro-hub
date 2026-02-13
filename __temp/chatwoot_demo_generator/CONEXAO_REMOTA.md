# 🌐 Conectando com sua Instância Remota - WhatPro Chat

## ✅ SIM! Funciona com chat.whatpro.com.br

O script **roda localmente** no seu computador, mas **se conecta via API** à sua instância remota do Chatwoot.

**NÃO PRECISA** instalar Chatwoot no seu computador!

---

## 🔧 Como Funciona

```
Seu Computador              Internet              Chatwoot Cloud
┌─────────────┐            ┌─────┐             ┌──────────────────┐
│             │            │     │             │                  │
│ Script      ├───────────►│ API ├────────────►│ chat.whatpro     │
│ Python      │  HTTPS     │ REST│  HTTPS     │ .com.br          │
│             │            │     │             │                  │
│ gerar_demo  │◄───────────┤     │◄────────────┤                  │
│ .py         │  JSON      │     │  JSON      │ Dados salvos     │
└─────────────┘            └─────┘             └──────────────────┘
```

**O que acontece:**
1. Script faz requisições HTTP para a API
2. API do Chatwoot processa e salva os dados
3. Dados aparecem instantaneamente no chat.whatpro.com.br

---

## 📝 Configuração Passo a Passo

### **1. Obter Credenciais do WhatPro Chat**

#### a) **Fazer Login**
```
Acesse: https://chat.whatpro.com.br
Login com sua conta
```

#### b) **Obter API Key**
```
1. Clique no seu avatar (canto superior direito)
2. Settings (Configurações)
3. Profile (Perfil)
4. Access Token
5. Copie o token (exemplo: aBc123DeF456...)
```

#### c) **Obter Account ID**
```
Olhe na URL quando estiver logado:
https://chat.whatpro.com.br/app/accounts/1/dashboard
                                         ↑
                                    Esse é o ID
```

Normalmente é `1` para conta principal, mas pode ser outro número.

### **2. Configurar o Script**

Edite o arquivo `.env`:

```bash
# Sua instância do WhatPro Chat
CHATWOOT_API_URL=https://chat.whatpro.com.br

# Seu token de API
CHATWOOT_API_KEY=aBc123DeF456GhI789JkL012MnO345PqR678

# ID da sua conta (geralmente 1)
CHATWOOT_ACCOUNT_ID=1
```

**IMPORTANTE:**
- ✅ Use `https://` (com S)
- ✅ Sem barra no final da URL
- ✅ API Key completa (sem espaços)

### **3. Testar Conexão**

Teste se está funcionando:

```bash
python -c "
import requests
import os

url = 'https://chat.whatpro.com.br/api/v1/accounts/1/conversations'
headers = {'api_access_token': 'SUA_API_KEY'}

response = requests.get(url, headers=headers)
print(f'Status: {response.status_code}')
print('✅ Conexão OK!' if response.status_code == 200 else '❌ Erro na conexão')
"
```

Se retornar `Status: 200`, está tudo certo!

---

## 🚀 Usar o Sistema

Agora é só gerar suas demos normalmente:

```bash
# Versão básica
python gerar_demo.py --nicho ecommerce --empresa "Loja Teste"

# Versão PRO
python gerar_demo_pro.py --nicho ecommerce --empresa "Loja Teste PRO"
```

**Os dados aparecerão automaticamente** em https://chat.whatpro.com.br

---

## 🔒 Segurança

### **Sua API Key é Sensível!**

⚠️ **NUNCA compartilhe sua API Key**
- Dá acesso total à sua conta
- Pode criar/deletar/modificar tudo
- Mantenha o arquivo `.env` privado

### **Boas Práticas:**

```bash
# 1. Adicione .env ao .gitignore
echo ".env" >> .gitignore

# 2. Use variáveis de ambiente em produção
export CHATWOOT_API_KEY="sua-chave"

# 3. Revogue keys antigas periodicamente
# Em: Settings > Profile > Access Token > Revoke
```

---

## 🌍 Funciona com Qualquer Instância

O sistema funciona com:

✅ **WhatPro Cloud** - chat.whatpro.com.br  
✅ **Chatwoot Cloud** - app.chatwoot.com  
✅ **Self-hosted** - sua-empresa.com  
✅ **Localhost** - http://localhost:3000 (desenvolvimento)

Basta trocar a URL no `.env`!

---

## ❓ Problemas Comuns

### **Erro: "Connection refused"**
```
Causa: URL incorreta
Solução: Verifique se é https://chat.whatpro.com.br
```

### **Erro: "401 Unauthorized"**
```
Causa: API Key inválida
Solução: 
1. Gere nova API Key em Settings > Profile
2. Cole no .env sem espaços
3. Verifique se não tem aspas extras
```

### **Erro: "404 Not Found"**
```
Causa: Account ID errado
Solução: Verifique o número na URL do dashboard
```

### **Erro: "429 Too Many Requests"**
```
Causa: Rate limit excedido (100 req/min)
Solução: Aguarde 1 minuto, script tem retry automático
```

### **Erro: "SSL Certificate Verify Failed"**
```
Causa: Certificado SSL inválido
Solução: 
1. Verifique se a URL está correta
2. Se self-hosted, configure SSL corretamente
```

---

## 🔍 Verificar se Funcionou

Após gerar a demo:

### **1. No Terminal**
```bash
# Você verá mensagens como:
✅ Inbox 'Loja Teste' criada (ID: 123)
✅ 25 contatos criados!
✅ 30 conversas criadas!
```

### **2. No WhatPro Chat**
```
1. Abra: https://chat.whatpro.com.br
2. Vá em "Inboxes" (barra lateral)
3. Procure "Loja Teste"
4. Clique e veja as conversas mockadas
```

---

## 🧪 Ambiente de Teste

Se você tem medo de mexer na produção:

### **Opção 1: Conta Separada**
```
Crie uma conta demo no WhatPro Chat
Use só para testes
```

### **Opção 2: Chatwoot Local (Opcional)**
```bash
# Se quiser testar localmente antes
docker run -d -p 3000:3000 \
  -e SECRET_KEY_BASE=supersecret \
  chatwoot/chatwoot:latest

# Configure .env:
CHATWOOT_API_URL=http://localhost:3000
```

---

## 📊 Monitoramento

Durante a execução, você pode:

### **Ver Logs no Terminal**
```
🚀 Gerando demo para: E-COMMERCE
✅ Template carregado
👥 Criando times...
  ✓ Time 'Vendas' criado (ID: 1)
🧑‍💼 Criando agentes...
  ✓ 👑 Admin: Maria Silva
```

### **Ver na Interface Web**
```
Abra outra aba do navegador em:
https://chat.whatpro.com.br

Veja os dados aparecendo em tempo real!
```

---

## ⚡ Performance

### **Velocidade da Conexão**

| Rede | Tempo Básica | Tempo PRO |
|------|--------------|-----------|
| **Fibra (100Mbps)** | 4-5 min | 10-12 min |
| **Cabo (50Mbps)** | 5-6 min | 12-14 min |
| **4G Móvel** | 7-8 min | 15-18 min |
| **3G/Lento** | 10-12 min | 20-25 min |

### **Dicas de Performance**

```python
# Já implementado no script:
- Retry automático em caso de falha
- Backoff exponencial no rate limit
- Threading para requests paralelos (opcional)
```

---

## 🔄 Fluxo Completo

```
1. PREPARAÇÃO
   └─► Obter credenciais do chat.whatpro.com.br
   └─► Configurar .env
   └─► Testar conexão

2. GERAÇÃO
   └─► Executar script Python localmente
   └─► Script faz chamadas HTTP à API
   └─► Dados salvos no cloud

3. APRESENTAÇÃO
   └─► Abrir chat.whatpro.com.br
   └─► Mostrar demo ao cliente
   └─► Navegar pelas conversas

4. LIMPEZA
   └─► Executar limpar_demo.py
   └─► Remove dados mockados
   └─► Pronto para próxima demo
```

---

## 💡 Dicas Avançadas

### **Usar com Proxy**
```python
# Adicione no script se usar proxy corporativo:
proxies = {
    'http': 'http://proxy.empresa.com:8080',
    'https': 'http://proxy.empresa.com:8080'
}

requests.post(url, headers=headers, json=data, proxies=proxies)
```

### **Configurar Timeout**
```python
# Já configurado no script:
response = requests.post(url, headers=headers, json=data, timeout=30)
```

### **Debug Mode**
```bash
# Ver todas as requisições HTTP
export DEBUG=1
python gerar_demo.py --nicho ecommerce
```

---

## 📝 Checklist de Instalação

- [ ] Python 3.8+ instalado
- [ ] Dependências instaladas (`pip install -r requirements.txt`)
- [ ] Conta criada no chat.whatpro.com.br
- [ ] API Key obtida
- [ ] Account ID identificado
- [ ] Arquivo `.env` criado e configurado
- [ ] Conexão testada com sucesso
- [ ] Primeiro teste de geração realizado

---

## 🎯 Resumo

**Pergunta:** Preciso instalar Chatwoot no meu PC?  
**Resposta:** ❌ NÃO! O script se conecta via API.

**Pergunta:** Funciona com chat.whatpro.com.br?  
**Resposta:** ✅ SIM! Perfeitamente.

**Pergunta:** É seguro?  
**Resposta:** ✅ Sim, usa HTTPS e autenticação oficial.

**Pergunta:** Os dados ficam onde?  
**Resposta:** No cloud do WhatPro Chat (chat.whatpro.com.br).

**Pergunta:** Preciso de internet?  
**Resposta:** ✅ Sim, para comunicar com a API.

---

**Desenvolvido para WhatPro Chat**

🌐 Funciona 100% com sua instância remota via API!
