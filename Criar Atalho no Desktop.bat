@echo off
chcp 65001 >nul
color 0b
title Criar Atalho do CRM Isapel na Área de Trabalho

echo ======================================================================
echo            ISAPEL PAPÉIS - CRIAR ATALHO NA ÁREA DE TRABALHO
echo ======================================================================
echo.
echo Criando atalho do CRM no seu computador...

set "TARGET_FILE=%~dp0Abrir CRM Isapel.bat"
if not exist "%TARGET_FILE%" (
    set "TARGET_FILE=%~dp0..\Abrir CRM Isapel.bat"
)
if not exist "%TARGET_FILE%" (
    set "TARGET_FILE=%~dp0index.html"
)

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'CRM Isapel Papéis.lnk')); $s.TargetPath = '%TARGET_FILE%'; $s.Description = 'CRM Comercial B2B Isapel Papéis'; $s.Save()"

if %ERRORLEVEL% EQU 0 (
    color 0a
    echo.
    echo ======================================================================
    echo           [SUCESSO] ATALHO CRIADO NA SUA ÁREA DE TRABALHO!
    echo ======================================================================
    echo.
    echo O ícone 'CRM Isapel Papéis' já está disponível na sua Área de Trabalho.
    echo Agora você pode abrir o CRM direto da sua tela a qualquer momento!
    echo.
) else (
    color 0c
    echo [AVISO] Não foi possível criar o atalho automaticamente via PowerShell.
    echo Você pode simplesmente clicar com botão direito em 'Abrir CRM Isapel.bat'
    echo e selecionar: Enviar para -> Área de trabalho (criar atalho).
)

echo.
echo Pressione qualquer tecla para fechar esta janela.
pause >nul
