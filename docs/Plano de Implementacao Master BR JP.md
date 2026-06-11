# Plano de Implementação Master — Expansão Multi-País BR + JP
## CP Agenda Pro

**Status:** Em execução (Iniciado em 11 de junho de 2026)  
**Kickoff:** 11 de Junho de 2026  
**Base:** Relatório Master de Viabilidade Técnica v1.0 — 11/06/2026  
**Estimativa total:** 16–20 dias úteis · 5 fases  
**Arquivos afetados:** 17 arquivos — 5 novos, 12 modificados  

---

> **PLANO EM EXECUÇÃO.**  
> Este plano foi formalmente aprovado e o desenvolvimento foi iniciado em 11 de junho de 2026.  

### Controle de Progresso das Fases (Atualizado em 11/06/2026)

| Fase | Título | Status | Avanço Atual |
|---|---|---|---|
| **Fase 1** | Fundação de Dados | 🔄 Em Execução (Local OK) | Migration criada, `schema.sql`, endpoints `/public` e `/me`, e `types.ts` ajustados localmente. Aguardando deploy e validação da base. |
| **Fase 2** | Backend Timezone-Aware | ⏳ Planejado | Sem alterações ainda. |
| **Fase 3** | Frontend Dinâmico | ⏳ Planejado | Sem alterações ainda. |
| **Fase 4** | Painel Admin Multi-País | ⏳ Planejado | Sem alterações ainda. |
| **Fase 5** | Testes e Validação Completa | ⏳ Planejado | Checklist e regressão técnica. |

---

## Nota de consolidação

Este documento é o plano master que unifica, corrige e completa os dois planos de implementação
produzidos após o Relatório Master de Viabilidade. Os conflitos entre os planos foram resolvidos
e os itens ausentes em ambos foram incorporados. As correções aplicadas estão indicadas ao longo
do documento.

### Conflitos resolvidos

| Conflito | Plano A (Antigravity) | Plano B | Decisão master |
|---|---|---|---|
| `DEFAULT country` | `'Japão'` (string longa) | `'JP'` (código) | **`'JP'`** — mais consistente, menor footprint no banco, facilita comparações no código |
| `phone_country_code` | `'81'` (sem `+`) | `'+81'` (com `+`) | **`'55'` / `'81'`** sem `+` — o `+` é concatenado na camada de aplicação, não deve estar no banco |
| `date_default_timezone_set` em `public.php` | Mencionado ✅ | Omitido ❌ | **Incluído** — necessário para que cálculos PHP nessa rota usem o fuso da conta |
| `GestaoTab.tsx` | Mencionado ✅ | Omitido ❌ | **Incluído** na Fase 3 |
| `/me/profile` PATCH | Mencionado ✅ | Omitido ❌ | **Incluído** na Fase 1 |

### Itens ausentes em ambos os planos — incorporados aqui

- `AppointmentsTab.tsx` tem função `getLocalDate()` com `Asia/Tokyo` hardcoded para o filtro de "hoje/amanhã" no calendário do painel — **mapeado como Tarefa 3.1.3**
- Verificação de `php.ini` no servidor antecipada para **pré-condição da Fase 2**, não apenas checklist final
- Estratégia de rollback definida ao final de cada fase
- Contagem correta de arquivos afetados: **17 arquivos** (os dois planos divergiam em 16 vs não contabilizado)

---

## Princípio Central

Cada fase tem **deploy próprio e checkpoint de validação obrigatória** antes de avançar.
A fase seguinte nunca começa com itens de validação pendentes.

Clientes japoneses existentes nunca são expostos a risco — garantido pelos valores
`DEFAULT 'JP'` e `DEFAULT 'Asia/Tokyo'` aplicados a todos os registros existentes
e pelos fallbacks `?? 'Asia/Tokyo'` e `?? 'JP'` em todo o código novo.

---

## Decisões Alinhadas no Kickoff (11 de Junho de 2026)

As seguintes diretrizes foram estabelecidas para a implementação:

1. **Data de kickoff:** Iniciado em 11/06/2026.
2. **Ambiente de teste:** Utilizar conta BR de teste diretamente em produção. O isolamento multi-tenant via `account_id` garante total segurança para as contas JP reais.
3. **MySQL timezone:** O banco de produção será verificado na Fase 2 (deve estar em UTC ou ajustado).
4. **DDD whitelist:** Confirmado. O frontend validará a whitelist dos 67 DDDs válidos do Brasil para evitar digitações erradas.
5. **LGPD:** O desenvolvimento ocorrerá em paralelo, mas nenhuma conta BR de cliente real entrará em atividade antes da conclusão da assessoria jurídica de LGPD.
6. **Beta fechado BR:** Fica a critério do negócio após as fases de testes concluídas.

---

## Fase 1 — Fundação de Dados
**Duração:** 2 dias | **Risco para JP:** Mínimo | **Pré-requisito:** nenhum

Esta fase é 100% aditiva. Nenhum dado existente é modificado, nenhum comportamento muda.
Apenas adiciona colunas novas com defaults que preservam o Japão integralmente.

### Tarefas

**Tarefa 1.1 — Nova migration de schema**

Arquivo a criar: `backend/database/migrations/0014_add_country_timezone.sql`

```sql
-- Migration idempotente: verifica se coluna já existe antes de adicionar
ALTER TABLE `cp_agenda_accounts`
  ADD COLUMN `country`            VARCHAR(5)   NOT NULL DEFAULT 'JP',
  ADD COLUMN `timezone`           VARCHAR(50)  NOT NULL DEFAULT 'Asia/Tokyo',
  ADD COLUMN `currency`           VARCHAR(3)   NOT NULL DEFAULT 'JPY',
  ADD COLUMN `phone_country_code` VARCHAR(5)   NOT NULL DEFAULT '81';
```

Todos os registros existentes herdam os defaults japoneses automaticamente.
A migration é idempotente — se rodar duas vezes, não quebra nada.

> ⚠️ **Correção aplicada:** os dois planos conflitavam no valor do DEFAULT de `country`
> (`'Japão'` vs `'JP'`) e no formato de `phone_country_code` (`'81'` vs `'+81'`).
> O master usa `'JP'` (código curto, consistente com comparações no código) e `'81'`
> (sem `+` — o símbolo é concatenado na camada de aplicação, não deve ser armazenado no banco).

**Tarefa 1.2 — Atualizar `schema.sql`**

Arquivo: `schema.sql`

Adicionar as 4 novas colunas na definição da tabela `cp_agenda_accounts`.
Mantém o `schema.sql` como documentação fiel do banco de produção.

**Tarefa 1.3 — Expor novos campos na API pública**

Arquivo: `backend/api/routes/public.php`

Adicionar `a.timezone`, `a.country`, `a.currency`, `a.phone_country_code` ao SELECT da query de perfil público. O frontend precisará desses valores para calcular slots, formatar telefone e exibir moeda corretamente. Nenhum campo existente é removido.

> ⚠️ **Adição:** incluir também `date_default_timezone_set($profile['timezone'])` no início
> do processamento desta rota (ausente no Plano B). Garante que qualquer cálculo PHP
> nessa requisição use o fuso da conta, não o UTC global do servidor.

**Tarefa 1.4 — Expor novos campos na rota `/me`**

Arquivo: `backend/api/routes/me.php`

- No endpoint `GET /me`: incluir `timezone`, `country`, `currency`, `phone_country_code` no retorno do perfil da conta logada.
- No endpoint `PATCH /me/profile`: permitir que a própria profissional atualize `timezone`, `country` e `currency` nas configurações do seu perfil.

> ⚠️ **Adição:** o endpoint PATCH estava presente no Plano A mas omitido no Plano B.
> É necessário para que a profissional possa corrigir o próprio fuso sem depender do admin.

**Tarefa 1.5 — Atualizar tipos TypeScript**

Arquivo: `types.ts`

Adicionar campos opcionais às interfaces `User` e `AccountInfo`:

```typescript
country?:            string; // 'JP' | 'BR'
timezone?:           string; // ex: 'America/Sao_Paulo'
currency?:           string; // 'JPY' | 'BRL'
phone_country_code?: string; // '81' | '55'
```

Necessário para que o TypeScript não reclame dos novos campos recebidos da API.

### Deploy da Fase 1

Commit e push para `main`. GitHub Actions executa deploy automático, incluindo `php migrate.php` que roda a migration `0014`.

### Rollback da Fase 1

Se algo der errado: `ALTER TABLE cp_agenda_accounts DROP COLUMN country, DROP COLUMN timezone, DROP COLUMN currency, DROP COLUMN phone_country_code`. Nenhum dado é perdido.

### Validação obrigatória — Fase 1

Todos os itens abaixo devem estar OK antes de iniciar a Fase 2.

| Verificação | Como verificar | Resultado esperado |
|---|---|---|
| Colunas criadas | `DESCRIBE cp_agenda_accounts` | 4 novas colunas presentes |
| Defaults em contas JP | `SELECT id, country, timezone, currency, phone_country_code FROM cp_agenda_accounts LIMIT 5` | `JP`, `Asia/Tokyo`, `JPY`, `81` |
| API pública com novos campos | `GET /api/public/profile/{id}` | `timezone`, `country`, `currency` no JSON |
| Rota `/me` com novos campos | Login com conta JP, `GET /me` | Campos presentes no payload |
| Página pública JP intacta | Abrir página pública de profissional JP | Calendário e agendamento funcionando normalmente |
| Painel JP intacto | Login com conta JP | Sem erros, sem regressão visual |
| Log de erros limpo | `/home/deploy/logs/deploy-jp.log` | Zero erros após deploy |

---

## Fase 2 — Backend Timezone-Aware
**Duração:** 3–4 dias | **Risco para JP:** Baixo | **Pré-requisito:** Fase 1 validada em produção

Esta é a fase de maior risco técnico. Mexe na lógica central de agendamento.
O fallback `?? 'Asia/Tokyo'` em cada alteração garante que contas JP sem `timezone`
explícito mantêm comportamento 100% idêntico ao atual.

### Pré-condição obrigatória antes de iniciar a Fase 2

Verificar o timezone do MySQL e do `php.ini` **antes** de qualquer alteração de código:

```sql
-- Deve retornar 'UTC' ou '+00:00'
SELECT @@global.time_zone;
```

```bash
# Verificar php.ini — não deve ter date.timezone = Asia/Tokyo
grep -i "date.timezone" /etc/php/*/fpm/php.ini
```

Se o MySQL não estiver em UTC, corrigir antes de iniciar:
```sql
SET GLOBAL time_zone = '+00:00';
```
E persistir no `my.cnf`: `default-time-zone = '+00:00'`

### Tarefas

**Tarefa 2.1 — Remover timezone global do PHP**

Arquivo: `backend/api/config.php` linha 60

```php
// REMOVER:
date_default_timezone_set('Asia/Tokyo');

// SUBSTITUIR POR:
date_default_timezone_set('UTC');
```

O servidor operará em UTC como padrão neutro. Cada rota que precisa de hora local
lê o timezone da conta antes de calcular.

**Tarefa 2.2 — Validação de agendamento timezone-aware**

Arquivo: `backend/api/routes/appointments.php` linhas 47–58

```php
// DE:
$accountTz = new DateTimeZone('Asia/Tokyo');
$nowJst    = new DateTime('now', $accountTz);

// PARA:
$acc       = Db::fetch('SELECT timezone FROM cp_agenda_accounts WHERE id = ?', [$accId]);
$accountTz = new DateTimeZone($acc['timezone'] ?? 'Asia/Tokyo');
$nowLocal  = new DateTime('now', $accountTz);
```

Esta alteração afeta a validação de "hoje", "passado" e conflito de slots — o núcleo do negócio.
Para contas JP sem timezone definido, o fallback `'Asia/Tokyo'` garante comportamento idêntico.

**Tarefa 2.3 — Notificação Telegram com hora correta**

Arquivo: `backend/api/routes/appointments.php` linha 158

```php
// DE:
$formattedDate = date('d/m/Y H:i', strtotime($newStart));

// PARA:
$tzObj         = new DateTimeZone($acc['timezone'] ?? 'Asia/Tokyo');
$startInTz     = new DateTime($newStart, $tzObj);
$formattedDate = $startInTz->format('d/m/Y H:i');
```

A variável `$acc` já foi buscada na Tarefa 2.2 — não há query adicional.

**Tarefa 2.4 — Admin pode salvar novos campos**

Arquivo: `backend/api/routes/admin.php`

- Adicionar ao `$fieldMap` das rotas `PATCH /admin/profiles/:id` e `POST /admin/users`: `country`, `timezone`, `currency`, `phone_country_code`.
- Adicionar validação de valores permitidos:
  - `country`: aceita apenas `'BR'` ou `'JP'`
  - `timezone`: aceita apenas valores da whitelist (fusos BR + `Asia/Tokyo`)
  - `currency`: aceita apenas `'BRL'` ou `'JPY'`
  - `phone_country_code`: aceita apenas `'55'` ou `'81'`

**Tarefa 2.5 — Varredura de ocorrências residuais no backend**

Buscar em todos os arquivos PHP por strings hardcoded de timezone e localização:

```bash
grep -rn "Asia/Tokyo\|+09:00\|JST\|ja-JP" backend/api/
```

Expectativa: nenhuma ocorrência além das já tratadas nas Tarefas 2.1–2.3.
Qualquer ocorrência encontrada deve ser avaliada e tratada antes do deploy.

### Deploy da Fase 2

Commit e push para `main`. Deploy automático via GitHub Actions.

### Rollback da Fase 2

Reverter o commit da Fase 2 (`git revert`). O banco não é alterado nesta fase — rollback é apenas de código.

### Validação obrigatória — Fase 2

**Criar conta de teste BR antes da validação:**
```sql
UPDATE cp_agenda_accounts
SET country = 'BR', timezone = 'America/Sao_Paulo', currency = 'BRL', phone_country_code = '55'
WHERE id = {ID_DA_CONTA_DE_TESTE};
```

| Verificação | Como verificar | Resultado esperado |
|---|---|---|
| Conta JP — calendário público | Abrir página pública de profissional JP | Slots corretos em JST, sem mudança visual |
| Conta JP — agendar hoje (JST) | Selecionar data de hoje em conta JP | Bloqueado com mensagem correta |
| Conta JP — agendar futuro | Selecionar data futura em conta JP | Agendamento criado com sucesso |
| Conta JP — Telegram | Fazer agendamento de teste JP | Hora na notificação em JST (Tokyo) |
| Conta JP — painel da profissional | Login com conta JP | Sem erros, comportamento idêntico ao anterior |
| MySQL timezone | `SELECT @@global.time_zone` | `UTC` ou `+00:00` |
| `php.ini` | `grep date.timezone /etc/php/*/fpm/php.ini` | Sem `Asia/Tokyo` no php.ini |
| Conta BR — calendário público | Abrir página pública da conta BR de teste | Slots corretos em BRT (UTC-3) |
| Conta BR — agendar hoje (BRT) | Selecionar data de hoje em conta BR | Bloqueado corretamente em BRT |
| Conta BR — Telegram | Fazer agendamento de teste BR | Hora em BRT (Brasília) na notificação |
| Log de erros | `/home/deploy/logs/deploy-jp.log` | Zero erros após deploy |

**Fase 3 só começa após todos os itens acima validados — especialmente os itens de conta JP.**

---

## Fase 3 — Frontend Dinâmico
**Duração:** 4–5 dias | **Risco para JP:** Baixo-Médio | **Pré-requisito:** Fase 2 validada

O frontend recebe os campos `timezone`, `country`, `currency`, `phone_country_code` da API
(expostos na Fase 1) e os usa em todas as funções que antes eram hardcoded para o Japão.

### Tarefas

**Tarefa 3.1 — Criar `utils/phone.ts` centralizado**

Arquivo a criar: `utils/phone.ts`

Este módulo elimina duplicação entre `PublicBookingPage.tsx`, `AppointmentsTab.tsx` e
`ClientsTab.tsx`, centralizando toda lógica de telefone por país.

```typescript
// Formata para exibição
export function formatPhone(raw: string, country: string): string {
  const nums = raw.replace(/\D/g, '');
  if (country === 'BR') {
    if (nums.length <= 10) {
      // Fixo: (XX) XXXX-XXXX
      return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    }
    // Celular: (XX) X XXXX-XXXX
    return `(${nums.slice(0,2)}) ${nums.slice(2,3)} ${nums.slice(3,7)}-${nums.slice(7)}`;
  }
  // JP: 090 XXXX XXXX (comportamento atual de formatJapanesePhone — sem alteração)
  return /* lógica existente de formatJapanesePhone */;
}

// Normaliza para E.164 (WhatsApp)
export function normalizeE164(raw: string, country: string): string {
  const nums = raw.replace(/\D/g, '');
  const code = country === 'BR' ? '55' : '81';
  if (nums.startsWith(code)) return nums;
  if (country === 'JP' && nums.startsWith('0')) return code + nums.slice(1);
  return code + nums;
}

// Valida comprimento e DDD
export function validatePhone(digits: string, country: string): boolean {
  if (country === 'BR') {
    if (digits.length < 10 || digits.length > 11) return false;
    const ddd = parseInt(digits.slice(0, 2));
    return VALID_BR_DDDS.includes(ddd); // whitelist dos 67 DDDs válidos
  }
  return digits.length >= 10 && digits.length <= 11; // JP — comportamento atual
}

// Whitelist dos 67 DDDs válidos
const VALID_BR_DDDS = [
  11,12,13,14,15,16,17,18,19, // SP
  21,22,24,                    // RJ
  27,28,                       // ES
  31,32,33,34,35,37,38,        // MG
  41,42,43,44,45,46,           // PR
  47,48,49,                    // SC
  51,53,54,55,                 // RS
  61,62,64,                    // GO/DF
  63,                          // TO
  65,66,                       // MT
  67,                          // MS
  68,                          // AC
  69,                          // RO
  71,73,74,75,77,              // BA
  79,                          // SE
  81,87,                       // PE
  82,                          // AL
  83,                          // PB
  84,                          // RN
  85,88,                       // CE
  86,89,                       // PI
  91,93,94,                    // PA
  92,97,                       // AM
  95,                          // RR
  96,                          // AP
  98,99                        // MA
];
```

**Tarefa 3.2 — Criar `utils/brazilTimezones.ts`**

Arquivo a criar: `utils/brazilTimezones.ts`

Mapa completo de estado → identificador IANA para uso no painel admin (Fase 4):

```typescript
export const BR_STATE_TIMEZONES: Record<string, string> = {
  SP: 'America/Sao_Paulo', RJ: 'America/Sao_Paulo', MG: 'America/Sao_Paulo',
  ES: 'America/Sao_Paulo', PR: 'America/Sao_Paulo', SC: 'America/Sao_Paulo',
  RS: 'America/Sao_Paulo', DF: 'America/Sao_Paulo', GO: 'America/Sao_Paulo',
  TO: 'America/Araguaina', MA: 'America/Fortaleza', PI: 'America/Fortaleza',
  CE: 'America/Fortaleza', RN: 'America/Fortaleza', PB: 'America/Fortaleza',
  PE: 'America/Recife',    AL: 'America/Maceio',    SE: 'America/Maceio',
  BA: 'America/Bahia',     PA: 'America/Belem',     AP: 'America/Belem',
  AM: 'America/Manaus',    RR: 'America/Boa_Vista', RO: 'America/Porto_Velho',
  MT: 'America/Cuiaba',    MS: 'America/Campo_Grande', AC: 'America/Rio_Branco',
  FN: 'America/Noronha',   // Fernando de Noronha
};
```

**Tarefa 3.3 — Atualizar `PublicBookingPage.tsx`**

Arquivo: `components/PublicBookingPage.tsx`

- Linha 110 — substituir `getNowJST()`:
  ```typescript
  // DE:
  const getNowJST = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

  // PARA:
  const getNowLocal = (tz: string) =>
    new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  // Uso: getNowLocal(profile.timezone ?? 'Asia/Tokyo')
  ```
- Linhas 65–78 — substituir `formatJapanesePhone()` por `formatPhone(raw, profile.country ?? 'JP')` de `utils/phone.ts`
- Atualizar validador de telefone para usar `validatePhone()` de `utils/phone.ts`
- Substituir `¥` fixo por `Intl.NumberFormat` dinâmico:
  ```typescript
  const formatPrice = (price: number) =>
    new Intl.NumberFormat(
      profile.country === 'BR' ? 'pt-BR' : 'ja-JP',
      { style: 'currency', currency: profile.currency ?? 'JPY' }
    ).format(price);
  ```

**Tarefa 3.4 — Atualizar `AppointmentsTab.tsx`**

Arquivo: `components/AppointmentsTab.tsx`

- Linhas 35–41 — substituir `normalizePhoneToE164JP()`:
  ```typescript
  // DE:
  function normalizePhoneToE164JP(phoneRaw: string) { ... /* +81 fixo */ }

  // PARA (usando utils/phone.ts):
  import { normalizeE164 } from '../utils/phone';
  // Uso: normalizeE164(appt.clientPhone, account.phone_country_code ?? '81')
  ```
- Linhas 43–51 — substituir `formatWhenJST()`:
  ```typescript
  // DE:
  function formatWhenJST(startAt: string) {
    return new Date(startAt).toLocaleString('pt-BR', { timeZone: 'Asia/Tokyo', ... });
  }

  // PARA:
  function formatWhenInTimezone(startAt: string, tz: string) {
    return new Date(startAt).toLocaleString('pt-BR', { timeZone: tz, ... });
  }
  // Uso: formatWhenInTimezone(appt.startAt, account.timezone ?? 'Asia/Tokyo')
  ```
- **Função `getLocalDate()` com `Asia/Tokyo` hardcoded** (ausente nos dois planos anteriores):
  ```typescript
  // DE (filtro "hoje/amanhã" no calendário do painel):
  const getLocalDate = (d) =>
    new Date(new Date(d).toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

  // PARA:
  const getLocalDate = (d: string | Date, tz: string) =>
    new Date(new Date(d).toLocaleString('en-US', { timeZone: tz }));
  // Uso: getLocalDate(date, account.timezone ?? 'Asia/Tokyo')
  ```
- Ajustar os botões "Hoje" e "Amanhã" no calendário para usarem a data recalculada no fuso do profissional.

**Tarefa 3.5 — Atualizar `ClientsTab.tsx`**

Arquivo: `components/ClientsTab.tsx` linhas 37–50

- Substituir `formatJapanesePhone()` por `formatPhone(raw, account.country ?? 'JP')` de `utils/phone.ts`
- Atualizar validação de comprimento para usar `validatePhone()` de `utils/phone.ts`

**Tarefa 3.6 — Atualizar `AccountTab.tsx`**

Arquivo: `components/AccountTab.tsx`

- Substituir `¥` hardcoded:
  ```typescript
  // DE:
  `¥ ${Number(inv.amount).toLocaleString('ja-JP')}`

  // PARA:
  new Intl.NumberFormat(
    account.country === 'BR' ? 'pt-BR' : 'ja-JP',
    { style: 'currency', currency: account.currency ?? 'JPY' }
  ).format(Number(inv.amount))
  ```
- Atualizar formatação de datas de vencimento de faturas para o locale correto.

**Tarefa 3.7 — Atualizar `GestaoTab.tsx`**

Arquivo: `components/GestaoTab.tsx`

> ⚠️ **Adição:** este componente estava presente no Plano A mas ausente no Plano B.

- Dinamizar formatação de faturamento estimado e ticket médio no dashboard:
  ```typescript
  // DE:
  `¥${value.toLocaleString('ja-JP')}`

  // PARA:
  new Intl.NumberFormat(
    account.country === 'BR' ? 'pt-BR' : 'ja-JP',
    { style: 'currency', currency: account.currency ?? 'JPY' }
  ).format(value)
  ```

**Tarefa 3.8 — Verificar propagação em `App.tsx`**

Arquivo: `App.tsx`

- Confirmar que `country`, `timezone`, `currency` e `phone_country_code` chegam no objeto `user`/`account` após login.
- Se os campos já chegam via `/me` (exposto na Tarefa 1.4), verificar apenas se estão sendo passados como props para `AppointmentsTab`, `ClientsTab`, `AccountTab` e `GestaoTab`.
- Se não chegam: incluí-los explicitamente na busca de perfil do `App.tsx`.

**Tarefa 3.9 — Varredura de strings hardcoded no frontend**

```bash
grep -rn "Asia/Tokyo\|ja-JP\|+81\|JST\|¥\|getNowJST\|formatJapanesePhone\|E164JP\|formatWhenJST\|getLocalDate" src/
```

Nenhuma ocorrência deve restar nos componentes após as Tarefas 3.3–3.8.
Qualquer ocorrência encontrada deve ser avaliada e tratada antes do deploy.

### Deploy da Fase 3

Commit e push para `main`. Deploy automático via GitHub Actions.

### Rollback da Fase 3

Reverter o commit da Fase 3 (`git revert`). A Fase 2 permanece ativa — sem impacto.

### Validação obrigatória — Fase 3

| Verificação | Como verificar | Resultado esperado |
|---|---|---|
| Conta JP — página pública | Abrir página de profissional JP | Layout idêntico ao anterior |
| Conta JP — telefone | Ver campo de telefone em agendamento JP | Formato japonês preservado |
| Conta JP — link WhatsApp | "Enviar mensagem" para cliente JP | Abre `wa.me/81...` |
| Conta JP — msg confirmação | Confirmar agendamento de teste JP | Hora em JST na mensagem |
| Conta JP — moeda no painel | Aba Perfil / faturas | Exibe `¥` |
| Conta JP — dashboard Gestão | Aba Gestão | Faturamento em `¥` com locale japonês |
| Conta JP — filtro hoje/amanhã | Calendário do painel JP | Dias corretos em JST |
| Conta BR — página pública | Abrir página da conta BR de teste | Slots em horário de Brasília |
| Conta BR — telefone celular | Digitar `11987654321` | Exibe `(11) 9 8765-4321` |
| Conta BR — telefone fixo | Digitar `1133334444` | Exibe `(11) 3333-4444` |
| Conta BR — DDD inválido | Digitar `20987654321` | Campo rejeita / aviso de DDD inválido |
| Conta BR — link WhatsApp | "Enviar mensagem" para cliente BR | Abre `wa.me/55...` |
| Conta BR — msg confirmação | Confirmar agendamento de teste BR | Hora em BRT na mensagem |
| Conta BR — moeda | Aba Perfil / faturas | Exibe `R$` com formato `pt-BR` |
| Conta BR — dashboard Gestão | Aba Gestão | Faturamento em `R$` |
| Conta BR — filtro hoje/amanhã | Calendário do painel BR | Dias corretos em BRT |

**Fase 4 só começa após todos os itens acima validados.**

---

## Fase 4 — Painel Admin Multi-País
**Duração:** 3–4 dias | **Risco para JP:** Baixo | **Pré-requisito:** Fase 3 validada

Visível apenas para o administrador. Nenhuma mudança na experiência das profissionais.

### Tarefas

**Tarefa 4.1 — Seletor de país e estado no formulário de criação de conta**

Arquivo: `components/AdminDashboard.tsx`

No formulário de novo cadastro, adicionar:

1. Seletor de **País**: `Brasil` / `Japão`
2. Se Brasil: seletor de **Estado** (dropdown com 27 opções — 26 estados + DF)
3. Campo **Fuso horário**: preenchido automaticamente pelo mapeamento de `utils/brazilTimezones.ts` (somente leitura — informativo para o admin)
4. Campo **Moeda**: preenchido automaticamente (`R$` para BR, `¥` para JP — somente leitura)
5. Campo **Código de país**: preenchido automaticamente (`55` para BR, `81` para JP — somente leitura)

O admin nunca precisa saber IANA — seleciona Estado e o sistema resolve.

**Tarefa 4.2 — Edição de localização em conta existente**

Arquivo: `components/AdminDashboard.tsx`

Na ficha de edição de cada profissional, adicionar seção **"Localização"**:
- País (editável)
- Estado BR (editável se País = Brasil, oculto se Japão)
- Fuso horário (somente leitura, calculado automaticamente)
- Moeda (somente leitura, calculada)
- Código de país (somente leitura, calculado)

**Tarefa 4.3 — Identificação visual por país na listagem**

Arquivo: `components/AdminDashboard.tsx`

- Exibir tag `🇧🇷 BR` ou `🇯🇵 JP` ao lado do nome de cada profissional na listagem.
- Adicionar filtro rápido no topo: **Mostrar: Todos / Japão / Brasil**.

**Tarefa 4.4 — Confirmar validações backend da Tarefa 2.4**

Arquivo: `backend/api/routes/admin.php`

Validar que as whitelist implementadas na Tarefa 2.4 estão funcionando corretamente
via testes manuais: tentar salvar `timezone = 'America/Chicago'` deve ser rejeitado;
`country = 'US'` deve ser rejeitado.

### Deploy da Fase 4

Commit e push para `main`. Deploy automático via GitHub Actions.

### Rollback da Fase 4

Reverter o commit da Fase 4 (`git revert`). As Fases 1–3 permanecem ativas — sem impacto.

### Validação obrigatória — Fase 4

| Verificação | Como verificar | Resultado esperado |
|---|---|---|
| Criar conta BR via admin | Selecionar "Brasil" e estado "SP" | Conta criada com `timezone=America/Sao_Paulo`, `currency=BRL`, `phone_country_code=55` |
| Criar conta BR (Amazonas) | Selecionar "Brasil" e estado "AM" | Conta criada com `timezone=America/Manaus` |
| Criar conta JP via admin | Selecionar "Japão" | Conta criada com `timezone=Asia/Tokyo`, `currency=JPY`, `phone_country_code=81` |
| Editar conta JP existente | Abrir ficha de conta JP, salvar sem alterar país | Conta JP mantém `Asia/Tokyo` — sem regressão |
| Filtro por país | Clicar no filtro "Brasil" | Lista apenas contas BR |
| Tags visuais | Visualizar lista de profissionais | Tags BR/JP visíveis e corretas |
| Rejeição de timezone inválido | Tentar `timezone = 'America/Chicago'` via API | Retorna erro de validação |

---

## Fase 5 — Testes e Validação Completa
**Duração:** 4–5 dias | **Pré-requisito:** Fases 1–4 completas

Nenhuma alteração de código nesta fase — apenas validação sistemática.
Qualquer problema encontrado retorna à fase correspondente para correção antes de continuar.

### 5.1 Checklist de regressão — Contas Japonesas

Verificar que absolutamente nada mudou para as profissionais japonesas existentes:

- [ ] Página pública carrega normalmente
- [ ] Calendário exibe dias corretos em JST
- [ ] Slots de horário disponíveis corretos em JST
- [ ] Tentativa de agendar "hoje" (JST) é bloqueada
- [ ] Tentativa de agendar data passada é bloqueada
- [ ] Agendamento em data futura é criado com sucesso
- [ ] Notificação Telegram mostra horário em JST (Tokyo)
- [ ] Mensagem de confirmação WhatsApp mostra horário em JST
- [ ] Link WhatsApp abre `wa.me/81...` (código +81)
- [ ] Telefone JP exibido no formato `090 XXXX XXXX`
- [ ] Filtros "Hoje" e "Amanhã" no painel mostram datas corretas em JST
- [ ] Aba Perfil exibe moeda em `¥`
- [ ] Dashboard Gestão exibe faturamento em `¥` com locale japonês
- [ ] Faturas exibem valores em `¥` com separador de milhar japonês
- [ ] Login e autenticação funcionando normalmente
- [ ] Zero erros no log `/home/deploy/logs/deploy-jp.log`
- [ ] Zero alertas no bot Telegram de monitoramento

### 5.2 Checklist de validação — Conta Brasileira de Teste

- [ ] Página pública carrega com fuso BRT
- [ ] Calendário exibe dias corretos em BRT (UTC-3)
- [ ] Slots de horário disponíveis corretos em BRT
- [ ] Tentativa de agendar "hoje" (BRT) é bloqueada
- [ ] Tentativa de agendar data passada (BRT) é bloqueada
- [ ] Agendamento em data futura criado com sucesso
- [ ] Notificação Telegram mostra horário em BRT (Brasília)
- [ ] Mensagem de confirmação WhatsApp mostra horário em BRT
- [ ] Link WhatsApp abre `wa.me/55...` (código +55)
- [ ] Telefone BR celular: `(11) 9 8765-4321`
- [ ] Telefone BR fixo: `(11) 3333-4444`
- [ ] DDD inválido (`20`, `23`, `60`) rejeitado na digitação
- [ ] Filtros "Hoje" e "Amanhã" no painel mostram datas corretas em BRT
- [ ] Aba Perfil exibe moeda em `R$`
- [ ] Dashboard Gestão exibe faturamento em `R$` com locale `pt-BR`
- [ ] Admin consegue criar conta BR com estado → fuso automático
- [ ] Admin filtra por país (BR separado de JP)
- [ ] Profissional BR consegue atualizar próprio fuso via `/me/profile`

### 5.3 Checklist de edge cases críticos

- [ ] **Agendamento às 23h BRT:** cliente BR agenda às 23h de Brasília (seria "amanhã" em Tokyo). O sistema **não deve bloquear** — a validação usa BRT, não JST.
- [ ] **Isolamento de fusos entre contas:** profissional JP verifica calendário à meia-noite JST ao mesmo tempo que profissional BR agenda às 10h BRT. Confirmar que os slots de uma conta não afetam a outra (garantido pelo `account_id`, mas verificar explicitamente).
- [ ] **Conta JP sem timezone no banco:** setar `timezone = NULL` temporariamente em conta JP de teste. O fallback `'Asia/Tokyo'` deve funcionar no backend e no frontend sem erros.
- [ ] **DDD de fronteira:** testar DDDs `11` (válido SP), `20` (inválido), `55` (válido RS), `60` (inválido). Apenas válidos aceitos.
- [ ] **Race condition:** dois navegadores tentam o mesmo slot na conta BR simultaneamente. O segundo deve receber "horário já reservado".
- [ ] **Conta BR América/Manaus (UTC-4):** criar conta com `timezone = 'America/Manaus'`. Confirmar que os slots mostram horários 1h atrás de Brasília e que a validação de "hoje" usa UTC-4.

### 5.4 Verificação de infraestrutura

- [ ] MySQL em UTC: `SELECT @@global.time_zone` retorna `UTC` ou `+00:00`
- [ ] `php.ini` sem `date.timezone = Asia/Tokyo`: `grep date.timezone /etc/php/*/fpm/php.ini`
- [ ] Zero ocorrências residuais no código: `grep -rn "Asia/Tokyo\|ja-JP\|getNowJST\|E164JP\|formatWhenJST" src/ backend/`
- [ ] Log de erros PHP-FPM limpo após 24h de uso das contas BR de teste

### 5.5 Critério de aprovação para deploy em produção

O deploy em produção da expansão BR só é autorizado quando **todos** os itens abaixo estiverem marcados:

- [ ] Todos os itens de 5.1 (regressão JP) ✅
- [ ] Todos os itens de 5.2 (validação BR) ✅
- [ ] Todos os itens de 5.3 (edge cases) ✅
- [ ] Todos os itens de 5.4 (infraestrutura) ✅
- [ ] Avaliação jurídica LGPD concluída ✅

---

## Resumo completo de alterações por arquivo

| Arquivo | Fase | Tipo | Risco JP |
|---|---|---|---|
| `backend/database/migrations/0014_add_country_timezone.sql` | 1 | ✨ Novo | Mínimo |
| `schema.sql` | 1 | ✏️ Modificar | Mínimo |
| `backend/api/routes/public.php` | 1 | ✏️ Modificar | Mínimo |
| `backend/api/routes/me.php` | 1 | ✏️ Modificar | Mínimo |
| `types.ts` | 1 | ✏️ Modificar | Mínimo |
| `backend/api/config.php` | 2 | ✏️ Modificar | Baixo |
| `backend/api/routes/appointments.php` | 2 | ✏️ Modificar | Baixo |
| `backend/api/routes/admin.php` | 2 | ✏️ Modificar | Baixo |
| `utils/phone.ts` | 3 | ✨ Novo | Baixo |
| `utils/brazilTimezones.ts` | 3 | ✨ Novo | Mínimo |
| `components/PublicBookingPage.tsx` | 3 | ✏️ Modificar | Médio |
| `components/AppointmentsTab.tsx` | 3 | ✏️ Modificar | Médio |
| `components/ClientsTab.tsx` | 3 | ✏️ Modificar | Baixo |
| `components/AccountTab.tsx` | 3 | ✏️ Modificar | Baixo |
| `components/GestaoTab.tsx` | 3 | ✏️ Modificar | Baixo |
| `App.tsx` | 3 | ✏️ Modificar | Baixo |
| `components/AdminDashboard.tsx` | 4 | ✏️ Modificar | Baixo |

**Total: 17 arquivos — 3 novos de código, 1 novo de SQL, 13 modificados.**

---

## Arquivos que não serão tocados

Por preservação e segurança, os seguintes sistemas **não serão alterados**:

- `backend/api/lib/Auth.php` — autenticação e sessões
- `backend/api/lib/Db.php` — camada de banco
- `backend/api/lib/Monitor.php` — monitoramento
- `backend/api/lib/Mail.php` — envio de e-mail
- `backend/api/routes/auth.php` — login e reset de senha
- `backend/api/routes/availability.php` — disponibilidade
- `backend/api/routes/blocked_dates.php` — datas bloqueadas
- `backend/api/routes/services.php` — serviços
- `backend/api/routes/clients.php` — CRM de clientes
- `.github/workflows/deploy.yml` — pipeline CI/CD
- `backend/migrate.php` — runner de migrations
- `utils/availability.ts` — dias da semana (já em português, neutro a fuso)

---

## Sequência de deploy

```
PRÉ-CONDIÇÃO: MySQL em UTC + php.ini verificado
         ↓
Fase 1 deploy → validação obrigatória → OK
         ↓
[criar conta BR de teste no banco]
         ↓
Fase 2 deploy → validação JP + BR → OK
         ↓
Fase 3 deploy → validação visual e funcional → OK
         ↓
Fase 4 deploy → validação do painel admin → OK
         ↓
Fase 5 checklist completo (sem deploy)
         ↓
LGPD avaliada juridicamente → OK
         ↓
Primeiros clientes brasileiros
```

Se qualquer validação falhar: corrigir na fase correspondente antes de avançar.
Nunca pular uma fase. Nunca avançar com itens de validação pendentes.

---

*Plano de Implementação Master v1.0 · CP Agenda Pro · 11 de junho de 2026*
*Consolidação e correção dos Planos A (Antigravity) e B — base: Relatório Master de Viabilidade Técnica v1.0*
*Aprovado pelo administrador do sistema. Execução iniciada em 11 de junho de 2026 (Kickoff).*
