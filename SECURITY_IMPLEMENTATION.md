# 🛡️ CP Agenda Pro — Implementação do Plano de Segurança

**Data de início:** 30 de Abril de 2026  
**Responsável:** Antigravity (Automated Security Implementation)

---

## 🚨 SPRINT EMERGENCIAL — Vulnerabilidades Críticas

| Status | ID | Tarefa | Arquivo |
|--------|-----|--------|---------|
| ⏳ | C-1 | Mover senha SMTP para variável de ambiente | `Mail.php`, `.env.example`, `deploy.yml` |
| ⏳ | C-2 | Remover `debug_env.php` e `debug_query.php` do repositório | `backend/api/` |
| ⏳ | C-3 | Remover `force_fix.php` do repositório | `backend/api/` |

---

## 🟠 SPRINT 1 — Vulnerabilidades Altas

| Status | ID | Tarefa | Arquivo |
|--------|-----|--------|---------|
| ⏳ | A-4 | Substituir `SELECT *` por colunas explícitas | `me.php` |
| ⏳ | A-5 | Implementar rate limiting no login e reset de senha | `auth.php` |
| ⏳ | A-6 | Bloquear retorno de dados em contas inativas | `public.php` |
| ⏳ | A-7 | Validação de campos obrigatórios na criação de usuários | `admin.php` |

---

## 🟡 SPRINT 2 — Qualidade e Boas Práticas

| Status | ID | Tarefa | Arquivo |
|--------|-----|--------|---------|
| ⏳ | M-8 | Substituir `console.log` por utilitário condicional | `App.tsx`, `PublicBookingPage.tsx` |
| ⏳ | M-10 | Adicionar headers de segurança HTTP | `.htaccess` (raiz) |
| ⏳ | M-11 | Melhorar tipagem TypeScript (remover `any` desnecessário) | `App.tsx`, `src/api.ts` |
| ⏳ | B-12 | Remover `error_log` com dados de criação de usuário | `admin.php` |

---

## 📓 Log de Execução

*Atualizações serão adicionadas aqui conforme cada tarefa for concluída.*
