@echo OFF
REM =================================================================
REM        SCRIPT DE DEPLOY AUTOMATIZADO PARA O GOOGLE CLOUD RUN
REM =================================================================

REM --- VARIAVEIS DE CONFIGURACAO ---
REM Altere estas variaveis se o seu projeto ou servico tiverem nomes diferentes.

set PROJECT_ID="gen-lang-client-0923349304"
set SERVICE_NAME="healthflow"
set REGION="us-central1"

REM --- NAO ALTERE DAQUI PARA BAIXO ---
set IMAGE_NAME="gcr.io/%PROJECT_ID%/%SERVICE_NAME%"

echo.
echo --- CONFIGURANDO PROJETO: %PROJECT_ID% ---
gcloud config set project %PROJECT_ID%
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Nao foi possivel configurar o projeto. Verifique se voce esta autenticado no gcloud.
    goto :EOF
)

echo.
echo --- INICIANDO BUILD DA IMAGEM: %IMAGE_NAME% ---
gcloud builds submit . --tag %IMAGE_NAME%
if %ERRORLEVEL% neq 0 (
    echo [ERRO] O processo de build da imagem falhou. Verifique as mensagens de erro acima.
    goto :EOF
)

echo.
echo --- BUILD CONCLUIDO COM SUCESSO! ---
echo.
echo --- INICIANDO DEPLOY DO SERVICO '%SERVICE_NAME%' NA REGIAO '%REGION%' ---
gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --port 8080
if %ERRORLEVEL% neq 0 (
    echo [ERRO] O processo de deploy no Cloud Run falhou. Verifique as mensagens de erro acima.
    goto :EOF
)

echo.
echo --- DEPLOY CONCLUIDO COM SUCESSO! ---
echo.
echo A sua aplicacao esta disponivel na URL fornecida acima.
pause
