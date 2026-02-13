@echo off
REM Script de Instalacao Automatica - Windows
REM WhatPro Chat Demo Generator

echo ========================================
echo   INSTALACAO AUTOMATICA - WINDOWS
echo   WhatPro Chat Demo Generator
echo ========================================
echo.

REM Verificar Python
echo [1/5] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERRO: Python nao encontrado!
        echo.
        echo Por favor, instale Python:
        echo https://www.python.org/downloads/
        echo.
        echo IMPORTANTE: Marque "Add Python to PATH" na instalacao!
        pause
        exit /b 1
    ) else (
        set PYTHON=py
        echo OK - Python encontrado (usando 'py')
    )
) else (
    set PYTHON=python
    echo OK - Python encontrado
)

echo.

REM Instalar dependencias
echo [2/5] Instalando dependencias (faker, requests)...
%PYTHON% -m pip install faker requests
if %errorlevel% neq 0 (
    echo.
    echo Tentando metodo alternativo...
    %PYTHON% -m pip install --user faker requests
)
echo OK - Dependencias instaladas
echo.

REM Criar .env
echo [3/5] Configurando arquivo .env...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo OK - Arquivo .env criado
    ) else (
        echo AVISO: .env.example nao encontrado
    )
) else (
    echo OK - .env ja existe
)
echo.

REM Testar instalacao
echo [4/5] Testando instalacao...
%PYTHON% -c "import requests; from faker import Faker; print('OK - Modulos carregados com sucesso!')"
if %errorlevel% neq 0 (
    echo ERRO: Nao foi possivel carregar os modulos!
    pause
    exit /b 1
)
echo.

REM Instrucoes finais
echo [5/5] Configuracao final...
echo.
echo ========================================
echo   INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. Edite o arquivo .env com suas credenciais:
echo    - Abra .env com Bloco de Notas
echo    - Cole sua API Key do chat.whatpro.com.br
echo    - Salve o arquivo
echo.
echo 2. Execute o gerador:
echo    %PYTHON% quickstart.py
echo.
echo    OU
echo.
echo    %PYTHON% gerar_demo.py --nicho ecommerce --empresa "Teste"
echo.
echo ========================================
echo.
echo Pressione qualquer tecla para abrir o .env...
pause >nul
notepad .env
