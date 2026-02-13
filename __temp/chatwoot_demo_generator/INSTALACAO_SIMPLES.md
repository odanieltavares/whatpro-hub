# 🚀 INSTALAÇÃO SUPER SIMPLIFICADA

## ⚡ MODO RÁPIDO - 3 Comandos

Escolha seu sistema e execute OS 3 COMANDOS na ordem:

---

### 🪟 WINDOWS (PowerShell ou CMD)

**Abra PowerShell como Administrador** (Win + X → PowerShell Admin)

```powershell
# 1. Instalar dependências
python -m pip install faker requests

# 2. Configurar credenciais (vai abrir o Bloco de Notas)
copy .env.example .env && notepad .env

# 3. Rodar
python gerar_demo.py --nicho ecommerce --empresa "Teste"
```

**Se "python" não funcionar, use "py":**
```powershell
py -m pip install faker requests
py gerar_demo.py --nicho ecommerce --empresa "Teste"
```

---

### 🐧 UBUNTU / WSL

**Abra o Terminal:**

```bash
# 1. Instalar dependências
pip3 install faker requests --break-system-packages

# 2. Configurar credenciais
cp .env.example .env && nano .env

# 3. Rodar
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

---

### 🍎 MAC

**Abra o Terminal:**

```bash
# 1. Instalar dependências
pip3 install faker requests --break-system-packages

# 2. Configurar credenciais
cp .env.example .env && nano .env

# 3. Rodar
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

---

## 🤖 INSTALAÇÃO AUTOMÁTICA (AINDA MAIS FÁCIL!)

Criamos scripts que fazem TUDO automaticamente:

### 🪟 WINDOWS

1. **Clique duplo** em `instalar_windows.bat`
2. Siga as instruções
3. Pronto!

### 🐧🍎 LINUX/MAC

1. Abra terminal na pasta do projeto
2. Execute:
   ```bash
   chmod +x instalar_linux_mac.sh
   ./instalar_linux_mac.sh
   ```
3. Pronto!

---

## ⚙️ CONFIGURAR .ENV (IMPORTANTE!)

Você precisa editar o arquivo `.env` com suas credenciais.

### Como obter credenciais:

1. **Acesse:** https://chat.whatpro.com.br
2. **Login** com sua conta
3. **Avatar** (canto superior direito) → **Settings** → **Profile**
4. **Copie** o **Access Token** (API Key)
5. **Veja** o **Account ID** na URL (geralmente é `1`)

### Editar .env:

**Windows:**
```
Abra .env com Bloco de Notas e cole:

CHATWOOT_API_URL=https://chat.whatpro.com.br
CHATWOOT_API_KEY=sua-chave-copiada-aqui
CHATWOOT_ACCOUNT_ID=1
```

**Linux/Mac:**
```bash
nano .env

# Cole:
CHATWOOT_API_URL=https://chat.whatpro.com.br
CHATWOOT_API_KEY=sua-chave-copiada-aqui
CHATWOOT_ACCOUNT_ID=1

# Salvar: Ctrl+O, Enter, Ctrl+X
```

---

## ✅ TESTAR SE FUNCIONOU

Execute este comando:

**Windows:**
```cmd
python -c "import requests; from faker import Faker; print('FUNCIONOU!')"
```

**Linux/Mac:**
```bash
python3 -c "import requests; from faker import Faker; print('FUNCIONOU!')"
```

Se aparecer **"FUNCIONOU!"**, está tudo certo! ✅

---

## 🎯 USAR O SISTEMA

### Modo Interativo (Menu):

**Windows:**
```cmd
python quickstart.py
```

**Linux/Mac:**
```bash
python3 quickstart.py
```

### Linha de Comando Direto:

**Windows:**
```cmd
REM Versão básica (5 min)
python gerar_demo.py --nicho ecommerce --empresa "Loja ABC"

REM Versão PRO (15 min)
python gerar_demo_pro.py --nicho ecommerce --empresa "Loja ABC PRO"

REM Ver nichos disponíveis
python gerar_demo.py --list
```

**Linux/Mac:**
```bash
# Versão básica (5 min)
python3 gerar_demo.py --nicho ecommerce --empresa "Loja ABC"

# Versão PRO (15 min)
python3 gerar_demo_pro.py --nicho ecommerce --empresa "Loja ABC PRO"

# Ver nichos disponíveis
python3 gerar_demo.py --list
```

---

## 📋 NICHOS DISPONÍVEIS

Execute para ver todos:
```bash
python gerar_demo.py --list
```

**Lista:**
1. `ecommerce` - Loja virtual
2. `contabilidade` - Escritório contábil
3. `concessionaria` - Loja de carros
4. `pecas-moto` - Peças para moto
5. `paroquia` - Igreja/paróquia
6. `saude` - Clínica médica
7. `imobiliaria` - Imóveis
8. `restaurante` - Delivery/restaurante
9. `educacao` - Escola/colégio

---

## 🧹 LIMPAR DEPOIS

**Windows:**
```cmd
python limpar_demo.py --inbox "Loja ABC PRO"
```

**Linux/Mac:**
```bash
python3 limpar_demo.py --inbox "Loja ABC PRO"
```

---

## 🆘 ERROS COMUNS E SOLUÇÕES

### ❌ "python não é reconhecido"

**Solução Windows:**
```cmd
# Use 'py' ao invés de 'python'
py -m pip install faker requests
py gerar_demo.py --nicho ecommerce
```

**Solução Linux/Mac:**
```bash
# Use 'python3' ao invés de 'python'
python3 -m pip install faker requests
python3 gerar_demo.py --nicho ecommerce
```

---

### ❌ "No module named 'requests'"

**Windows:**
```cmd
python -m pip install --force-reinstall faker requests
```

**Linux/Mac:**
```bash
pip3 install --force-reinstall faker requests --break-system-packages
```

---

### ❌ "externally-managed-environment"

**Solução - Use ambiente virtual:**

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
pip install faker requests
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install faker requests
```

Depois sempre ative antes de usar:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

---

### ❌ "Permission denied"

**Windows:**
```cmd
# Execute PowerShell como Administrador
# OU use --user
python -m pip install --user faker requests
```

**Linux/Mac:**
```bash
# Adicione --user
pip3 install --user faker requests --break-system-packages
```

---

## 📖 DOCUMENTAÇÃO COMPLETA

Se precisar de mais detalhes:
- `INSTALACAO_REAL.md` - Guia detalhado por sistema
- `README.md` - Documentação completa
- `RESPOSTAS_PERGUNTAS.md` - Suas dúvidas respondidas

---

## 🎯 RESUMO - COPIE E COLE

### WINDOWS (PowerShell):
```powershell
cd C:\Users\SeuNome\Downloads\chatwoot_demo_generator
python -m pip install faker requests
copy .env.example .env
notepad .env
python gerar_demo.py --nicho ecommerce --empresa "Teste"
```

### UBUNTU/WSL:
```bash
cd ~/Downloads/chatwoot_demo_generator
pip3 install faker requests --break-system-packages
cp .env.example .env
nano .env
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

### MAC:
```bash
cd ~/Downloads/chatwoot_demo_generator
pip3 install faker requests --break-system-packages
cp .env.example .env
nano .env
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

---

**Se AINDA não funcionar:**

Me mande:
1. Qual sistema? (Windows/Ubuntu/Mac)
2. Qual comando deu erro?
3. Mensagem de erro completa

E eu resolvo! 🚀
