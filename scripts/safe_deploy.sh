#!/bin/bash
# safe_deploy.sh — Deploy manual seguro para CP Agenda Pro (VPS)
# Uso: ./scripts/safe_deploy.sh
# Executar sempre a partir da raiz do projeto.
set -euo pipefail

VPS_USER="deploy"
VPS_HOST="76.13.209.192"
SSH_KEY="$HOME/.ssh/github_deploy_cpagenda"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
REMOTE_ROOT="/var/www/cpagendapro"

# --- Verificacoes iniciais ---

# Garante que o script esta sendo executado da raiz do projeto
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "ERRO: Execute este script a partir da raiz do projeto cp_agenda_pro."
    exit 1
fi

# Garante que a chave SSH existe
if [ ! -f "$SSH_KEY" ]; then
    echo "ERRO: Chave SSH nao encontrada em $SSH_KEY"
    echo "Solicite a chave ao admin e salve em $SSH_KEY com permissao 600."
    exit 1
fi

echo "=== CP Agenda Pro — Deploy Manual VPS ==="
echo "Destino: $VPS_USER@$VPS_HOST:$REMOTE_ROOT"
echo ""

# --- Passo 1/5: Build do frontend ---
echo "[1/5] Compilando frontend (Vite + TypeScript)..."
npm run build
echo "[1/5] Build concluido."

# --- Passo 2/5: Verificar integridade do build ---
echo "[2/5] Verificando pasta dist/..."
if [ ! -f "dist/index.html" ]; then
    echo "ERRO: dist/index.html nao encontrado — build pode ter falhado silenciosamente."
    exit 1
fi
echo "[2/5] dist/ validado."

# --- Passo 3/5: Enviar frontend ---
echo "[3/5] Enviando frontend (dist/ -> public/)..."
rsync -az --delete \
  -e "ssh $SSH_OPTS" \
  dist/ \
  "$VPS_USER@$VPS_HOST:$REMOTE_ROOT/public/"
echo "[3/5] Frontend enviado."

# --- Passo 4/5: Enviar backend ---
echo "[4/5] Enviando backend..."
rsync -az \
  -e "ssh $SSH_OPTS" \
  --exclude="vendor/" \
  --exclude=".env" \
  backend/ \
  "$VPS_USER@$VPS_HOST:$REMOTE_ROOT/backend/"
echo "[4/5] Backend enviado."

# --- Passo 5/5: Finalizar na VPS ---
echo "[5/5] Executando finalizacao na VPS..."
ssh $SSH_OPTS "$VPS_USER@$VPS_HOST" << 'ENDSSH'
set -euo pipefail

cd /var/www/cpagendapro/backend

# Permissoes do .env (deve existir — gerado separadamente ou mantido na VPS)
if [ -f ".env" ]; then
    sudo chown deploy:www-data .env
    chmod 640 .env
fi

sudo chown -R deploy:www-data /var/www/cpagendapro/backend

# Dependencias PHP
composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | tail -5

# Migrations
php /var/www/cpagendapro/backend/migrate.php

# Backup + permissoes + reload PHP-FPM
/home/deploy/bin/safe-deploy-jp.sh

echo "Finalizacao concluida em $(date '+%Y-%m-%d %H:%M:%S')"
ENDSSH

echo ""
echo "[OK] Deploy concluido. Verificando o site..."

HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://cpagendapro.creativeprintjp.com || echo "000")
if [ "$HTTP" = "200" ]; then
    echo "[OK] Site respondendo com HTTP $HTTP."
else
    echo "[AVISO] Site retornou HTTP $HTTP. Verifique manualmente."
    echo "        https://cpagendapro.creativeprintjp.com"
fi

echo ""
echo "Log do deploy na VPS: /home/deploy/logs/deploy-jp.log"
