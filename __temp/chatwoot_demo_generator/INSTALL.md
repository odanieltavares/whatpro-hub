# 🚀 Instalação Rápida - WhatPro Chat Demo Generator

## ⚡ 3 Passos para Começar

### 1️⃣ Instalar dependências
```bash
pip install -r requirements.txt
```

### 2️⃣ Configurar credenciais
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas credenciais do Chatwoot
nano .env
```

Preencha:
```
CHATWOOT_API_URL=https://app.chatwoot.com
CHATWOOT_API_KEY=sua-chave-aqui
CHATWOOT_ACCOUNT_ID=1
```

### 3️⃣ Gerar sua primeira demo!

**Opção A: Modo Interativo (Recomendado)**
```bash
python quickstart.py
```

**Opção B: Linha de comando**
```bash
# Ver nichos disponíveis
python gerar_demo.py --list

# Gerar demo
python gerar_demo.py --nicho ecommerce --empresa "Minha Loja"

# Limpar depois
python limpar_demo.py --inbox "Minha Loja"
```

---

## 🎯 Uso Rápido por Cenário

### Cenário 1: Prospect de Contabilidade
```bash
python gerar_demo.py --nicho contabilidade --empresa "Escritório Silva"
```

### Cenário 2: Apresentação Genérica
```bash
python gerar_demo.py --nicho ecommerce
```

### Cenário 3: Múltiplas Demos
```bash
python gerar_demo.py --nicho saude --empresa "Clínica Boa Saúde"
python gerar_demo.py --nicho educacao --empresa "Colégio Exemplo"
python gerar_demo.py --nicho restaurante --empresa "Pizzaria do Zé"
```

### Cenário 4: Limpeza após reunião
```bash
# Limpar apenas uma inbox
python limpar_demo.py --inbox "Escritório Silva"

# OU limpar tudo
python limpar_demo.py --tudo
```

---

## 📋 Checklist Pré-Apresentação

- [ ] Credenciais configuradas
- [ ] Nicho do prospect identificado
- [ ] Demo gerada (5-10 min antes da reunião)
- [ ] Acesso ao Chatwoot testado
- [ ] Conversas verificadas

---

## ❓ Problemas Comuns

**Erro: "API Key inválida"**
→ Verifique se copiou a chave completa do Chatwoot

**Erro: "Template não encontrado"**
→ Use `python gerar_demo.py --list` para ver os nichos

**Demo não aparece no Chatwoot**
→ Aguarde 30 segundos e recarregue a página

---

## 📚 Mais Informações

Leia o **README.md** completo para:
- Detalhes sobre cada nicho
- Personalização de templates
- Criação de novos nichos
- Solução detalhada de problemas

---

**Pronto para começar? Execute:**
```bash
python quickstart.py
```
