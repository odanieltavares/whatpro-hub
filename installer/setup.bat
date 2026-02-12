@echo off
setlocal EnableDelayedExpansion

TITLE Whatpro Setup Manager

:MENU
cls
echo ===============================================================================
echo      WHATPRO SETUP MANAGER - WINDOWS
echo ===============================================================================
echo.
echo  1) [INICIAR] Setup Completo (Recomendado)
echo     - Verifica/Instala WSL e Ubuntu
echo     - Inicia o instalador no Linux
echo.
echo  2) [RESET] Resetar Ambiente Linux (Ubuntu-24.04)
echo     - APAGA TUDO no Ubuntu e reinstala do zero.
echo     - Use se o ambiente estiver quebrado/sujo.
echo.
echo  3) [REMOVER] Desinstalar Docker Desktop
echo     - Remove o Docker do Windows via Winget.
echo.
echo  4) [DIAG] Diagnostico de Ambiente
echo     - Mostra versoes do WSL, Docker e Linux.
echo.
echo  0) Sair
echo.
echo ===============================================================================
set /p opt="Escolha uma opcao: "

if "%opt%"=="1" goto START_SETUP
if "%opt%"=="2" goto RESET_UBUNTU
if "%opt%"=="3" goto UNINSTALL_DOCKER
if "%opt%"=="4" goto DIAGNOSTICS
if "%opt%"=="0" exit /b 0

echo Opcao invalida.
pause
goto MENU

:START_SETUP
echo.
echo [*] Iniciando fluxo de instalacao...
echo.

:: 1. Verificando WSL
wsl --status >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] WSL nao detectado.
    echo.
    set /p install_wsl="Deseja instalar o WSL agora? [Y/N]: "
    if /i "!install_wsl!"=="Y" (
        wsl --install
        echo [!] Reinicie o computador e rode este script novamente.
        pause
        exit /b 1
    ) else (
        goto MENU
    )
)

:: 2. Seleção de Distro
echo.
echo ===============================================================================
echo      DISTRIBUICOES WSL DISPONIVEIS
echo ===============================================================================
wsl -l -v
echo ===============================================================================
echo.
echo Digite o NOME EXATO da distribuicao que deseja usar (ex: Ubuntu-24.04).
echo Ou digite 'INSTALL' para baixar e instalar o Ubuntu-24.04 (Recomendado).
echo.
set /p TARGET_DISTRO="Distribuicao alvo: "

if /i "%TARGET_DISTRO%"=="INSTALL" (
    echo.
    echo [*] Instalando Ubuntu-24.04...
    wsl --install -d Ubuntu-24.04
    if !errorlevel! neq 0 (
        echo [!] Erro ao instalar. Tente manual: wsl --install -d Ubuntu-24.04
        pause
        goto MENU
    )
    set "TARGET_DISTRO=Ubuntu-24.04"
    echo.
    echo [!] Configure usuario/senha na janela aberta, feche-a e volte aqui.
    pause
)

:: Validar se a distro existe (se nao for recem instalada)
wsl -d !TARGET_DISTRO! -- exit >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Erro: A distribuicao '!TARGET_DISTRO!' nao foi encontrada ou nao esta rodando.
    echo     Verifique o nome digitado (maiusculas/minusculas importam as vezes).
    pause
    goto START_SETUP
)

:: 3. Preparando e Lançando
echo.
echo [*] Preparando ambiente em: !TARGET_DISTRO!
wsl -d !TARGET_DISTRO! -- bash -c "if [ -f './whatpro-setup' ]; then tr -d '\r' < ./whatpro-setup > ./whatpro-setup.tmp && mv -f ./whatpro-setup.tmp ./whatpro-setup && chmod +x ./whatpro-setup; fi"

echo.
echo [*] Entrando no ambiente Linux (!TARGET_DISTRO!)...
echo.
wsl -d !TARGET_DISTRO! -- ./whatpro-setup
echo.
pause
goto MENU

:RESET_UBUNTU
echo.
echo [!] ATENCAO: Isso vai EXCLUIR TODOS OS DADOS da distribuicao Ubuntu-24.04.
echo     Projetos, bancos de dados locais no WSL e configuracoes serao perdidos.
echo.
set /p confirm="Tem certeza absoluta? Digite 'RESET' para confirmar: "
if /i not "%confirm%"=="RESET" (
    echo Cancelado.
    pause
    goto MENU
)

echo [*] Parando WSL...
wsl --shutdown
echo [*] Removendo Ubuntu-24.04...
wsl --unregister Ubuntu-24.04
echo.
echo [OK] Ambiente resetado com sucesso.
echo      Escolha a opcao 1 no menu para reinstalar do zero.
pause
goto MENU

:UNINSTALL_DOCKER
echo.
echo [*] Tentando desinstalar Docker Desktop via Winget...
winget uninstall Docker.DockerDesktop
if %errorlevel% equ 0 (
    echo.
    echo [OK] Docker Desktop removido.
    echo      Reinicie o computador para concluir.
) else (
    echo.
    echo [!] Falha ao remover ou Docker nao encontrado via Winget.
    echo     Tente remover manualmente pelo 'Adicionar ou Remover Programas'.
)
pause
goto MENU

:DIAGNOSTICS
cls
echo ===============================================================================
echo      DIAGNOSTICO DO SISTEMA
echo ===============================================================================
echo.
echo [WSL Status]
wsl --status
echo.
echo [Distribuicoes Instaladas]
wsl -l -v
echo.
echo [Docker Version - Windows]
docker --version 2>nul || echo Nao encontrado no Windows PATH (Isso e normal se usar so no WSL)
echo.
echo [Conectividade Internet]
ping -n 1 google.com >nul && echo OK || echo Falha
echo.
echo ===============================================================================
echo OPCOES DE DIAGNOSTICO:
echo  1) Atualizar/Rodar Novamente
echo  2) RESETAR Ubuntu-24.04 (Corrigir erro de Distro)
echo  3) Desinstalar Docker Desktop (Para reinstalacao limpa)
echo  0) Voltar ao Menu Principal
echo.
set /p diag_opt="Escolha uma opcao: "

if "%diag_opt%"=="1" goto DIAGNOSTICS
if "%diag_opt%"=="2" goto RESET_UBUNTU
if "%diag_opt%"=="3" goto UNINSTALL_DOCKER
if "%diag_opt%"=="0" goto MENU

echo Opcao invalida.
pause
goto DIAGNOSTICS
