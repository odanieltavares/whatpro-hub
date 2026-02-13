#!/bin/bash
# WhatPro Chat - Inicializador Linux/Mac
# Execute este arquivo para iniciar

clear

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║           🚀 WHATPRO CHAT - GERADOR DE DEMOS 🚀                  ║"
echo "║                  Inicializador Linux/Mac                          ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar Python
if command -v python3 &> /dev/null; then
    PYTHON=python3
elif command -v python &> /dev/null; then
    PYTHON=python
else
    echo "❌ Python não encontrado!"
    echo ""
    echo "Por favor, instale Python:"
    echo "  Ubuntu/Debian: sudo apt install python3"
    echo "  Mac: brew install python3"
    echo ""
    read -p "Pressione ENTER para sair..."
    exit 1
fi

echo "✅ Python encontrado"
echo ""

# Executar inicializador
$PYTHON iniciar.py

# Se der erro, manter terminal aberto
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Ocorreu um erro!"
    read -p "Pressione ENTER para sair..."
fi
