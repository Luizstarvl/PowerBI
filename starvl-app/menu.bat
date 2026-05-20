@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"
color 0C
title STARVL - Menu Principal

:menu
cls
echo.
echo  EEEEEE TTTTTT  AAAA  RRRR  VV  VV LL
echo  EE       TT   AA  AA RR RR VV  VV LL
echo  EEEE     TT   AAAAAA RRRR  VV  VV LL
echo  EE       TT   AA  AA RR RR  VVVV  LL
echo  EEEEEE   TT   AA  AA RR  RR  VV   LLLLL
echo.
echo  ========================================
echo     Sistema de Gestao de Postos
echo  ========================================
echo.

REM Status dos servidores
set STATUS_API=PARADA
set STATUS_FRONT=PARADO
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING" 2^>nul') do set STATUS_API=RODANDO (PID %%a)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING" 2^>nul') do set STATUS_FRONT=RODANDO (PID %%a)

echo  API    (porta 3001): !STATUS_API!
echo  App    (porta 3000): !STATUS_FRONT!
echo.
echo  ========================================
echo.
echo  [1] Instalar Dependencias
echo  [2] Iniciar Servidores (API + Frontend)
echo  [3] Parar Servidores
echo  [4] Abrir no Navegador
echo  [5] Limpar Cache
echo  [0] Sair
echo.
echo  ========================================
echo.

set /p opcao="  Escolha uma opcao: "

if "%opcao%"=="1" goto install
if "%opcao%"=="2" goto start
if "%opcao%"=="3" goto stop
if "%opcao%"=="4" goto browser
if "%opcao%"=="5" goto clean
if "%opcao%"=="0" goto exit

echo  Opcao invalida!
timeout /t 2 >nul
goto menu

:install
cls
echo.
echo  ========================================
echo     Instalando Dependencias
echo  ========================================
echo.
echo  [1/2] Frontend (starvl-app)...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo  ERRO: falha no frontend.
    pause
    goto menu
)
echo.
echo  [2/2] API (starvl-api)...
echo.
if not exist "%~dp0..\starvl-api\package.json" (
    echo  AVISO: pasta starvl-api nao encontrada!
    echo  Verifique se a pasta existe em: %~dp0..\starvl-api
    pause
    goto menu
)
pushd "%~dp0..\starvl-api"
call npm install
if errorlevel 1 (
    echo.
    echo  ERRO: falha na API.
    popd
    pause
    goto menu
)
popd
echo.
echo  Instalacao concluida! Frontend + API prontos.
timeout /t 3 >nul
goto menu

:start
cls
echo.
echo  ========================================
echo     Iniciando Servidores
echo  ========================================
echo.

REM Checa dependencias
if not exist node_modules (
    echo  Instalando dependencias do frontend...
    call npm install
)
if not exist "%~dp0..\starvl-api\node_modules" (
    echo  Instalando dependencias da API...
    pushd "%~dp0..\starvl-api"
    call npm install
    popd
)

REM Verifica conflitos de porta
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING" 2^>nul') do (
    echo  ERRO: porta 3000 ja em uso (PID %%a). Use a opcao 3 para parar.
    pause
    goto menu
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING" 2^>nul') do (
    echo  ERRO: porta 3001 ja em uso (PID %%a). Use a opcao 3 para parar.
    pause
    goto menu
)

echo  Iniciando API na porta 3001...
start "STARVL-API" cmd /k "chcp 65001 >nul & cd /d "%~dp0..\starvl-api" & node server.js"
timeout /t 3 >nul

echo  Iniciando frontend na porta 3000...
echo.
echo  Para parar: feche esta janela e use a opcao 3 (Parar Servidores)
echo.
set PORT=3000
set BROWSER=none
start "" powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 8; Start-Process 'http://localhost:3000'"
call npm start
echo.
echo  Frontend encerrado. Feche a janela STARVL-API tambem.
pause
goto menu

:stop
cls
echo.
echo  ========================================
echo     Parando Servidores
echo  ========================================
echo.
set FOUND3000=0
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING" 2^>nul') do (
    set FOUND3000=1
    echo  Parando frontend PID %%a...
    taskkill /F /PID %%a >nul 2>&1
    echo  Frontend parado.
)
if "!FOUND3000!"=="0" echo  Frontend nao estava rodando.

echo.
set FOUND3001=0
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING" 2^>nul') do (
    set FOUND3001=1
    echo  Parando API PID %%a...
    taskkill /F /PID %%a >nul 2>&1
    echo  API parada.
)
if "!FOUND3001!"=="0" echo  API nao estava rodando.

taskkill /FI "WINDOWTITLE eq STARVL-API" /F >nul 2>&1

echo.
echo  Servidores parados.
timeout /t 3 >nul
goto menu

:browser
cls
echo.
echo  Abrindo navegador...
echo.
start http://localhost:3000
timeout /t 2 >nul
goto menu

:clean
cls
echo.
echo  ========================================
echo     Limpando Cache
echo  ========================================
echo.
echo  Limpando starvl-app...
if exist node_modules (
    rmdir /s /q node_modules
    echo  node_modules do frontend removido
)
if exist build (
    rmdir /s /q build
    echo  build removido
)
if exist package-lock.json (
    del package-lock.json
    echo  package-lock.json do frontend removido
)
echo.
echo  Limpando starvl-api...
if exist "%~dp0..\starvl-api\node_modules" (
    rmdir /s /q "%~dp0..\starvl-api\node_modules"
    echo  node_modules da API removido
)
if exist "%~dp0..\starvl-api\package-lock.json" (
    del "%~dp0..\starvl-api\package-lock.json"
    echo  package-lock.json da API removido
)
echo.
echo  Cache limpo! Execute a instalacao novamente (opcao 1).
timeout /t 3 >nul
goto menu

:exit
cls
echo.
echo  Ate logo!
echo.
timeout /t 1 >nul
exit
