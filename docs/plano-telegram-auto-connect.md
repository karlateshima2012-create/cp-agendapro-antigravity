# Plano — Conexão Automática do Telegram (sem copiar Chat ID)
## CP Agenda Pro — Aba Configurações
**Status:** Aguardando aprovação
**Estimativa:** 1 dia útil

---

> **NENHUM CÓDIGO ALTERADO.**
> Este documento é apenas o plano.

---

## Problema Atual

A profissional precisa descobrir o próprio Chat ID no Telegram (usando bots auxiliares como
`@userinfobot`), copiar o número e colar manualmente no painel. Isso é uma fricção
desnecessária que reduz a taxa de configuração do Telegram.

---

## Solução Proposta — Deep Link com Token Único

O painel gera um token temporário de uso único. O botão abre diretamente o bot do Telegram
com esse token na URL. Quando a profissional clica em **Iniciar** no Telegram, o webhook
captura o `chat_id` automaticamente e vincula à conta. Nenhuma cópia manual.

### Fluxo completo

```
Painel gera token único
        │
        ▼
Profissional clica "Conectar Telegram"
        │
        ▼
Abre: t.me/NOME_DO_BOT?start=TOKEN
        │
        ▼
Telegram abre o bot e exibe botão [INICIAR]
        │
        ▼
Profissional clica INICIAR
        │
        ▼
Bot recebe: /start TOKEN
        │
        ▼
Webhook busca conta pelo token → salva chat_id → limpa o token
        │
        ▼
Painel atualiza: "Telegram Conectado ✓"
```

---

## Card de Notificações via Telegram — Estados Visuais

### Estado 1 — Não conectado

```
╔══════════════════════════════════════════════════╗
║  🔔  Notificações via Telegram                   ║
║                                                  ║
║  Receba uma mensagem no Telegram toda vez        ║
║  que um novo agendamento for realizado.          ║
║                                                  ║
║  ┌────────────────────────────────────────────┐  ║
║  │  📲  Conectar Telegram                     │  ║
║  └────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════╝
```

**Texto do botão:** `📲 Conectar Telegram`
**Ação:** gera/busca o token e abre `t.me/BOT?start=TOKEN` em nova aba

---

### Estado 2 — Aguardando (token gerado, ainda não clicou INICIAR no Telegram)

```
╔══════════════════════════════════════════════════╗
║  🔔  Notificações via Telegram                   ║
║                                                  ║
║  O Telegram foi aberto. Clique em INICIAR        ║
║  no bot para concluir a conexão.                 ║
║                                                  ║
║  ┌────────────────────────────────────────────┐  ║
║  │  ↗  Abrir Telegram novamente               │  ║
║  └────────────────────────────────────────────┘  ║
║  ○ ○ ○  Aguardando confirmação...               ║
╚══════════════════════════════════════════════════╝
```

**Texto auxiliar:** "Aguardando confirmação..." com três pontos animados
**Botão secundário:** `↗ Abrir Telegram novamente` — reabre o mesmo deep link
**Polling:** frontend verifica a cada 3 segundos se o `chat_id` já foi salvo (por 2 minutos)

---

### Estado 3 — Conectado com sucesso

```
╔══════════════════════════════════════════════════╗
║  🔔  Notificações via Telegram     ✅ Conectado  ║
║                                                  ║
║  Você receberá uma mensagem aqui a cada          ║
║  novo agendamento confirmado.                    ║
║                                                  ║
║  ┌────────────────────────────────────────────┐  ║
║  │  🔕  Desconectar Telegram                  │  ║
║  └────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════╝
```

**Badge:** `✅ Conectado` — verde, canto superior direito do card
**Botão:** `🔕 Desconectar Telegram` — discreto, estilo secundário (cinza/borda)
**Ação desconectar:** apaga o `chat_id` do banco (confirmar antes com diálogo)

---

## Mensagem Recebida no Telegram após clicar INICIAR

```
✅ *CP Agenda Pro*

Telegram conectado com sucesso\!

A partir de agora você receberá uma mensagem aqui
toda vez que um novo agendamento for realizado\.

_Você pode desconectar a qualquer momento nas
Configurações do seu painel\._
```

> Formato Markdown V2 do Telegram.
> Enviada imediatamente pelo webhook no momento em que a conta é vinculada.

---

## Arquivos a Modificar

| Arquivo | O que muda |
|---------|-----------|
| `backend/database/migrations/0016_add_telegram_link_token.sql` | Nova coluna `telegram_link_token VARCHAR(64) NULL` em `cp_agenda_accounts` |
| `backend/api/routes/me.php` | Novo endpoint `POST /me/telegram-token` — gera e retorna o token; `GET /me` já expõe `chat_id` (ou ausência dele) |
| `backend/api/routes/telegram_webhook.php` | Detectar `/start TOKEN` → buscar conta → salvar `chat_id` → limpar token → enviar mensagem de boas-vindas |
| `components/AccountTab.tsx` | Substituir campo de input manual pelo novo card com 3 estados |
| `src/api.ts` | Nova função `generateTelegramToken()` e `checkTelegramStatus()` |

---

## Banco de Dados

### Migration 0016
```sql
ALTER TABLE cp_agenda_accounts
  ADD COLUMN telegram_link_token VARCHAR(64) NULL DEFAULT NULL;
```

O token é armazenado temporariamente. Assim que a profissional clica INICIAR no Telegram,
o webhook salva o `chat_id` e faz `telegram_link_token = NULL`.

Token expiração: **10 minutos** (verificado no webhook — se expirado, retorna mensagem de erro no Telegram e ignora).

---

## Lógica do Webhook (`telegram_webhook.php`)

Ao receber uma mensagem `/start TOKEN`:

1. Verificar se a mensagem começa com `/start `
2. Extrair o TOKEN do texto
3. Buscar `cp_agenda_accounts` onde `telegram_link_token = TOKEN`
4. Se não encontrado → ignorar silenciosamente (token inválido ou já usado)
5. Se encontrado:
   - Salvar `chat_id = $update['message']['from']['id']`
   - Zerar `telegram_link_token = NULL`
   - Enviar mensagem de boas-vindas (texto acima)
6. Se `/start` sem token (acesso direto ao bot) → enviar mensagem orientando a usar o painel

Mensagem para `/start` sem token:
```
ℹ️ *CP Agenda Pro*

Para conectar seu Telegram, acesse seu painel
e clique em *Conectar Telegram* nas Configurações\.
```

---

## Polling no Frontend

Após o clique em "Conectar Telegram", o frontend entra no Estado 2 e inicia um polling:

- A cada **3 segundos**, chama `GET /me` e verifica se `telegramChatId` foi preenchido
- Se preenchido → transiciona para Estado 3 (animação de sucesso)
- Após **2 minutos** sem confirmação → exibe mensagem "O tempo expirou. Tente novamente."
- O polling usa `setInterval` limpo com `clearInterval` no `useEffect` cleanup

---

## Pontos de Decisão para Aprovação

1. **Nome do bot:** o deep link usa `t.me/NOME_DO_BOT` — confirmar o username exato do bot de produção
2. **Expiração do token:** 10 minutos é suficiente ou prefere mais tempo (ex: 30 minutos)?
3. **Desconectar:** ao desconectar, pedir confirmação com diálogo ou desconectar direto?

---

> **Aguardando aprovação e respostas dos pontos de decisão.**
> Nenhum arquivo será alterado até a aprovação formal.

*Plano elaborado em 12 de junho de 2026.*
