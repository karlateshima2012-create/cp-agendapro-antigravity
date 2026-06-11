# Guia de Deploy — CP Agenda Pro (VPS)
**Atualizado:** 11 de junho de 2026

---

## Visão Geral

O sistema tem **dois caminhos de deploy**:

| Caminho | Quando usar | Quem executa |
|---------|-------------|--------------|
| **Automático** via GitHub Actions | Todo `git push origin main` | GitHub (CI/CD) |
| **Manual** via rsync + SSH | Emergência, hotfix sem acesso ao GitHub | Desenvolvedor |

O caminho automático é o **padrão e recomendado**. O manual é reservado para situações de urgência.

---

## Infraestrutura

| Item | Valor |
|------|-------|
| VPS IP | `76.13.209.192` |
| Usuário de deploy | `deploy` |
| Porta SSH | Variável (ver GitHub Secrets: `SSH_PORT`) |
| OS | Ubuntu 22.04 |
| PHP | 8.3 (PHP-FPM: `php8.3-fpm`) |
| Web server | Nginx |
| Domínio | `cpagendapro.creativeprintjp.com` |
| SSL | Let's Encrypt (Certbot) |

### Estrutura de diretórios na VPS

```
/var/www/cpagendapro/
├── public/             ← Frontend (Nginx serve daqui — root do site)
│   ├── index.html
│   └── assets/
├── backend/
│   ├── api/            ← Rotas PHP, libs, config
│   ├── database/
│   │   └── migrations/ ← Scripts SQL de migração
│   ├── vendor/         ← Dependências PHP (gerado pelo composer no VPS)
│   ├── .env            ← Gerado pelo GitHub Actions a partir dos Secrets
│   ├── migrate.php     ← Runner de migrations (executado em cada deploy)
│   └── composer.json
├── .project-id         ← Marcador de identidade: "cpagenda-jp-v1"
└── dist/               ← Diretório antigo de testes, NÃO é servido pelo Nginx
```

> **Atenção:** O Nginx serve exclusivamente de `/var/www/cpagendapro/public/`.
> O diretório `dist/` que existe na VPS é um resíduo de testes — **não use como destino de deploy**.

### Outros caminhos relevantes na VPS

```
/home/deploy/
├── bin/
│   └── safe-deploy-jp.sh   ← Script chamado no final de cada deploy
├── backups/
│   └── cpagendapro-public/ ← Últimos 5 backups automáticos do frontend
├── logs/
│   └── deploy-jp.log       ← Log de todos os deploys
└── php-sessions/           ← Sessões PHP (fora do alcance do systemd cleaner)
```

---

## Caminho 1 — Deploy Automático (GitHub Actions)

### Gatilho

Qualquer `git push` para a branch `main` dispara o workflow automaticamente.

```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

O workflow está em `.github/workflows/deploy.yml`.

### O que o GitHub Actions faz (passo a passo)

```
1. Checkout do código
        ↓
2. Instala Node.js 20 + npm install
        ↓
3. npm run build  →  gera a pasta dist/
        ↓
4. Instala PHP 8.3 + Composer
        ↓
5. composer install (para PHPStan poder rodar)
        ↓
6. PHPStan — análise estática PHP
   ⚠️  Se houver erro de tipagem, o deploy é CANCELADO aqui
        ↓
7. Gera backend/.env com os valores dos GitHub Secrets
        ↓
8. Configura a chave SSH (secret SSH_PRIVATE_KEY)
        ↓
9. Verifica identidade do projeto na VPS
   Lê /var/www/cpagendapro/.project-id
   Se não for "cpagenda-jp-v1" → deploy CANCELADO
        ↓
10. rsync: dist/ → VPS:/var/www/cpagendapro/public/
        ↓
11. rsync: backend/ → VPS:/var/www/cpagendapro/backend/
    (exclui vendor/ — será recriado na VPS)
        ↓
12. SSH na VPS:
    a. chown -R deploy:www-data /var/www/cpagendapro/backend
    b. chmod 640 backend/.env
    c. composer install --no-dev (recria vendor/ na VPS)
    d. php migrate.php  (executa migrations novas)
    e. /home/deploy/bin/safe-deploy-jp.sh
       → faz backup do public/ anterior
       → corrige permissões
       → systemctl reload php8.3-fpm
```

### GitHub Secrets obrigatórios

Configurar em: `GitHub → Repositório → Settings → Secrets and variables → Actions`

| Secret | Descrição |
|--------|-----------|
| `DB_HOST` | Host do banco MySQL (ex: `127.0.0.1`) |
| `DB_PORT` | Porta MySQL (ex: `3306`) |
| `DB_NAME` | Nome do banco |
| `DB_USER` | Usuário do banco |
| `DB_PASS` | Senha do banco |
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram das profissionais |
| `TELEGRAM_MONITOR_TOKEN` | Token do bot de monitoramento de erros |
| `TELEGRAM_ERROR_CHAT_ID` | Chat ID para alertas de erro |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID para notificações admin |
| `SMTP_USER` | E-mail SMTP (Hostinger) |
| `SMTP_PASSWORD` | Senha SMTP |
| `SMTP_FROM` | E-mail remetente |
| `SMTP_FROM_NAME` | Nome do remetente |
| `SSH_PRIVATE_KEY` | Conteúdo completo da chave privada SSH (começando com `-----BEGIN`) |
| `SSH_HOST` | IP da VPS: `76.13.209.192` |
| `SSH_PORT` | Porta SSH da VPS |
| `SSH_USER` | `deploy` |

---

## Caminho 2 — Deploy Manual (Emergência)

Use apenas quando o GitHub Actions não estiver disponível ou para um hotfix urgente.

### Pré-requisitos na máquina do desenvolvedor

- Chave SSH configurada: `~/.ssh/github_deploy_cpagenda`
- Node.js 20+ instalado
- Acesso SSH ao usuário `deploy@76.13.209.192`

---

### Método A: Via Script de Deploy Automatizado (Recomendado)

Para facilitar e mitigar erros humanos, foi criado um script local que realiza todo o build, validação e sincronização em um único comando. Na raiz do projeto, execute:

```bash
chmod +x scripts/safe_deploy.sh
./scripts/safe_deploy.sh
```

**O que o script faz de forma segura:**
1. Compila o React (`npm run build`). Se houver qualquer erro de compilação ou de TypeScript, o deploy aborta na hora, protegendo a produção.
2. Verifica se a pasta `dist/` não está vazia.
3. Sincroniza o frontend (`dist/`) com `/var/www/cpagendapro/public/` na VPS via `rsync`.
4. Sincroniza o backend com `/var/www/cpagendapro/backend/` na VPS via `rsync` (excluindo dependências locais `vendor/`).
5. Abre uma sessão SSH automática na VPS, corrige as permissões do `.env`, roda o `composer install --no-dev`, executa novas migrations e recarrega o PHP-FPM.

---

### Método B: Passo a passo manual (Comandos Individuais)

Se preferir rodar cada comando manualmente ou se o script falhar por algum motivo:

**1. Build do frontend**
```bash
cd /caminho/para/cp_agenda_pro
npm run build
```
Isso gera a pasta `dist/` localmente.

**2. Enviar frontend para a VPS**
```bash
rsync -az --delete \
  -e "ssh -i ~/.ssh/github_deploy_cpagenda" \
  dist/ \
  deploy@76.13.209.192:/var/www/cpagendapro/public/
```
> **Importante:** O destino correto é `/var/www/cpagendapro/public/`, não `dist/`. O Nginx serve exclusivamente de `public/`.

**3. Enviar backend para a VPS**
```bash
rsync -az \
  -e "ssh -i ~/.ssh/github_deploy_cpagenda" \
  --exclude="vendor/" \
  backend/ \
  deploy@76.13.209.192:/var/www/cpagendapro/backend/
```

**4. Finalizar na VPS via SSH**
```bash
ssh -i ~/.ssh/github_deploy_cpagenda deploy@76.13.209.192
```

Dentro da VPS, executar:
```bash
# Corrigir permissões
sudo chown -R deploy:www-data /var/www/cpagendapro/backend
chmod 640 /var/www/cpagendapro/backend/.env

# Instalar dependências PHP (sem dev)
cd /var/www/cpagendapro/backend
composer install --no-dev --optimize-autoloader --no-interaction

# Rodar migrations
php /var/www/cpagendapro/backend/migrate.php

# Finalizar deploy (backup + permissões + reload PHP-FPM)
/home/deploy/bin/safe-deploy-jp.sh
```

**5. Verificar se o site está respondendo**
```bash
curl -s -o /dev/null -w "%{http_code}" https://cpagendapro.creativeprintjp.com
# Deve retornar 200
```

---

## Sistema de Migrations

### Como funciona

- Arquivos SQL em `backend/database/migrations/`
- Nomeados sequencialmente: `0001_descricao.sql`, `0002_descricao.sql`, etc.
- O banco de dados mantém uma tabela `migrations` com o histórico do que já foi executado
- O `migrate.php` só executa arquivos **ainda não registrados** — é idempotente e seguro rodar múltiplas vezes

### Como adicionar uma migration nova

1. Criar arquivo em `backend/database/migrations/` com o próximo número sequencial:
   ```
   backend/database/migrations/0014_nome_descritivo.sql
   ```

2. Escrever o SQL de forma idempotente (não quebre se rodar duas vezes):
   ```sql
   -- Usar IF NOT EXISTS, IF EXISTS, ou checagens explícitas
   ALTER TABLE cp_agenda_accounts
     ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(50) DEFAULT '';
   ```

3. Commitar e fazer push — a migration roda automaticamente no próximo deploy.

### Migrations existentes

| Arquivo | Descrição |
|---------|-----------|
| `0001_initial_schema.sql` | Schema completo inicial |
| `0002_...` | Índice composto em appointments |
| `0003_...` | Buffer de limpeza em serviços |
| `0004_...` | Campo end_datetime em appointments |
| `0005_...` | CRM e bloqueio parcial de horários |
| `0006_...` | Tabela de archive de appointments |
| `0007_...` | Campos de imagem em serviços |
| `0008_...` | Campo last_access em accounts |
| `0009_...` | Campo invoices (JSON) em accounts |
| `0010_...` | Campos de customização (cores, modo de view) |
| `0011_...` | Meses disponíveis em availability |
| `0012_...` | Corrige ENUM plan_type (adiciona '1m' e '3m') |
| `0013_...` | Corrige registros com plan_type vazio |
| **próxima** | `0014_...` |

---

## Verificação Pós-Deploy

Após qualquer deploy (automático ou manual), verificar:

```bash
# 1. Site carrega
curl -s -o /dev/null -w "%{http_code}" https://cpagendapro.creativeprintjp.com
# Esperado: 200

# 2. API responde
curl -s -o /dev/null -w "%{http_code}" https://cpagendapro.creativeprintjp.com/api/
# Esperado: 400 ou 401 (não 500 nem 502)

# 3. Log de deploy na VPS
ssh -i ~/.ssh/github_deploy_cpagenda deploy@76.13.209.192 \
  "tail -20 /home/deploy/logs/deploy-jp.log"
```

---

## Configuração da Chave SSH (Setup inicial para novo desenvolvedor)

O usuário `deploy` na VPS aceita autenticação por chave SSH. Para configurar:

**1.** Gerar um par de chaves (se ainda não tiver):
```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com" -f ~/.ssh/github_deploy_cpagenda
```

**2.** Adicionar a chave pública na VPS (pedir ao admin para executar):
```bash
# Na VPS, como o usuário deploy:
echo "SUA_CHAVE_PUBLICA" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**3.** Testar conexão:
```bash
ssh -i ~/.ssh/github_deploy_cpagenda deploy@76.13.209.192 "echo OK"
```

**4.** Para o GitHub Actions, o admin do repositório deve adicionar o conteúdo da **chave privada** no Secret `SSH_PRIVATE_KEY`.

---

## Rollback de Emergência

Se um deploy quebrar o site, o backup mais recente do frontend pode ser restaurado na VPS:

```bash
ssh -i ~/.ssh/github_deploy_cpagenda deploy@76.13.209.192

# Listar backups disponíveis
ls -lt /home/deploy/backups/cpagendapro-public/

# Restaurar o backup mais recente
BACKUP=$(ls -dt /home/deploy/backups/cpagendapro-public/public_* | head -1)
rsync -a --delete "$BACKUP/" /var/www/cpagendapro/public/
sudo systemctl reload php8.3-fpm
echo "Rollback para $BACKUP concluído"
```

> O sistema mantém os **5 backups mais recentes** automaticamente. Não há rollback automático de backend ou banco de dados — se necessário, restaurar manualmente a partir do histórico git.

---

## Resumo Visual do Fluxo Automático

```
Desenvolvedor
    │
    │  git push origin main
    ▼
GitHub Repository
    │
    │  dispara workflow
    ▼
GitHub Actions (ubuntu-latest)
    ├─ npm run build ──────────────────────── gera dist/
    ├─ composer install + PHPStan ─────────── valida código PHP
    ├─ gera backend/.env (dos Secrets) ───── credenciais seguras
    ├─ rsync dist/ → VPS public/ ─────────── envia frontend
    └─ rsync backend/ → VPS backend/ ──────── envia backend
              │
              │  SSH
              ▼
         VPS (deploy@76.13.209.192)
              ├─ chown + chmod .env
              ├─ composer install --no-dev
              ├─ php migrate.php ────────────── migrations novas
              └─ safe-deploy-jp.sh
                    ├─ backup do public/ anterior
                    ├─ corrige permissões
                    └─ reload php8.3-fpm
```

---

*Documento criado em 11 de junho de 2026. Baseado na análise do arquivo `.github/workflows/deploy.yml`, configuração Nginx da VPS e script `/home/deploy/bin/safe-deploy-jp.sh`.*
