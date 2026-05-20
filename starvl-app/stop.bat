@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    STARVL - Parando Servidores
echo ========================================
echo.

REM Para o frontend (porta 3000)
echo Procurando frontend na porta 3000...
set FOUND3000=0
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING" 2^>nul') do (
    set FOUND3000=1
    echo Parando frontend (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
    echo Frontend parado.
)
if "%FOUND3000%"=="0" echo Nenhum processo na porta 3000.

echo.

REM Para a API (porta 3001)
echo Procurando API na porta 3001...
set FOUND3001=0
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING" 2^>nul') do (
    set FOUND3001=1
    echo Parando API (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
    echo API parada.
)
if "%FOUND3001%"=="0" echo Nenhum processo na porta 3001.

REM Encerra janelas cmd com titulo STARVL-API
taskkill /FI "WINDOWTITLE eq STARVL-API" /F >nul 2>&1

echo.
echo ========================================
echo    Servidores STARVL parados
echo ========================================
echo.
pause
