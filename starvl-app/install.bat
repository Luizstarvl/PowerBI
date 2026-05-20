@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo    STARVL - Instalacao de Dependencias
echo ========================================
echo.
echo Pasta do projeto: %CD%
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo ERRO: npm nao encontrado.
    echo Instale o Node.js e execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

echo [1/2] Instalando dependencias do frontend (starvl-app)...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ERRO: falha ao instalar dependencias do frontend.
    pause
    exit /b 1
)

echo.
echo [2/2] Instalando dependencias da API (starvl-api)...
echo.
if not exist "%~dp0..\starvl-api\package.json" (
    echo AVISO: pasta starvl-api nao encontrada em %~dp0..\starvl-api
    echo Verifique se a pasta starvl-api esta no lugar correto.
    echo.
    pause
    exit /b 1
)

pushd "%~dp0..\starvl-api"
call npm install
if errorlevel 1 (
    echo.
    echo ERRO: falha ao instalar dependencias da API.
    popd
    pause
    exit /b 1
)
popd

echo.
echo ========================================
echo    Instalacao concluida!
echo    Frontend: OK
echo    API:      OK
echo ========================================
echo.
pause
