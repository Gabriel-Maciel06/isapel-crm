@echo off
setlocal enabledelayedexpansion
pushd "%~dp0"

title CRM Isapel Papéis - Sistema Comercial
echo ========================================================
echo       ISAPEL PAPÉIS - CRM COMERCIAL B2B
echo ========================================================
echo.
echo Iniciando o aplicativo do CRM...
echo.

set "HTML_PATH=%~dp0index.html"

:: Procurar Microsoft Edge (padrão em todo Windows 11)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH:\=/%"
    popd
    exit /b 0
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH:\=/%"
    popd
    exit /b 0
)

:: Procurar Google Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH:\=/%"
    popd
    exit /b 0
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH:\=/%"
    popd
    exit /b 0
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH:\=/%"
    popd
    exit /b 0
)

:: Fallback se nenhum dos executáveis acima for encontrado
start "" "%HTML_PATH%"
popd
exit /b 0
