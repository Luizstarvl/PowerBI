@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    STARVL - Iniciando Servidores
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado.
    echo Instale o Node.js e execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

REM Verifica dependencias do frontend
if not exist node_modules (
    echo Dependencias do frontend nao encontradas. Instalando...
    call npm install
    if errorlevel 1 (
        echo ERRO: falha ao instalar dependencias do frontend.
        pause
        exit /b 1
    )
    echo.
)

REM Verifica dependencias da API
if not exist "%~dp0..\starvl-api\node_modules" (
    echo Dependencias da API nao encontradas. Instalando...
    pushd "%~dp0..\starvl-api"
    call npm install
    if errorlevel 1 (
        echo ERRO: falha ao instalar dependencias da API.
        popd
        pause
        exit /b 1
    )
    popd
    echo.
)

REM Verifica porta 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING" 2^>nul') do (
    echo ERRO: porta 3000 ja em uso pelo PID %%a.
    echo Execute stop.bat e tente novamente.
    echo.
    pause
    exit /b 1
)

REM Verifica porta 3001
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING" 2^>nul') do (
    echo ERRO: porta 3001 ja em uso pelo PID %%a.
    echo Execute stop.bat e tente novamente.
    echo.
    pause
    exit /b 1
)

echo Iniciando API (porta 3001)...
start "STARVL-API" cmd /k "chcp 65001 >nul & cd /d "%~dp0..\starvl-api" & node server.js"

echo Aguardando API iniciar...
timeout /t 3 >nul

echo Iniciando frontend (porta 3000)...
echo.
echo Para PARAR os servidores, use o stop.bat
echo ou feche ambas as janelas de comando.
echo.
echo ========================================
echo.

set PORT=3000
set BROWSER=none
start "" powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 8; Start-Process 'http://localhost:3000'"
call npm start

echo.
echo O servidor frontend foi encerrado.
echo Lembre-se de fechar a janela da API tambem (STARVL-API).
echo.
pause
