#!/bin/bash
# Script de Instalação Automática - Linux/Mac
# WhatPro Chat Demo Generator

echo "========================================"
echo "  INSTALAÇÃO AUTOMÁTICA - LINUX/MAC"
echo "  WhatPro Chat Demo Generator"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Python
echo "[1/6] Verificando Python..."
if command -v python3 &> /dev/null; then
    PYTHON=python3
    PIP=pip3
    echo -e "${GREEN}✓ Python encontrado${NC}"
elif command -v python &> /dev/null; then
    PYTHON=python
    PIP=pip
    echo -e "${GREEN}✓ Python encontrado${NC}"
else
    echo -e "${RED}✗ ERRO: Python não encontrado!${NC}"
    echo ""
    echo "Por favor, instale Python:"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
    echo "  Mac: brew install python3"
    echo ""
    exit 1
fi

# Mostrar versão
$PYTHON --version
echo ""

# Verificar pip
echo "[2/6] Verificando pip..."
if command -v $PIP &> /dev/null; then
    echo -e "${GREEN}✓ pip encontrado${NC}"
else
    echo -e "${YELLOW}⚠ pip não encontrado, tentando instalar...${NC}"
    
    # Tentar instalar pip
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt update
        sudo apt install python3-pip -y
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        $PYTHON -m ensurepip --upgrade
    fi
fi
echo ""

# Criar ambiente virtual (opcional mas recomendado)
echo "[3/6] Configurando ambiente virtual..."
if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠ Ambiente virtual já existe${NC}"
else
    echo "Criando ambiente virtual..."
    $PYTHON -m venv venv
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Ambiente virtual criado${NC}"
    else
        echo -e "${YELLOW}⚠ Não foi possível criar ambiente virtual (não é crítico)${NC}"
    fi
fi
echo ""

# Ativar ambiente virtual
if [ -d "venv" ]; then
    echo "Ativando ambiente virtual..."
    source venv/bin/activate
    PIP=pip  # No venv, use pip ao invés de pip3
fi

# Instalar dependências
echo "[4/6] Instalando dependências (faker, requests)..."

# Tentar diferentes métodos
if $PIP install faker requests 2>/dev/null; then
    echo -e "${GREEN}✓ Dependências instaladas${NC}"
elif $PIP install faker requests --break-system-packages 2>/dev/null; then
    echo -e "${GREEN}✓ Dependências instaladas (usando --break-system-packages)${NC}"
elif $PIP install faker requests --user 2>/dev/null; then
    echo -e "${GREEN}✓ Dependências instaladas (usando --user)${NC}"
else
    echo -e "${RED}✗ Erro ao instalar dependências${NC}"
    echo "Tente manualmente:"
    echo "  $PIP install faker requests --break-system-packages"
    exit 1
fi
echo ""

# Criar .env
echo "[5/6] Configurando arquivo .env..."
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env já existe, mantendo...${NC}"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Arquivo .env criado${NC}"
    else
        echo -e "${YELLOW}⚠ .env.example não encontrado${NC}"
    fi
fi
echo ""

# Testar instalação
echo "[6/6] Testando instalação..."
if $PYTHON -c "import requests; from faker import Faker; print('OK - Módulos carregados com sucesso!')" 2>/dev/null; then
    echo -e "${GREEN}✓ Teste passou!${NC}"
else
    echo -e "${RED}✗ Erro ao carregar módulos${NC}"
    exit 1
fi
echo ""

# Instruções finais
echo "========================================"
echo -e "  ${GREEN}INSTALAÇÃO CONCLUÍDA!${NC}"
echo "========================================"
echo ""
echo "PRÓXIMOS PASSOS:"
echo ""
echo "1. Edite o arquivo .env com suas credenciais:"
echo "   nano .env"
echo "   (ou use seu editor preferido)"
echo ""
echo "2. Cole sua API Key do chat.whatpro.com.br"
echo ""
echo "3. Execute o gerador:"
echo ""
if [ -d "venv" ]; then
    echo "   # Ative o ambiente virtual primeiro (sempre que usar):"
    echo "   source venv/bin/activate"
    echo ""
fi
echo "   # Modo interativo:"
echo "   $PYTHON quickstart.py"
echo ""
echo "   # OU linha de comando:"
echo "   $PYTHON gerar_demo.py --nicho ecommerce --empresa \"Teste\""
echo ""
echo "========================================"
echo ""

# Oferecer abrir editor
read -p "Deseja editar o .env agora? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    elif command -v vi &> /dev/null; then
        vi .env
    else
        echo "Editor não encontrado. Abra .env manualmente."
    fi
fi

echo ""
echo "Instalação concluída! 🎉"
