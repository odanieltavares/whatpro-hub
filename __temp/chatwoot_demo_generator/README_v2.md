# 🚀 WhatPro Chat - Sistema Completo v2.0

## 🎉 NOVO! Menu Interativo 100% Completo

Agora você **NÃO precisa mais digitar comandos**!

Sistema completo com menu intuitivo, navegação fácil e instalação automática.

---

## ⚡ INÍCIO RÁPIDO (2 Cliques!)

### 🪟 **Windows**
1. **Clique duplo** em: **`INICIAR.bat`**
2. Pronto! O sistema verifica tudo e inicia automaticamente

### 🐧🍎 **Linux/Mac**
1. Abra terminal na pasta
2. Execute:
   ```bash
   chmod +x INICIAR.sh
   ./INICIAR.sh
   ```
3. Pronto!

---

## 📋 O QUE O SISTEMA FAZ AUTOMATICAMENTE

Quando você executa `INICIAR.bat` ou `INICIAR.sh`:

✅ **Verifica Python** instalado  
✅ **Verifica dependências** (faker, requests)  
✅ **Instala automaticamente** se faltarem  
✅ **Verifica .env** configurado  
✅ **Cria .env** se não existir  
✅ **Inicia menu interativo**  

**Você não precisa fazer NADA manualmente!**

---

## 🎯 MENU PRINCIPAL

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           🚀 WHATPRO CHAT - GERADOR DE DEMOS 🚀                  ║
║                  Sistema Completo v2.0                            ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

📊 Status: Dependências ✅ | .env ✅

MENU PRINCIPAL:

  1. 🚀 Gerar Demo Mockada
  2. 📊 Visualizar Informações
  3. 🗑️  Limpar Demos

  4. ⚙️  Configurar .env
  5. 🔧 Instalar Dependências
  6. 🔗 Testar Conexão
  7. ℹ️  Status do Sistema

  0. ❌ Sair

Escolha uma opção:
```

---

## 🚀 FUNCIONALIDADES

### **1. Gerar Demo Mockada**

Submenu com:
- **Demo BÁSICA** (5 minutos)
  - Conversas, contatos, mensagens
  - Labels básicas
  
- **Demo PRO** (15 minutos)
  - Tudo da básica +
  - Times, agentes com roles
  - Protocolos automáticos
  - Automações, CSAT
  - Respostas prontas
  - Notas privadas

- **Ver nichos disponíveis**
  - 9 nichos prontos
  - Mensagens contextualizadas

### **2. Visualizar Informações**

- **Listar contas/empresas**
  - Mostra todas as contas do token
  - IDs, nomes, domínios
  
- **Ver informações da conta**
  - Inboxes, agentes, times
  - Labels, conversas, contatos
  - Resumo completo
  
- **Ver status completo**
  - Status do sistema
  - Arquivos presentes
  - Configurações

### **3. Limpar Demos**

- **Limpar inbox específica**
  - Remove apenas uma demo
  - Confirmação antes de deletar
  
- **Limpar TUDO**
  - Remove todas as demos
  - Múltiplas confirmações
  - Use com CUIDADO!

### **4. Configurar .env**

- Interface interativa para configurar credenciais
- Mostra valores atuais
- Salva automaticamente

### **5. Instalar Dependências**

- Instala faker e requests
- Automaticamente detecta sistema
- Retry em caso de erro

### **6. Testar Conexão**

- Testa conexão com Chatwoot
- Mostra contas disponíveis
- Valida credenciais

### **7. Status do Sistema**

- Verifica dependências
- Verifica .env
- Lista arquivos do sistema

---

## 🎨 NAVEGAÇÃO

**É super simples:**
- Digite o **número** da opção
- Pressione **ENTER**
- **0** volta ao menu anterior
- **ESC** ou **Ctrl+C** sai do sistema

**Exemplo:**
```
1 → Gerar Demo
  1 → Demo Básica
    Digite nicho: ecommerce
    Digite empresa: Loja ABC
    [Gera demo automaticamente]
  0 → Voltar
0 → Menu Principal
```

---

## ⚙️ CONFIGURAÇÃO INICIAL

### **Primeira Vez - Passo a Passo:**

1. **Execute INICIAR.bat** (Windows) ou **INICIAR.sh** (Linux/Mac)

2. Sistema verifica tudo automaticamente

3. Se pedir, **confirme instalação** de dependências

4. **Menu abre automaticamente**

5. Escolha **opção 4** (Configurar .env)

6. Digite suas credenciais:
   - **URL:** https://chat.whatpro.com.br
   - **Token:** (copie do Chatwoot)
   - **Account ID:** 2 (ou o seu)

7. **Pronto!** Agora escolha **opção 1** para gerar demos!

---

## 📦 ESTRUTURA DO PROJETO

```
chatwoot_demo_generator/
│
├── INICIAR.bat                # ⭐ CLIQUE AQUI (Windows)
├── INICIAR.sh                 # ⭐ EXECUTE AQUI (Linux/Mac)
│
├── iniciar.py                 # Verificador automático
├── menu_completo.py           # Sistema com menu interativo
│
├── gerar_demo.py              # Gerador básico
├── gerar_demo_pro.py          # Gerador PRO
├── limpar_demo.py             # Limpador
├── ver_conta.py               # Visualizador
├── listar_accounts.py         # Listador de contas
│
├── .env                       # Suas credenciais (criar)
├── .env.example               # Exemplo
│
├── templates/                 # Templates básicos (9 nichos)
├── templates_pro/             # Templates PRO
│
└── docs/                      # Documentação completa
```

---

## 🎯 NICHOS DISPONÍVEIS

1. 🛒 **ecommerce** - Loja virtual
2. 📊 **contabilidade** - Escritório contábil
3. 🚗 **concessionaria** - Loja de veículos
4. 🏍️ **pecas-moto** - Peças para motos
5. ⛪ **paroquia** - Igreja/paróquia
6. 🏥 **saude** - Clínica médica
7. 🏠 **imobiliaria** - Imóveis
8. 🍕 **restaurante** - Delivery
9. 🎓 **educacao** - Escola/colégio

Cada um com mensagens específicas e contextualizadas!

---

## 🆘 PROBLEMAS?

### **"Python não encontrado"**
Instale Python: https://www.python.org/downloads/  
**IMPORTANTE:** Marque "Add Python to PATH"!

### **"Dependências não instaladas"**
O sistema instala automaticamente!  
Ou manualmente: `pip install faker requests`

### **".env não configurado"**
Use a **opção 4** do menu para configurar

### **"Erro de conexão"**
- Verifique URL (https://chat.whatpro.com.br)
- Verifique Token (Settings → Profile → Access Token)
- Verifique Account ID (número na URL)

---

## 💡 DICAS

### **Criar demo antes de reunião:**
1. Execute INICIAR
2. Opção 1 → Demo PRO
3. Escolha nicho do cliente
4. Digite nome da empresa do cliente
5. Aguarde 15 minutos
6. Mostre em chat.whatpro.com.br

### **Limpar depois da apresentação:**
1. Opção 3 → Limpar inbox específica
2. Digite nome da demo
3. Confirme

### **Ver o que existe antes:**
1. Opção 2 → Ver informações
2. Veja resumo completo
3. Decida se limpa ou cria nova

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **LEIA-ME_PRIMEIRO.md** - Início rápido
- **INSTALACAO_SIMPLES.md** - Instalação manual
- **README.md** - Este arquivo
- **API_DOCUMENTATION.md** - Detalhes da API
- **FEATURES_GUIDE.md** - Guia de todas features
- **PROTOCOLO_ATENDIMENTO.md** - Sistema de protocolos

---

## 🎉 NOVIDADES v2.0

### ✨ **Menu Interativo Completo**
- Navegação por números
- Sem comandos manuais
- Interface limpa e bonita

### ✨ **Instalação Automática**
- Verifica dependências
- Instala automaticamente
- Cria .env se não existir

### ✨ **Configuração via Menu**
- Edite .env pelo menu
- Validação em tempo real
- Teste de conexão integrado

### ✨ **Inicializadores**
- INICIAR.bat (Windows)
- INICIAR.sh (Linux/Mac)
- 2 cliques e está rodando!

### ✨ **Status Visual**
- Veja o que está configurado
- Indicadores coloridos
- Resumo em tempo real

---

## 🚀 COMEÇE AGORA!

**Windows:**
```
1. Clique duplo em INICIAR.bat
2. Siga o menu
3. Pronto!
```

**Linux/Mac:**
```bash
chmod +x INICIAR.sh
./INICIAR.sh
```

**É ISSO! Sistema 100% pronto para usar!** ✅

---

**Desenvolvido para WhatPro Chat** 🚀

Sistema Completo v2.0 - Menu Interativo sem Comandos!
