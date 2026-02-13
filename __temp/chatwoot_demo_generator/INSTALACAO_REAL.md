# 🔧 INSTALAÇÃO QUE FUNCIONA DE VERDADE

## 🎯 Vamos fazer funcionar! Escolha seu sistema:

---

## 🪟 WINDOWS

### **PASSO 1: Verificar se tem Python**

Abra o **PowerShell** ou **CMD** (Win + R, digite `cmd`, Enter)

```cmd
python --version
```

**Se aparecer algo tipo "Python 3.x.x":** ✅ Tem Python, pule para PASSO 3

**Se der erro:** ❌ Precisa instalar Python

---

### **PASSO 2: Instalar Python no Windows**

1. **Baixe:** https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe

2. **Execute o instalador**

3. **⚠️ IMPORTANTE:** Marque as duas caixinhas:
   - ✅ **"Add python.exe to PATH"** (ESSENCIAL!)
   - ✅ "Install pip"

4. Clique "Install Now"

5. **Feche e REABRA o terminal** (importante!)

6. Teste novamente:
   ```cmd
   python --version
   ```

---

### **PASSO 3: Navegar até a pasta do projeto**

```cmd
cd C:\Users\SeuNome\Downloads\chatwoot_demo_generator
```

**Dica:** Arraste a pasta para o terminal e pressione Enter!

---

### **PASSO 4: Instalar dependências (WINDOWS)**

Tente na ordem:

**Opção 1:**
```cmd
python -m pip install faker requests
```

**Se der erro, Opção 2:**
```cmd
pip install faker requests
```

**Se der erro de permissão, Opção 3:**
```cmd
python -m pip install --user faker requests
```

**Se NADA funcionar, Opção 4:**
```cmd
py -m pip install faker requests
```

---

### **PASSO 5: Testar se instalou**

```cmd
python -c "import requests; print('OK')"
```

Se aparecer **"OK"**, funcionou! ✅

---

### **PASSO 6: Configurar .env**

1. **Abra a pasta** no explorador
2. **Copie** o arquivo `.env.example`
3. **Renomeie** para `.env` (sem .example)
4. **Abra com Bloco de Notas**
5. **Cole suas credenciais:**
   ```
   CHATWOOT_API_URL=https://chat.whatpro.com.br
   CHATWOOT_API_KEY=sua-chave-aqui
   CHATWOOT_ACCOUNT_ID=1
   ```
6. **Salve** (Ctrl+S)

---

### **PASSO 7: Rodar o script (WINDOWS)**

```cmd
python gerar_demo.py --nicho ecommerce --empresa "Teste"
```

**OU modo interativo:**
```cmd
python quickstart.py
```

---

## 🐧 UBUNTU / WSL (Windows Subsystem for Linux)

### **PASSO 1: Atualizar sistema**

```bash
sudo apt update
sudo apt upgrade -y
```

---

### **PASSO 2: Instalar Python e pip**

```bash
sudo apt install python3 python3-pip -y
```

---

### **PASSO 3: Verificar instalação**

```bash
python3 --version
pip3 --version
```

Deve mostrar as versões. Se sim, ✅

---

### **PASSO 4: Navegar até a pasta**

**Se baixou no Windows e está no WSL:**
```bash
cd /mnt/c/Users/SeuNome/Downloads/chatwoot_demo_generator
```

**Se baixou direto no Ubuntu:**
```bash
cd ~/Downloads/chatwoot_demo_generator
```

---

### **PASSO 5: Instalar dependências (UBUNTU/WSL)**

```bash
pip3 install faker requests --break-system-packages
```

**OU se não funcionar:**
```bash
python3 -m pip install faker requests --break-system-packages
```

**OU criar ambiente virtual (recomendado):**
```bash
# Criar ambiente virtual
python3 -m venv venv

# Ativar
source venv/bin/activate

# Instalar
pip install faker requests
```

---

### **PASSO 6: Testar**

```bash
python3 -c "import requests; print('OK')"
```

Se aparecer **"OK"**, funcionou! ✅

---

### **PASSO 7: Configurar .env**

```bash
# Copiar exemplo
cp .env.example .env

# Editar
nano .env
```

**Cole suas credenciais:**
```
CHATWOOT_API_URL=https://chat.whatpro.com.br
CHATWOOT_API_KEY=sua-chave-aqui
CHATWOOT_ACCOUNT_ID=1
```

**Salvar:** Ctrl+O, Enter, Ctrl+X

---

### **PASSO 8: Rodar o script (UBUNTU/WSL)**

```bash
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

**OU modo interativo:**
```bash
python3 quickstart.py
```

---

## 🍎 MAC

### **PASSO 1: Verificar Python**

Abra o **Terminal** (Cmd+Espaço, digite "Terminal")

```bash
python3 --version
```

Se aparecer versão 3.8+, ✅ tem Python

---

### **PASSO 2: Se não tiver Python, instalar**

**Opção A - Homebrew (recomendado):**

```bash
# Instalar Homebrew se não tiver
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Python
brew install python3
```

**Opção B - Baixar direto:**

https://www.python.org/downloads/macos/

---

### **PASSO 3: Navegar até a pasta**

```bash
cd ~/Downloads/chatwoot_demo_generator
```

**Dica:** Arraste a pasta para o Terminal!

---

### **PASSO 4: Instalar dependências (MAC)**

```bash
pip3 install faker requests --break-system-packages
```

**OU se não funcionar:**
```bash
python3 -m pip install faker requests --break-system-packages
```

**OU criar ambiente virtual:**
```bash
# Criar
python3 -m venv venv

# Ativar
source venv/bin/activate

# Instalar
pip install faker requests
```

---

### **PASSO 5: Testar**

```bash
python3 -c "import requests; print('OK')"
```

Se aparecer **"OK"**, funcionou! ✅

---

### **PASSO 6: Configurar .env**

```bash
# Copiar
cp .env.example .env

# Editar
nano .env
```

**Cole suas credenciais:**
```
CHATWOOT_API_URL=https://chat.whatpro.com.br
CHATWOOT_API_KEY=sua-chave-aqui
CHATWOOT_ACCOUNT_ID=1
```

**Salvar:** Ctrl+O, Enter, Ctrl+X

---

### **PASSO 7: Rodar o script (MAC)**

```bash
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

**OU modo interativo:**
```bash
python3 quickstart.py
```

---

## 🆘 TROUBLESHOOTING - Erros Comuns

### **"python não é reconhecido" / "command not found"**

**Windows:**
```cmd
# Use 'py' ao invés de 'python'
py --version
py -m pip install faker requests
py gerar_demo.py --nicho ecommerce
```

**Linux/Mac:**
```bash
# Use 'python3' ao invés de 'python'
python3 --version
python3 -m pip install faker requests
python3 gerar_demo.py --nicho ecommerce
```

---

### **"pip não é reconhecido"**

**Windows:**
```cmd
python -m pip install faker requests
```

**Linux/Mac:**
```bash
python3 -m pip install faker requests --break-system-packages
```

---

### **"ERROR: externally-managed-environment"**

**Solução 1 - Adicionar flag:**
```bash
pip install faker requests --break-system-packages
```

**Solução 2 - Usar venv (MELHOR):**
```bash
# Criar ambiente virtual
python3 -m venv venv

# Ativar
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar
pip install faker requests
```

---

### **"Permission denied" / "Access denied"**

**Linux/Mac:**
```bash
# Adicione --user
pip3 install faker requests --user --break-system-packages
```

**Windows:**
```cmd
# Execute como Administrador ou use --user
python -m pip install --user faker requests
```

---

### **"ModuleNotFoundError: No module named 'requests'"**

**Confirme que instalou:**
```bash
# Windows
python -m pip list | findstr requests

# Linux/Mac
python3 -m pip list | grep requests
```

**Se não aparecer, instale novamente:**
```bash
# Windows
python -m pip install --force-reinstall faker requests

# Linux/Mac
python3 -m pip install --force-reinstall faker requests --break-system-packages
```

---

### **SSL Certificate Error**

```bash
# Windows
python -m pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org faker requests

# Linux/Mac
python3 -m pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org faker requests
```

---

## ✅ VERIFICAÇÃO FINAL

Execute este comando para testar TUDO:

**Windows:**
```cmd
python -c "import sys; import requests; from faker import Faker; print(f'Python: {sys.version}'); print('Requests: OK'); print('Faker: OK'); print('TUDO FUNCIONANDO!')"
```

**Linux/Mac:**
```bash
python3 -c "import sys; import requests; from faker import Faker; print(f'Python: {sys.version}'); print('Requests: OK'); print('Faker: OK'); print('TUDO FUNCIONANDO!')"
```

**Se aparecer "TUDO FUNCIONANDO!"**, está pronto! ✅

---

## 🎯 COMANDOS RESUMIDOS POR SISTEMA

### **WINDOWS (PowerShell/CMD)**
```cmd
cd C:\Users\SeuNome\Downloads\chatwoot_demo_generator
python -m pip install faker requests
copy .env.example .env
notepad .env
REM (Edite e salve)
python gerar_demo.py --nicho ecommerce --empresa "Teste"
```

### **UBUNTU/WSL**
```bash
cd ~/Downloads/chatwoot_demo_generator
pip3 install faker requests --break-system-packages
cp .env.example .env
nano .env
# (Edite e salve com Ctrl+O, Ctrl+X)
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

### **MAC**
```bash
cd ~/Downloads/chatwoot_demo_generator
pip3 install faker requests --break-system-packages
cp .env.example .env
nano .env
# (Edite e salve com Ctrl+O, Ctrl+X)
python3 gerar_demo.py --nicho ecommerce --empresa "Teste"
```

---

## 📹 PASSO A PASSO VISUAL

1. **Extrair ZIP** → Clique direito → Extrair aqui
2. **Abrir Terminal** → Navegue até a pasta
3. **Instalar** → Execute comando do seu sistema acima
4. **Configurar** → Edite .env com suas credenciais
5. **Rodar** → Execute o script!

---

## 💡 DICA PRO

Use **ambiente virtual** para evitar conflitos:

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

## 🆘 AINDA NÃO FUNCIONOU?

**Me diga EXATAMENTE:**
1. Qual sistema você está usando? (Windows/Ubuntu/Mac)
2. Qual comando deu erro?
3. Qual foi a mensagem de erro COMPLETA?

E eu te ajudo a resolver!

---

**Desenvolvido para WhatPro Chat**

🔧 Guia de instalação que realmente funciona!
