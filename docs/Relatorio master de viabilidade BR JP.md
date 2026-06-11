# Relatório Master de Viabilidade Técnica
## CP Agenda Pro — Expansão Multinacional Brasil & Japão

> **Creative Print · Técnico / Confidencial**
> Versão Master 1.0 · 11 de junho de 2026
> Consolidação dos Pareceres Técnicos v1.0 (Antigravity AI) e v1.1

| Campo | Informação |
|---|---|
| Documento | Relatório Master de Viabilidade Técnica — CP Agenda Pro |
| Versão | Master 1.0 — Consolidação v1.0 + v1.1 |
| Data | 11 de junho de 2026 |
| Classificação | Técnico / Confidencial |
| Fontes | Parecer Técnico v1.0 (Antigravity AI) + Relatório de Viabilidade v1.1 |
| Destinatário | Administrador do Sistema — Creative Print |
| Esforço estimado | 16–20 dias · 5 fases |

---

## 1. Resumo Executivo e Veredito Técnico

> ✅ **VEREDITO: EXPANSÃO VIÁVEL — ESTRATÉGIA DE CODEBASE ÚNICO RECOMENDADA**

A expansão do CP Agenda Pro para o Brasil é **tecnicamente viável, segura e recomendada**. A arquitetura multi-tenant já adotada é a base correta. O sistema opera sob o modelo **Wall-Clock Time** — armazenando strings brutas de data/hora sem flags de timezone — tornando o banco de dados inerentemente timezone-agnostic. Este é o principal ativo arquitetural que viabiliza a expansão sem reescrita de dados históricos.

Foram mapeados **9 pontos críticos de acoplamento com o Japão** no código-fonte. Todos são cirurgias pontuais em arquivos bem identificados. O esforço estimado é de **16 a 20 dias** organizados em 5 fases. O impacto nos clientes japoneses existentes é **zero** — garantido por valores padrão no banco de dados.

Os dois relatórios técnicos analisados convergem na mesma conclusão estratégica, com diferenças complementares de profundidade: o Parecer v1.0 (Antigravity) foca na solução e implementação; o Relatório v1.1 é mais analítico no diagnóstico do problema. Este documento master unifica ambos em uma visão coesa, resolve eventuais divergências e eleva os pontos de atenção identificados em análise cruzada.

---

## 2. Diagnóstico: Os 9 Pontos Críticos de Acoplamento

O sistema assume implicitamente que **todas as contas operam no Japão**. Os valores hardcoded de fuso horário (`Asia/Tokyo`), moeda (`¥`) e código de país (`+81`) estão dispersos em 3 camadas — backend PHP, rotas de negócio e componentes React.

| # | Arquivo | Linha(s) | Problema | Criticidade | Impacto Prático no Brasil |
|---|---|---|---|---|---|
| 1 | `backend/api/config.php` | 60 | `date_default_timezone_set('Asia/Tokyo')` | 🔴 ALTA | Todo o PHP usa JST silenciosamente |
| 2 | `backend/api/routes/appointments.php` | 47–58 | `new DateTimeZone('Asia/Tokyo')` na validação | 🔴 ALTA | Horário de "hoje" calculado 12h errado para BR |
| 3 | `components/PublicBookingPage.tsx` | 110 | `getNowJST()` hardcoded | 🔴 ALTA | Datas e slots disponíveis errados para cliente BR |
| 4 | `components/PublicBookingPage.tsx` | 65–78 | `formatJapanesePhone()` — máscara japonesa | 🟠 MÉDIA | Telefone BR exibido com formatação errada |
| 5 | `components/ClientsTab.tsx` | 37–50 | `formatJapanesePhone()` duplicada | 🟠 MÉDIA | Mesmo problema do ponto 4 no cadastro de clientes |
| 6 | `components/AccountTab.tsx` | múltiplas | `¥` e `ja-JP` hardcoded na moeda | 🟠 MÉDIA | Valores exibidos em ¥ para profissional brasileiro |
| 7 | `backend/api/routes/appointments.php` | 158 | `date()` usa timezone global do PHP | 🟠 MÉDIA | Notificação Telegram mostra hora de Tokyo para BR |
| 8 | `components/AppointmentsTab.tsx` | 35–41 | `normalizePhoneToE164JP()` — código +81 fixo | 🔴 ALTA | Links WhatsApp de cliente BR abrem número JP inexistente |
| 9 | `components/AppointmentsTab.tsx` | 43–51 | `formatWhenJST()` — `Asia/Tokyo` fixo no WhatsApp | 🟠 MÉDIA | Mensagem WhatsApp confirma horário errado (JST) para cliente BR |

> ⚠️ **Pontos 8 e 9 merecem atenção especial:** os 4 pontos de criticidade ALTA afetam a lógica central de agendamento, podendo tornar o sistema completamente inutilizável para contas brasileiras. Os pontos 8 e 9 são imediatamente visíveis pelo usuário final — o profissional brasileiro enviaria WhatsApp com horário errado ou para número japonês inexistente.

---

## 3. Particularidades Brasileiras — Análise Técnica

O Brasil possui especificidades que não existem no Japão e exigem atenção técnica dedicada em três áreas principais.

### 3.1 Múltiplos Fusos Horários

Enquanto o Japão opera com um único fuso (`Asia/Tokyo` — UTC+9), o Brasil possui **4 fusos oficiais e 8 identificadores IANA distintos**. Para o caso de uso do CP Agenda Pro — agendamentos futuros — a regra prática é simples:

| Fuso | UTC | Identificador IANA | Estados / Regiões |
|---|---|---|---|
| Horário de Brasília | UTC-3 | `America/Sao_Paulo` | SP, RJ, MG, ES, PR, SC, RS, DF, GO, BA, SE, AL, PE, PB, RN, CE, PI, MA, TO, PA (leste), AP — **+90% da população** |
| Horário do Amazonas | UTC-4 | `America/Manaus` / `America/Cuiaba` / `America/Campo_Grande` | AM, RR, RO, MT, MS |
| Horário do Acre | UTC-5 | `America/Rio_Branco` | AC e extremo oeste do AM |
| Fernando de Noronha | UTC-2 | `America/Noronha` | PE (arquipélago apenas) — <0,01% da pop. |

**Regra prática para o painel admin:** Se o profissional mora em qualquer capital do Sul, Sudeste, Nordeste ou Centro-Oeste (exceto AM, RR, RO, MT, MS e AC), usar `America/Sao_Paulo`. Cobre mais de 90% dos casos. O profissional nunca precisa saber o que é UTC ou IANA — o formulário faz o mapeamento estado → identificador automaticamente.

**Comparativo de fusos Japão × Brasil:**

| Quando é em Brasília | É em Tokyo | Diferença |
|---|---|---|
| 08:00 (BRT, UTC-3) | 20:00 (JST, UTC+9) | +12 horas |
| 12:00 (BRT) | 00:00 do dia seguinte (JST) | +12 horas |
| 23:00 (BRT) | 11:00 do dia seguinte (JST) | +12 horas |

### 3.2 Horário de Verão (DST) — Status e Risco Futuro

- **Status atual:** O Brasil aboliu o horário de verão em abril de 2019 via Decreto Federal nº 9.772/2019. Não há alternância de horário em nenhum estado atualmente.
- **Risco futuro:** O Congresso debateu restauração em 2022 e 2023. Se ocorrer, qualquer sistema com offset UTC fixo (`-03:00`) quebrará imediatamente.
- **Proteção técnica:** Usar identificadores IANA (`America/Sao_Paulo`) garante adaptação automática via atualização de tzdata do SO — zero alteração de código. A arquitetura Wall-Clock Time do banco torna o sistema imune a bugs de DST nos agendamentos existentes.

> ⚠️ **Nunca usar offsets UTC fixos.** Sempre usar identificadores IANA completos. O PHP `DateTimeZone` e o JavaScript `Intl` consultam o banco de dados IANA da plataforma, atualizado via `apt upgrade` no servidor. Qualquer mudança de lei no Brasil vira uma atualização de sistema operacional, não uma mudança de código.

### 3.3 Telefones — DDD, 9º Dígito e E.164 para WhatsApp

| País | Tipo | Formato Display | Dígitos | E.164 (WhatsApp) |
|---|---|---|---|---|
| 🇯🇵 Japão | Celular | `090 1234 5678` | 10–11 | `wa.me/819012345678` |
| 🇧🇷 Brasil | Celular | `(11) 9 8765-4321` | 11 | `wa.me/5511987654321` |
| 🇧🇷 Brasil | Fixo | `(11) 3456-7890` | 10 | `wa.me/551134567890` |

A validação existente (10–11 dígitos) já aceita numericamente os dois tipos de telefone brasileiro. **O problema real é a formatação visual e a normalização E.164** — que deve sair de um módulo centralizado `utils/phone.ts` com funções `formatPhone(raw, country)` e `normalizeE164(raw, country)`. Os 67 DDDs ativos distribuídos em 26 estados + DF devem ser validados por whitelist no cadastro de contas brasileiras.

---

## 4. Estratégia de Implementação Recomendada

### 4.1 Análise Comparativa das Estratégias

| Critério | ✅ A — Codebase Único | ❌ B — Instâncias Separadas | ❌ C — Fork/Branch |
|---|---|---|---|
| Segurança clientes JP | Máxima (DEFAULT=Asia/Tokyo) | Máxima (sem compartilhamento) | Máxima inicialmente |
| Manutenção futura | Mínima — 1 repositório | Alta — 2x tudo para sempre | Divergência inevitável |
| Painel admin | Unificado — 1 login | Fragmentado — 2 painéis | Fragmentado |
| Custo infraestrutura | Zero adicional | Duplicado | Duplicado |
| Escala para 3+ países | Trivial — mesma arquitetura | Requer 3ª instância | Fork cresce exponencialmente |
| Risco de regressão | Baixo com testes adequados | Zero para JP (isolado) | Médio (merges) |

> **Estratégias B e C criam dívida técnica permanente.** Qualquer crescimento para 3 países torna o modelo inviável. A Estratégia A é a única escolha sustentável de longo prazo.

### 4.2 Plano de Implementação — 5 Fases

#### Fase 1 — Fundação de Dados · Dias 1–2 · Risco: Mínimo

Migração retrocompatível do schema. Adicionar 4 colunas à tabela `cp_agenda_accounts` com DEFAULT preservando comportamento japonês existente. Expor `timezone`, `country` e `currency` no payload da API pública.

```sql
ALTER TABLE `cp_agenda_accounts`
  ADD COLUMN `country`            VARCHAR(5)   NOT NULL DEFAULT 'JP',
  ADD COLUMN `timezone`           VARCHAR(50)  NOT NULL DEFAULT 'Asia/Tokyo',
  ADD COLUMN `currency`           VARCHAR(3)   NOT NULL DEFAULT 'JPY',
  ADD COLUMN `phone_country_code` VARCHAR(5)   NOT NULL DEFAULT '+81';
```

#### Fase 2 — Backend Timezone-Aware · Dias 3–6 · Risco: Baixo

Remover `date_default_timezone_set('Asia/Tokyo')` global. Cada rota lê o `timezone` da conta do banco antes de calcular. Validação de agendamento, notificação Telegram e painel admin passam a usar variáveis dinâmicas. **Esta é a fase mais delicada — requer testes rigorosos antes de avançar.**

```php
// DE:
$accountTz = new DateTimeZone('Asia/Tokyo');

// PARA:
$acc = Db::fetch('SELECT timezone FROM cp_agenda_accounts WHERE id = ?', [$accId]);
$accountTz = new DateTimeZone($acc['timezone'] ?? 'Asia/Tokyo');
$nowLocal  = new DateTime('now', $accountTz);
```

#### Fase 3 — Frontend Dinâmico · Dias 7–11 · Risco: Baixo-Médio

Substituir `getNowJST()` por função country-aware. Criar `utils/phone.ts` centralizado. Renomear e dinamizar `normalizePhoneToE164JP()` e `formatWhenJST()`. Moeda e locale dinâmicos em `AccountTab`. Componentes de telefone com máscara condicional Brasil/Japão.

```typescript
// DE:
const getNowJST = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

// PARA:
const getNowInTimezone = (tz: string) =>
  new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
```

#### Fase 4 — Painel Admin Multi-País · Dias 12–15 · Risco: Baixo

Formulário de cadastro com seletor de País → Estado → Fuso (auto-calculado). Tags visuais 🇧🇷 / 🇯🇵 na listagem. Filtro por país no dashboard. Auto-preenchimento de `currency` e `phone_country_code` ao selecionar país.

#### Fase 5 — Testes e Validação · Dias 16–20

Conta de teste brasileira (`America/Sao_Paulo`). Verificação de: calendário público, validação de passado/presente, conflito de slots, Telegram, WhatsApp, moeda R$. Regressão completa de contas japonesas existentes. Edge cases críticos:

- [ ] Agendamento feito no Brasil às 23h (seria "amanhã" no JST — não deve conflitar com conta JP)
- [ ] Validação de "hoje" correta em BRT
- [ ] Link WhatsApp gerado com `+55` (não `+81`)
- [ ] Valores monetários exibem `R$`
- [ ] DDD inválido (ex: `20`, `30`) rejeitado para conta BR
- [ ] Agendamentos existentes de contas JP não afetados
- [ ] Notificações Telegram JP continuam em JST

---

## 5. Pontos de Atenção — Riscos e Mitigações

| Ponto de Atenção | Nível | Descrição do Risco | Mitigação |
|---|---|---|---|
| Fuso hardcoded em 3 camadas | 🔴 CRÍTICO | PHP global, validação e frontend usam JST. Profissional em SP teria horários disponíveis das 21h às 6h — completamente inutilizável. | Fases 2 e 3 — cada request lê timezone da conta. Testes end-to-end antes do deploy. |
| WhatsApp +81 fixo | 🔴 CRÍTICO | Link WhatsApp de cliente BR gera número japonês inexistente. Problema imediatamente visível pelo profissional. | Ponto 8 — criar `normalizeE164(raw, country)` no `utils/phone.ts`. |
| Retorno do DST no Brasil | 🟠 MÉDIO | Se lei restaurar horário de verão, sistemas com offset fixo (`-03:00`) quebram imediatamente. | Nunca usar offset fixo. Sempre usar identificadores IANA. |
| MySQL em fuso não-UTC | 🟠 MÉDIO | Se MySQL server não estiver em UTC, `NOW()` retorna valor inconsistente entre países. | Verificar e alinhar MySQL para UTC. Toda conversão na camada PHP. |
| DDD inválido (ex: 20, 30) | 🟡 BAIXO | Usuário pode digitar DDD inexistente, gerando número inválido para WhatsApp. | Validar por whitelist dos 67 DDDs ativos no frontend. |
| LGPD — dados de brasileiros | ⚖️ LEGAL | Dados de clientes BR em servidores no exterior sujeitos à Lei 13.709/2018. | Avaliar com assessoria jurídica antes do lançamento. Adotar cláusulas contratuais padrão se necessário. |
| Latência 100–250ms do servidor | 🟡 BAIXO | VPS atual em `76.13.209.192` gera latência elevada para o Brasil. | Aceitável para agendamentos. Monitorar. CDN ou edge no futuro se necessário. |
| Agendamentos históricos ante-2019 | ℹ️ INFO | Registros feitos antes do fim do DST precisam de identificador IANA correto para exibição histórica. | Para agendamentos futuros (caso de uso principal), todos os fusos UTC-3 comportam-se identicamente hoje. |

---

## 6. Garantias de Não-Interferência nos Clientes Japoneses

A maior preocupação legítima em qualquer expansão é: *"alguma coisa vai quebrar para quem já usa?"* A resposta técnica é **não** — e pode ser garantida por design, não por esperança.

| Vetor de Risco | Mecanismo de Proteção | Garantia Técnica |
|---|---|---|
| Dados históricos corrompidos | Nenhuma conversão de datas. O campo `timezone` é metadata nova — não toca nos dados existentes. | ✅ Retrocompatibilidade total garantida |
| Comportamento do calendário alterado | `DEFAULT 'Asia/Tokyo'` — contas sem `timezone` explícito continuam 100% como hoje. | ✅ Impossível regredir sem alterar o DEFAULT |
| Links WhatsApp japoneses quebrados | `normalizeE164` usa `DEFAULT 'JP'` para contas sem `country` explícito. | ✅ Comportamento idêntico ao atual |
| Timezone vaza entre contas | Multi-tenant estrito. Coluna `account_id` blinda o acesso. Variáveis dinâmicas por conta. | ✅ Isolamento garantido pela arquitetura |
| API pública retorna dados errados | Novos campos apenas adicionados ao payload — nenhum campo existente é removido ou modificado. | ✅ Contrato de API preservado |
| Sessão / autenticação afetada | `Auth.php` não é tocado em nenhuma das 5 fases. | ✅ Zero impacto em autenticação |

---

## 7. O Que Não Precisa Mudar

Tão importante quanto saber o que mudar é saber o que não tocar.

| Sistema / Componente | Justificativa |
|---|---|
| Arquitetura multi-tenant | Já é o modelo correto para múltiplos países |
| Sistema de autenticação e sessões (`Auth.php`) | Não afetado por nenhuma das 5 fases |
| CI/CD pipeline (GitHub Actions + rsync) | Mesmo deploy serve os dois países |
| Sistema de serviços e disponibilidade | Lógica de negócio neutra a fuso |
| Estrutura de rotas da API | Apenas comportamento interno muda, não contratos |
| Sistema de faturas (valor `DECIMAL` no banco) | Valor numérico é neutro — só a exibição muda |
| Sistema de migrações idempotentes | Continuará sendo usado para a Fase 1 |
| Dias da semana (`segunda`, `terca`…) | Já em português — funciona para BR e JP sem alteração |
| Sistema de monitoramento Telegram | Estrutura intacta — apenas o conteúdo das mensagens de hora muda |

---

## 8. Estimativa de Esforço e Sequência de Deploy

| Fase | Descrição | Dias Estimados | Risco JP | Pré-requisito |
|---|---|---|---|---|
| 1 | Migração de schema + API pública | 2 | Mínimo | — |
| 2 | Backend timezone-aware | 3–4 | Baixo | Fase 1 em produção |
| 3 | Frontend dinâmico + `utils/phone.ts` | 4–5 | Baixo-Médio | Fase 2 validada |
| 4 | Painel admin multi-país | 3–4 | Baixo | Fase 3 funcional |
| 5 | Testes e validação completa | 4–5 | — | Fases 1–4 completas |
| **Total** | | **16–20 dias** | | |

> ⚠️ **Recomendação de sequência:** Fazer deploy das Fases 1+2 primeiro e validar no servidor com uma conta de teste brasileira antes de continuar. Isso permite detectar problemas cedo, sem expor clientes japoneses a qualquer instabilidade.

---

## 9. Conclusão e Próximos Passos

> ✅ **A expansão para o Brasil é tecnicamente viável, estrategicamente correta e segura para os clientes japoneses existentes.**

Os 9 pontos críticos são cirurgias pontuais em arquivos bem identificados — não é uma refatoração global. A maior parte do esforço está em testes rigorosos, não em volume de código. A arquitetura Wall-Clock Time e o modelo multi-tenant já adotados são os ativos certos para suportar múltiplos países.

### Próximos Passos — Quando Autorizado

1. Autorizar início do desenvolvimento e definir data de kickoff
2. Executar migration da Fase 1 em ambiente de homologação (localhost / subdomínio de teste)
3. Implementar e validar Fase 2 (backend) com conta de teste BR antes de avançar para Fase 3
4. Implementar Fases 3 e 4 após validação completa do backend
5. Executar checklist completo da Fase 5 — testes BR + regressão total JP
6. Deploy em produção com monitoramento ativo nas primeiras 48h
7. **Avaliar ponto legal LGPD** com assessoria jurídica antes de captar primeiros clientes brasileiros

---

*Creative Print · CP Agenda Pro · Relatório Master de Viabilidade Técnica v1.0 · 11 de junho de 2026 · Técnico / Confidencial*

*Consolidação dos Pareceres Técnicos v1.0 (Antigravity AI) e v1.1 · Aprovado em 11 de junho de 2026 · Desenvolvimento Iniciado.*
