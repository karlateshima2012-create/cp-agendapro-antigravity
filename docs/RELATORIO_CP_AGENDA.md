# CP Agenda Pro — Relatório Completo do Sistema

> Gerado em: 2026-06-18
> Versão da API: 1.0.0
> Branch: main

---

## Índice

1. [Bloco 1 — Visão Geral e Proposta de Valor](#bloco-1--visão-geral-e-proposta-de-valor)
2. [Bloco 2 — Mapa de Funcionalidades com Abordagem Comercial](#bloco-2--mapa-de-funcionalidades-com-abordagem-comercial)
3. [Bloco 3 — Documentação Técnica Estrutural](#bloco-3--documentação-técnica-estrutural)
4. [Bloco 4 — Regras de Negócio, Permissões e Fluxos de Exceção](#bloco-4--regras-de-negócio-permissões-e-fluxos-de-exceção)
5. [Sumário Executivo](#sumário-executivo)

---

# Bloco 1 — Visão Geral e Proposta de Valor

## Nome do Sistema

**CP Agenda Pro**

## Propósito Central

Uma plataforma SaaS multi-tenant de agendamento online que permite a profissionais autônomos e pequenos estabelecimentos gerenciar serviços, horários e clientes — com página pública de agendamento, notificações automáticas via Telegram e painel administrativo centralizado — sem depender de terceiros para o atendimento.

---

## Problema que Resolve

Antes do CP Agenda Pro, profissionais autônomos e pequenos negócios sofriam com:

- **Agenda manual por WhatsApp:** horas perdidas gerenciando mensagens, confirmações e cancelamentos individualmente.
- **Conflitos de horário:** dois clientes marcando o mesmo horário sem que o profissional perceba.
- **Ausência de página profissional:** o cliente não consegue ver serviços, preços e disponibilidade em um só lugar.
- **Zero visibilidade em tempo real:** o profissional só descobria um novo agendamento quando checava o celular.
- **Dificuldade em bloquear períodos:** feriados, férias ou manutenções impactavam clientes que tentavam marcar horários já ocupados.
- **Histórico perdido:** sem registro de clientes atendidos, serviços realizados e receita acumulada.

---

## Público-Alvo Ideal

O sistema foi projetado para operar **nativamente no Japão e no Brasil**, com suporte a duas realidades de mercado distintas:

- **Profissionais no Japão:** cabeleireiros, esteticistas, manicures e prestadores de serviço da comunidade brasileira no Japão — timezone `Asia/Tokyo`, moeda JPY, código de telefone `+81`, formatação japonesa de número (ex: `080 1234 5678`).
- **Profissionais no Brasil:** prestadores de serviço em múltiplos estados brasileiros — timezone `America/Sao_Paulo` e variantes regionais (Manaus, Cuiabá, Fortaleza etc.), moeda BRL, código `+55`.
- **Revendedores e agências:** o painel `super_admin` permite criar, gerenciar e renovar planos de múltiplos profissionais a partir de uma única tela.

---

## Diferenciais Competitivos

### 1. Integração nativa com Telegram via Deep Linking
O profissional conecta seu Telegram em menos de 30 segundos: clica em "Conectar Telegram" no painel, é redirecionado ao bot `@Cpagendaprobot` com um token único de 10 minutos, e a partir daquele momento **recebe uma mensagem instantânea no Telegram a cada novo agendamento** — com nome do cliente, telefone, serviço e data/hora já formatados no fuso correto.

### 2. Página Pública de Agendamento sem Login
Cada profissional possui uma URL pública única no formato `/?p=ID`. O cliente final acessa pelo celular, vê os serviços com imagem, descrição e preço, escolhe o horário disponível em um calendário visual e confirma — **sem criar conta e sem instalar nada**. A página respeita as cores, logo, capa e descrição personalizadas do profissional.

### 3. Monitoramento de Erros em Tempo Real (Frontend + Backend)
Dois canais de Telegram independentes capturam falhas: erros PHP não tratados e exceções fatais do backend são enviados ao administrador do sistema via `TELEGRAM_MONITOR_TOKEN`; crashes e erros JavaScript do React chegam pelo mesmo canal via o endpoint `/public/log-error`. **O sistema avisa antes do cliente reclamar.**

### 4. Arquitetura Multi-Tenant com Isolamento Total
Cada profissional é um tenant isolado: todos os dados (serviços, agendamentos, clientes, disponibilidade) são filtrados obrigatoriamente por `account_id`. Não há vazamento de dados entre contas — validado por chaves estrangeiras com `ON DELETE CASCADE` e queries com colunas explícitas.

### 5. Configuração de Disponibilidade por Mês e Horários Fixos
Além de definir horários de trabalho por dia da semana, o profissional pode: (a) restringir em quais meses do ano aceita agendamentos (`availableMonths`), (b) bloquear datas inteiras ou intervalos específicos dentro de um dia com motivo descritivo, (c) escolher entre slots por intervalo fixo (a cada N minutos) ou horários pré-determinados (`fixedTimes`).

### 6. Painel Administrativo com Métricas de Saúde dos Clientes
O `super_admin` visualiza todos os profissionais cadastrados com indicadores de saúde calculados em tempo real: último acesso, último agendamento confirmado, agendamentos nos últimos 30 dias, se tem Telegram conectado, se preencheu perfil e cobertura. Isso permite identificar clientes em risco de churn antes de cancelar.

### 7. Buffer de Limpeza Entre Serviços
Cada serviço pode ter um tempo de buffer (`cleaning_buffer_min`) que é somado à duração para calcular `end_datetime`. O sistema bloqueia automaticamente esse tempo extra ao verificar conflitos — **nenhum cliente consegue marcar durante o intervalo de limpeza**.

### 8. Deploy Automatizado com Análise Estática
Todo `git push` na branch `main` dispara um pipeline GitHub Actions que faz: build do frontend com Vite, análise estática do PHP com PHPStan (bloqueia deploy em caso de erro de tipagem), geração do `.env` a partir de Secrets, rsync incremental para VPS, migração do banco e reload do PHP-FPM — **sem intervenção manual**.

---

## Arquitetura Resumida

O CP Agenda Pro é uma aplicação de página única (SPA) construída em React que conversa com um backend em PHP através de uma API REST. O frontend é servido como arquivos estáticos pelo Nginx; as requisições com prefixo `/api/` são repassadas ao PHP-FPM. O banco de dados MySQL armazena todos os dados dos tenants de forma isolada por `account_id`. Um bot no Telegram funciona como canal de notificação bidirecional: o sistema envia avisos de novos agendamentos para o profissional, e o mesmo bot recebe o comando `/start` para conectar automaticamente a conta via Deep Linking. Tudo roda em uma VPS Ubuntu com deploy contínuo gerenciado pelo GitHub Actions.

---

## Capacidades Técnicas de Performance e Escala

- **Polling de 15 segundos:** o frontend faz requisições a `/appointments` a cada 15 s para manter o painel atualizado — erros de rede são silenciados para não gerar alertas desnecessários.
- **Paginação server-side:** o endpoint `GET /appointments` suporta `page`, `limit`, `from`, `to` e `source` (ativo ou arquivo), evitando carregar todo o histórico de uma vez.
- **Índice no banco:** a tabela `cp_agenda_appointments` possui índice em `start_at` para consultas por período.
- **Transações atômicas:** criação de agendamentos e de usuários usam `beginTransaction`/`commit`/`rollBack` para garantir consistência.
- **Imagens como Base64 no banco:** imagens de perfil e capa são armazenadas como Base64 em colunas `LONGTEXT` com validação de tamanho máximo de 6 MB.
- **Rate limiting por arquivo:** autenticação e reset de senha usam um limitador baseado em arquivos com lock exclusivo (`LOCK_EX`), evitando condição de corrida TOCTOU.
- **Charset utf8mb4:** todas as tabelas usam `utf8mb4_unicode_ci`, suportando emoji e caracteres japoneses.

---

# Bloco 2 — Mapa de Funcionalidades com Abordagem Comercial

---

## Módulo 1 — Autenticação e Perfis de Acesso

**Analogia/Venda:** Sua agenda tem crachá — e cada crachá abre exatamente as portas que precisa, nem mais, nem menos.

**Como funciona (passo a passo do usuário):**
1. O profissional acessa o sistema e digita e-mail e senha.
2. O sistema valida as credenciais, verifica o status da conta e cria uma sessão PHP de 30 dias.
3. Se o profissional foi criado pelo administrador, na primeira entrada o sistema exige a troca de senha (`must_change_password`).
4. Caso esqueça a senha, clica em "Esqueci minha senha", recebe um e-mail com link válido por 1 hora e redefine diretamente pelo navegador.
5. Ao sair, a sessão é destruída e o cookie é invalidado.

**Principais ações disponíveis:**
- Login com e-mail e senha (bcrypt)
- Logout com limpeza de sessão server-side
- Recuperação de senha por e-mail com token seguro (`bin2hex(random_bytes(32))`)
- Confirmação de nova senha via link único
- Troca forçada de senha no primeiro acesso
- Sessão persistente por 30 dias com cookie `HttpOnly`, `Secure`, `SameSite=Lax`

**Benefício direto para o dia a dia:**
O profissional entra uma vez e fica logado por um mês — sem precisar digitar a senha toda vez que abrir o painel no celular.

**Diferencial interno:**
- Rate limiting de **10 tentativas de login por IP em 15 minutos** (código 429)
- Rate limiting de **5 pedidos de reset por e-mail em 10 minutos** com resposta intencionalmente vaga para não revelar se o e-mail existe
- Sessões salvas em `/home/deploy/php-sessions` para sobreviver ao limpador padrão do systemd

---

## Módulo 2 — Página Pública de Agendamento Online

**Analogia/Venda:** É como ter uma recepcionista digital disponível 24h — seus clientes agendam sozinhos, no horário deles, sem precisar te chamar no WhatsApp.

**Como funciona (passo a passo do usuário):**
1. O profissional compartilha o link `https://cpagendapro.creativeprintjp.com/?p=ID`.
2. O cliente acessa no celular: vê o banner, foto de perfil, descrição e lista de serviços.
3. Clica no serviço desejado, escolhe uma data disponível no calendário e seleciona o horário.
4. Preenche nome, telefone e e-mail (opcional) e confirma.
5. O agendamento entra como `pending` no painel do profissional e uma notificação chega no Telegram.

**Principais ações disponíveis:**
- Visualização de serviços em modo card ou lista
- Calendário com slots disponíveis calculados em tempo real (respeita horários bloqueados, buffer e agendamentos existentes)
- Formulário de dados do cliente com validação de telefone por país
- Contador de visualizações (`page_views`) incrementado a cada acesso de não-proprietário

**Benefício direto para o dia a dia:**
O profissional acorda com agendamentos novos esperando confirmação — sem ter atendido nenhuma mensagem de madrugada.

**Diferencial interno:**
- A página carrega dados do profissional via `GET /public/profile/:id` sem necessitar de autenticação
- Agendamentos de contas `blocked`, `expired` ou `deleted` são bloqueados com página de "Indisponível" — os dados de disponibilidade não são expostos
- Validação server-side: não é possível agendar no mesmo dia (`today`) nem em datas passadas
- Normalização de telefone: espaços e hífens são removidos antes de salvar, evitando duplicatas no CRM

---

## Módulo 3 — Gestão de Serviços

**Analogia/Venda:** Monte o cardápio do seu negócio com foto, preço e tempo — e deixe o cliente escolher antes mesmo de chegar.

**Como funciona (passo a passo do usuário):**
1. Na aba "Serviços", o profissional clica em adicionar ou edita um serviço existente.
2. Define nome, descrição, duração em minutos, buffer de limpeza, preço e imagem de capa.
3. Personaliza a cor do nome e da descrição para combinar com sua identidade visual.
4. Salva — os serviços aparecem imediatamente na página pública na ordem definida.

**Principais ações disponíveis:**
- Criar, editar e reordenar serviços
- Upload de imagem de capa (Base64, máximo 6 MB)
- Opacidade da imagem ajustável
- Cor personalizada para nome e descrição (`nameColor`, `descriptionColor`)
- Definir buffer de limpeza (`cleaning_buffer_min`) separado da duração
- Ativar/desativar serviço (`is_active`)

**Benefício direto para o dia a dia:**
O cliente já chega sabendo o tempo e o preço — menos negociação, mais agendamentos diretos.

**Diferencial interno:**
- O save de serviços usa transação atômica: apaga todos os serviços da conta e reinsere na nova ordem, garantindo consistência sem ID duplicado
- O buffer de limpeza é somado na `end_datetime` do agendamento, bloqueando o slot seguinte automaticamente

---

## Módulo 4 — Configuração de Disponibilidade

**Analogia/Venda:** Configure sua agenda uma vez e deixe ela trabalhar por você — o sistema só mostra horários que você realmente pode atender.

**Como funciona (passo a passo do usuário):**
1. Na aba "Disponibilidade", o profissional define quais dias da semana trabalha e os horários de início e fim.
2. Ajusta o intervalo entre slots (ex: a cada 30 ou 60 minutos).
3. Seleciona em quais meses do ano aceita agendamentos.
4. Adiciona datas bloqueadas pontuais (feriados, férias) com motivo e, opcionalmente, um intervalo de horas específico.

**Principais ações disponíveis:**
- Configuração de horários por dia da semana com flag `isWorking`
- Intervalo entre slots (`intervalMinutes`)
- Lista de meses disponíveis (`availableMonths`) — 1 a 12
- Bloqueio de datas inteiras ou parciais (`start_time` / `end_time` opcionais)
- Motivo descritivo para cada data bloqueada
- Suporte a dois tipos de slot: intervalo (`interval`) ou horários fixos (`fixedTimes`)

**Benefício direto para o dia a dia:**
Tirou férias em agosto? Bloqueia o mês inteiro em 3 cliques — sem precisar recusar pedido por pedido.

**Diferencial interno:**
- Save usa transação atômica: a disponibilidade é atualizada (upsert) e as datas bloqueadas são sincronizadas na mesma transação
- O endpoint público `/public/profile/:id` entrega as datas bloqueadas juntas com os dados de disponibilidade em uma única chamada, evitando roundtrips

---

## Módulo 5 — Gestão de Agendamentos

**Analogia/Venda:** Sua agenda digital com confirmações em um clique — sem planilha, sem papel, sem confusão.

**Como funciona (passo a passo do usuário):**
1. Novos agendamentos aparecem na aba principal com status `pending` e badge de notificação.
2. O profissional confirma, rejeita ou marca como concluído com um único clique.
3. Ao confirmar, um link de WhatsApp pré-preenchido é gerado com a mensagem de confirmação para o cliente.
4. Agendamentos excluídos são marcados com soft delete (`deleted_at`) e ficam visíveis no histórico.

**Principais ações disponíveis:**
- Listagem com filtros por período (`from`, `to`) e fonte (`active` / `archive`)
- Atualização de status: `pending` → `confirmed`, `canceled`, `rejected`, `done`
- Exclusão individual (soft delete)
- Exclusão em massa (`bulk-delete`) com seleção múltipla
- Paginação server-side (`page`, `limit`, `hasMore`)
- Histórico de agendamentos arquivados via tabela separada `cp_agenda_appointments_archive`
- Link direto para WhatsApp com mensagem de confirmação ou rejeição pré-formatada no fuso horário correto
- Polling automático a cada 15 segundos para atualizar a lista em tempo real

**Benefício direto para o dia a dia:**
Nenhum agendamento passa despercebido — o Telegram avisa na hora e o painel confirma em tempo real.

**Diferencial interno:**
- Ao mudar status para `confirmed`, o campo `lifetime_appointments` da conta é incrementado automaticamente — contabilizando o total histórico
- Conflitos de horário são detectados em transação com lock no nível de registro, impedindo double booking simultâneo
- Erros de rede durante o polling são silenciados para não gerar alertas falsos no Telegram de monitoramento

---

## Módulo 6 — CRM / Cadastro de Clientes

**Analogia/Venda:** Sua lista VIP de clientes que cresce sozinha — toda vez que alguém agenda, o contato já é salvo automaticamente.

**Como funciona (passo a passo do usuário):**
1. Quando um cliente faz um agendamento pela página pública, seus dados (nome, telefone, e-mail) são salvos ou atualizados automaticamente no CRM.
2. Na aba "Clientes", o profissional visualiza a lista completa, pode buscar por nome, telefone ou e-mail.
3. Pode adicionar clientes manualmente ou excluir registros.

**Principais ações disponíveis:**
- Listagem com busca por nome, telefone ou e-mail (LIKE)
- Cadastro manual de cliente
- Upsert automático no momento do agendamento (duplicata por telefone é atualizada, não criada)
- Exclusão de cliente
- Restrição de unicidade: `UNIQUE KEY uk_account_phone (account_id, phone)`

**Benefício direto para o dia a dia:**
O profissional tem o histórico de quem já foi atendido sem precisar cadastrar ninguém manualmente.

**Diferencial interno:**
- Normalização de telefone na gravação: todos os caracteres não-numéricos são removidos (`preg_replace('/\D/', '', ...)`) antes do upsert, evitando duplicatas por formatação diferente

---

## Módulo 7 — Notificações via Telegram

**Analogia/Venda:** Cada novo agendamento cai direto no seu bolso — como uma mensagem de amigo, mas é dinheiro chegando.

**Como funciona (passo a passo do usuário):**
1. Na aba "Minha Conta", o profissional clica em "Conectar Telegram".
2. O sistema gera um token único com validade de 10 minutos e abre o bot `@Cpagendaprobot` com esse token como parâmetro `/start TOKEN`.
3. O bot valida o token, salva o `chat_id` da conta e confirma a conexão com uma mensagem de boas-vindas.
4. A partir desse momento, toda vez que um cliente faz um agendamento, uma mensagem HTML formatada chega no Telegram do profissional.

**Principais ações disponíveis:**
- Conexão via Deep Linking com token temporário (10 minutos)
- Verificação de status da conexão (`GET /me/telegram/status`)
- Teste de notificação com mensagem de confirmação
- Desconexão — limpa `telegram_chat_id` e o token da conta

**Benefício direto para o dia a dia:**
O profissional recebe a notificação onde já passa o dia — no Telegram — com todos os dados do cliente em uma mensagem.

**Diferencial interno:**
- A notificação inclui: nome do cliente, telefone, serviço e data/hora formatada no **fuso horário da conta** (não UTC)
- O token expira em 10 minutos e é invalidado após uso — impossível reutilizar
- A conexão ocorre sem necessidade de o profissional inserir manualmente o `chat_id` — o bot faz isso automaticamente

---

## Módulo 8 — Personalização Visual do Perfil

**Analogia/Venda:** Sua página de agendamento com a sua cara — logo, cores e estilo que comunicam quem você é antes do cliente chegar.

**Como funciona (passo a passo do usuário):**
1. Na aba "Minha Conta", o profissional faz upload da foto de perfil e da imagem de capa.
2. Define cores primária e secundária com seletor hexadecimal.
3. Escreve uma descrição curta, personaliza o título e subtítulo da seção de serviços.
4. Escolhe o modo de exibição dos serviços (cards ou lista).
5. Salva — a página pública é atualizada imediatamente.

**Principais ações disponíveis:**
- Upload de imagem de capa e de perfil (Base64, max 6 MB por imagem)
- Ajuste de opacidade da imagem de capa (`cover_opacity`)
- Cor primária e secundária (validadas como hex `#RRGGBB`)
- Descrição curta da empresa/profissional
- Título e subtítulo da seção de serviços
- Alternância entre modo card e modo lista (`view_mode`)

**Benefício direto para o dia a dia:**
O cliente abre o link e já sente que é um negócio profissional — não um formulário genérico.

**Diferencial interno:**
- Validação server-side de cores hexadecimais para evitar injeção de CSS
- Validação de tamanho de imagem (rejeita acima de 6 MB com erro 400)

---

## Módulo 9 — Painel Administrativo (super_admin)

**Analogia/Venda:** O painel de controle da sua franquia — veja todos os seus clientes, renove planos e acompanhe quem está ativo ou em risco, tudo em uma tela.

**Como funciona (passo a passo do usuário):**
1. O super_admin faz login e cai direto no painel administrativo com lista de todos os profissionais.
2. Visualiza métricas de saúde: último acesso, agendamentos nos últimos 30 dias, se tem Telegram, foto e descrição preenchidos.
3. Pode criar um novo profissional preenchendo e-mail, senha, nome da empresa, nome do responsável, telefone, plano e país.
4. Ao criar, o sistema envia automaticamente um e-mail de boas-vindas com as credenciais e link para o painel.
5. Pode renovar o plano (somando meses à data de expiração atual), bloquear/desbloquear acesso e excluir o profissional.

**Principais ações disponíveis:**
- Listar todos os clientes com métricas de saúde calculadas em tempo real (subqueries)
- Filtrar por país (JP / BR) e por status de saúde (crítico / risco / saudável)
- Criar profissional com plano e configuração regional (país, timezone, moeda, código de telefone)
- Renovar plano por número de meses (soma à expiração vigente se ainda válida, ou parte do dia atual)
- Bloquear e desbloquear acesso (`accountStatus`)
- Editar dados: nome da empresa, responsável, telefone, e-mail, plano, configurações de localização
- Excluir profissional (cascade deleta conta, usuários, serviços e agendamentos)
- Visualizar e gerenciar faturas/invoices (JSON na conta)

**Benefício direto para o dia a dia:**
Gerir dezenas de clientes sem abrir o banco de dados — tudo pelo painel, incluindo a renovação do plano em dois cliques.

**Diferencial interno:**
- O e-mail de boas-vindas enviado automaticamente inclui as credenciais temporárias e instrui sobre a troca obrigatória de senha no primeiro acesso
- Filtro de saúde (`critical` / `risk` / `healthy`) calculado no frontend com base em: dias sem acesso, agendamentos recentes, Telegram conectado e perfil preenchido
- Validação de whitelist para campos sensíveis: `plan_type`, `country`, `currency`, `phone_country_code`, `timezone`

---

## Módulo 10 — Monitoramento de Erros em Tempo Real

**Analogia/Venda:** Como ter um segurança 24h que avisa no seu celular assim que qualquer coisa estranha acontece no sistema — antes que o cliente perceba.

**Como funciona:**
1. O PHP registra handlers globais no início de cada requisição (`Monitor::register()`).
2. Exceções não capturadas e erros fatais são enviados ao Telegram via bot dedicado (`TELEGRAM_MONITOR_TOKEN`).
3. No frontend, `window.onerror`, `unhandledrejection` e o `ErrorBoundary` do React capturam crashes e enviam ao endpoint `/public/log-error`.
4. O backend formata o alerta com: ambiente, timestamp, URL da requisição, IP, mensagem de erro e stack trace resumido.
5. Alertas idênticos são suprimidos por **5 minutos** para evitar spam.

**Principais ações disponíveis:**
- Captura automática de exceções PHP não tratadas
- Captura de erros fatais PHP via `register_shutdown_function`
- Alertas manuais via `Monitor::critical()` para erros de negócio previsíveis mas críticos (ex: falha ao criar usuário)
- Captura de erros JavaScript globais e rejeições de Promise não tratadas
- Captura de crashes do React via `ErrorBoundary.componentDidCatch`
- Rate limiting de 5 minutos entre alertas idênticos (baseado em hash MD5 da mensagem + arquivo + linha)
- Limite de 5 erros de frontend reportados por sessão (`MAX_CLIENT_ERRORS_REPORTED`)

**Benefício direto para o dia a dia:**
Problemas de infraestrutura chegam no Telegram antes que o profissional abra um ticket de suporte.

**Diferencial interno:**
- Dois bots Telegram distintos: `TELEGRAM_BOT_TOKEN` para notificações de agendamento ao profissional; `TELEGRAM_MONITOR_TOKEN` para alertas de erro ao administrador do sistema
- O alerta de erro de frontend inclui: URL da página, user-agent do navegador, nome do arquivo JS e número da linha, stack trace JS e component stack do React

---

# Bloco 3 — Documentação Técnica Estrutural

## Stack Completo

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend framework | React | 19.2.0 |
| Linguagem frontend | TypeScript | ~5.8.2 |
| Build tool | Vite | ^6.2.0 |
| HTTP client | Axios | ^1.13.5 |
| Ícones | Lucide React | ^0.555.0 |
| CSS | Tailwind CSS | ^4.2.1 |
| Backend linguagem | PHP | 8.3 |
| Análise estática PHP | PHPStan (via larastan) | ^3.0 |
| Mailer PHP | PHPMailer | ^7.0 |
| Banco de dados | MySQL | utf8mb4 |
| Servidor web | Nginx | (VPS Ubuntu) |
| Runtime PHP | PHP-FPM | 8.3 |
| Infraestrutura | VPS Ubuntu | — |
| CI/CD | GitHub Actions | ubuntu-latest |

---

## Estrutura de Pastas

```
cp_agenda_pro/
├── App.tsx                    # Componente raiz: roteamento, estado global, polling
├── types.ts                   # Interfaces TypeScript do domínio
├── constants.ts               # Defaults de disponibilidade, formatação de telefone JP, links WhatsApp
├── schema.sql                 # Schema MySQL do banco de dados
├── package.json               # Dependências Node.js
├── vite.config.ts             # Configuração de build (esbuild, target es2015)
│
├── src/
│   ├── api.ts                 # Funções tipadas de acesso à API REST
│   ├── apiClient.ts           # Instância Axios com interceptors de 401
│   ├── logger.ts              # Logger condicional (silencia em produção)
│   └── vite-env.d.ts          # Types de variáveis de ambiente Vite
│
├── components/
│   ├── AdminDashboard.tsx     # Painel super_admin: lista de clientes, criação, renovação
│   ├── ClientDashboard.tsx    # Painel do profissional: abas de agendamento, serviços, etc.
│   ├── PublicBookingPage.tsx  # Página pública de agendamento (sem login)
│   ├── AppointmentsTab.tsx    # Aba de agendamentos com polling e bulk delete
│   ├── AvailabilityTab.tsx    # Configuração de horários e datas bloqueadas
│   ├── ServicesTab.tsx        # Gestão de serviços com upload de imagem
│   ├── AccountTab.tsx         # Perfil, Telegram, cores, imagens
│   ├── ClientsTab.tsx         # CRM de clientes com busca
│   ├── HistoryTab.tsx         # Histórico de agendamentos arquivados
│   ├── GestaoTab.tsx          # Aba de gestão (métricas internas)
│   ├── LoginScreen.tsx        # Tela de login
│   ├── ResetPasswordPage.tsx  # Redefinição de senha via token
│   ├── ForcePasswordChange.tsx# Troca obrigatória de senha no primeiro acesso
│   ├── BlockedScreen.tsx      # Tela para contas bloqueadas/expiradas
│   ├── DashboardHeader.tsx    # Cabeçalho do painel com navegação
│   ├── OnboardingModal.tsx    # Tour de boas-vindas para novos usuários
│   ├── InteractiveTour.tsx    # Tour interativo guiado
│   ├── Toast.tsx              # Notificação visual temporária
│   ├── ConfirmModal.tsx       # Modal de confirmação de ação destrutiva
│   ├── Logo.tsx               # Componente de logo SVG
│   └── TermsAndPoliciesModal.tsx  # Modal de termos de uso e políticas
│
├── utils/
│   ├── availability.ts        # Mapeamento de workingHours entre formatos
│   ├── brazilTimezones.ts     # Lista de estados brasileiros e timezones
│   └── phone.ts               # Validação e normalização de telefones por país
│
├── backend/
│   ├── composer.json          # Dependências PHP (phpmailer, larastan)
│   ├── phpstan.neon           # Configuração da análise estática
│   ├── migrate.php            # Script de migração idempotente do banco
│   ├── api/
│   │   ├── index.php          # Roteador principal da API
│   │   ├── config.php         # Carregamento do .env, constantes DB
│   │   ├── lib/
│   │   │   ├── Auth.php       # Gerenciamento de sessão PHP
│   │   │   ├── Db.php         # Wrapper PDO (singleton)
│   │   │   ├── Monitor.php    # Alertas de erro via Telegram
│   │   │   ├── Response.php   # Helpers de resposta JSON
│   │   │   └── Mail.php       # Envio de e-mail via PHPMailer + SMTP
│   │   └── routes/
│   │       ├── auth.php       # Login, logout, recuperação de senha
│   │       ├── me.php         # Perfil do usuário logado, Telegram, senha
│   │       ├── services.php   # CRUD de serviços
│   │       ├── availability.php   # Configuração de disponibilidade
│   │       ├── blocked_dates.php  # Datas bloqueadas
│   │       ├── appointments.php   # Gestão e criação pública de agendamentos
│   │       ├── clients.php    # CRM de clientes
│   │       ├── admin.php      # Gestão de usuários pelo super_admin
│   │       ├── public.php     # Perfil público, contador de views, log de erros JS
│   │       └── telegram_webhook.php  # Webhook do bot Telegram (Deep Linking)
│   └── database/
│       └── (migrations SQL)
│
└── .github/
    └── workflows/
        └── deploy.yml         # Pipeline de CI/CD completo
```

---

## Schema do Banco de Dados

Banco: MySQL, charset `utf8mb4_unicode_ci`.

### Tabela: `cp_agenda_accounts` (Tenants)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador da conta |
| `name` | VARCHAR(255) | Nome da empresa/profissional |
| `owner_name` | VARCHAR(255) | Nome do responsável |
| `status` | ENUM('active','expired','blocked','deleted') | Status da conta |
| `plan_type` | ENUM('trial','1m','3m','6m','12m') | Tipo de plano |
| `plan_expires_at` | DATETIME | Data de expiração do plano |
| `primary_color` | VARCHAR(7) | Cor primária (#25aae1 padrão) |
| `secondary_color` | VARCHAR(7) | Cor secundária (#1f2937 padrão) |
| `short_description` | TEXT | Descrição curta do profissional |
| `services_title` | VARCHAR(255) | Título da seção de serviços |
| `services_subtitle` | VARCHAR(255) | Subtítulo da seção de serviços |
| `cover_image` | VARCHAR(255) | Imagem de capa (Base64) |
| `view_mode` | VARCHAR(10) | Modo de exibição: 'card' ou 'list' |
| `cover_opacity` | INT | Opacidade da capa (0-100) |
| `profile_image` | VARCHAR(255) | Foto de perfil (Base64) |
| `telegram_bot_token` | VARCHAR(255) | Token do bot Telegram do profissional |
| `telegram_chat_id` | VARCHAR(255) | Chat ID do Telegram do profissional |
| `invoices` | JSON | Histórico de faturas |
| `onboarding_seen` | TINYINT(1) | Flag de onboarding concluído |
| `lifetime_appointments` | INT | Total de agendamentos confirmados na conta |
| `country` | VARCHAR(5) | País (JP ou BR), padrão 'JP' |
| `timezone` | VARCHAR(50) | Fuso horário, padrão 'Asia/Tokyo' |
| `currency` | VARCHAR(3) | Moeda (JPY ou BRL) |
| `phone_country_code` | VARCHAR(5) | Código de telefone (81 ou 55) |
| `hotmart_url` | VARCHAR(255) | URL de página de vendas (Hotmart) |
| `page_views` | INT | Contador de visitas à página pública |
| `last_access_at` | DATETIME | Último acesso ao painel (throttle 1h) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

### Tabela: `cp_agenda_users` (Autenticação)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador do usuário |
| `account_id` | INT FK | Referência à conta (ON DELETE CASCADE) |
| `role` | ENUM('super_admin','account_admin','staff','client') | Perfil de acesso |
| `name` | VARCHAR(255) | Nome do usuário |
| `email` | VARCHAR(255) UNIQUE | E-mail de login |
| `password_hash` | VARCHAR(255) | Senha hasheada com bcrypt |
| `reset_token` | VARCHAR(100) | Token de recuperação de senha |
| `reset_expires` | DATETIME | Expiração do token de reset |
| `must_change_password` | TINYINT(1) | Flag de troca obrigatória (primeiro acesso) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

### Tabela: `cp_agenda_services` (Serviços)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador |
| `account_id` | INT FK | Conta dona do serviço |
| `user_id` | INT DEFAULT NULL | Vínculo opcional com staff |
| `name` | VARCHAR(255) | Nome do serviço |
| `description` | TEXT | Descrição |
| `duration_min` | INT | Duração em minutos |
| `cleaning_buffer_min` | INT | Buffer de limpeza em minutos |
| `price` | DECIMAL(10,2) | Preço |
| `is_active` | TINYINT(1) | Ativo/inativo |
| `sort_order` | INT | Ordem de exibição |
| `image_url` | LONGTEXT | Imagem em Base64 |
| `image_opacity` | INT | Opacidade da imagem (0-100) |
| `name_color` | VARCHAR(7) | Cor do nome (#ffffff padrão) |
| `description_color` | VARCHAR(7) | Cor da descrição (#9ca3af padrão) |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela: `cp_agenda_availability` (Disponibilidade)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador |
| `account_id` | INT FK | Conta |
| `user_id` | INT DEFAULT NULL | Vínculo opcional com staff |
| `working_hours` | JSON | Horários por dia da semana |
| `interval_minutes` | INT | Intervalo entre slots |
| `available_months` | JSON | Lista de meses disponíveis (1-12) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

### Tabela: `cp_agenda_blocked_dates` (Datas Bloqueadas)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador |
| `account_id` | INT FK | Conta |
| `user_id` | INT DEFAULT NULL | Vínculo opcional com staff |
| `blocked_date` | DATE | Data bloqueada |
| `start_time` | TIME DEFAULT NULL | Início do bloqueio parcial (NULL = dia inteiro) |
| `end_time` | TIME DEFAULT NULL | Fim do bloqueio parcial (NULL = dia inteiro) |
| `reason` | VARCHAR(255) | Motivo do bloqueio |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela: `cp_agenda_appointments` (Agendamentos)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador |
| `account_id` | INT FK | Conta |
| `user_id` | INT DEFAULT NULL | Usuário/staff responsável |
| `client_name` | VARCHAR(255) | Nome do cliente |
| `client_email` | VARCHAR(255) | E-mail do cliente |
| `client_phone` | VARCHAR(50) | Telefone normalizado (só dígitos) |
| `service_id` | INT | ID do serviço |
| `service_name` | VARCHAR(255) | Nome do serviço (desnormalizado) |
| `start_at` | DATETIME | Início do agendamento |
| `end_datetime` | DATETIME | Fim = start + duration + buffer |
| `duration` | INT | Duração em minutos |
| `status` | ENUM('pending','confirmed','done','canceled','rejected') | Status |
| `notes` | TEXT | Observações |
| `deleted_at` | TIMESTAMP NULL | Soft delete |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

> Índice: `idx_start_at (start_at)` para consultas por período.

### Tabela: `cp_agenda_clients` (CRM)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador |
| `account_id` | INT FK | Conta |
| `name` | VARCHAR(255) | Nome do cliente |
| `phone` | VARCHAR(50) | Telefone normalizado |
| `email` | VARCHAR(255) DEFAULT NULL | E-mail |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

> Restrição: `UNIQUE KEY uk_account_phone (account_id, phone)` — telefone único por conta.

---

## Endpoints da API

Base URL: `/api`

### Diagnóstico

| Método | Path | Descrição |
|---|---|---|
| GET | `/ping` | Verifica se a API está viva (retorna PONG + versão) |
| GET | `/db` | Verifica conexão com o banco de dados |

### Autenticação (`/auth`)

| Método | Path | Parâmetros (Body) | Retorno |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ user: { id, email, name, role, account_id, account_status, must_change_password } }` |
| POST | `/auth/logout` | — | `{ msg }` |
| POST | `/auth/forgot-password` | `{ email }` | `{ msg }` (sempre 200 por segurança) |
| POST | `/auth/reset-password` | `{ code, password }` | `{ msg }` |

### Usuário Logado (`/me`)

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/me` | — | `{ user, account }` |
| PATCH | `/me/profile` | `{ name, short_description, services_title, services_subtitle, primary_color, secondary_color, cover_image, profile_image, telegram_bot_token, telegram_chat_id, view_mode, cover_opacity, timezone, country, currency }` | `{ msg }` |
| POST | `/me/change-password` | `{ password }` | `{ msg }` |
| POST | `/me/onboarding` | `{ seen }` | `{ msg }` |
| POST | `/me/test-telegram` | `{ chat_id }` | `{ msg }` |
| GET | `/me/telegram/link` | — | `{ link }` (Deep Link com token 10 min) |
| GET | `/me/telegram/status` | — | `{ connected, chat_id }` |
| POST | `/me/telegram/disconnect` | — | `{ msg }` |

### Serviços (`/services`)

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/services` | — | `Service[]` |
| PUT | `/services` | `Service[]` | `{ msg }` (substitui todos os serviços) |

### Disponibilidade (`/availability`)

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/availability` | — | `{ workingHours, blockedDates, intervalMinutes, availableMonths }` |
| PUT | `/availability` | `{ workingHours, intervalMinutes, blockedDates, availableMonths }` | `{ msg }` |

### Datas Bloqueadas (`/blocked-dates`)

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/blocked-dates` | — | `BlockedDate[]` |
| POST | `/blocked-dates` | `{ date, reason, startTime?, endTime? }` | `{ id }` |
| DELETE | `/blocked-dates/:id` | — | `{ msg }` |

### Agendamentos (`/appointments`)

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/appointments` | Query: `from?`, `to?`, `history?`, `page?`, `limit?`, `source?` | `{ items: Appointment[], pagination: { total, page, limit, hasMore } }` |
| PATCH | `/appointments/:id/status` | `{ status }` | `{ msg }` |
| DELETE | `/appointments/:id` | — | `{ msg }` (soft delete) |
| POST | `/appointments/bulk-delete` | `{ ids: number[] }` | `{ msg }` |
| POST | `/appointments/create` | `{ professional_id, serviceId, serviceName, startAt, duration, clientName, clientPhone, clientEmail? }` | `{ id }` (endpoint público, sem auth) |

### Clientes / CRM (`/clients`)

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/clients` | Query: `search?` | `Client[]` |
| POST | `/clients` | `{ name, phone, email? }` | `{ msg }` |
| DELETE | `/clients/:id` | — | `{ msg }` |

### Administração (`/admin`) — requer role `admin` ou `super_admin`

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/admin/profiles` | — | `User[]` com métricas de saúde |
| PATCH | `/admin/profiles/:id` | Campos editáveis da conta + email | `{ msg }` |
| POST | `/admin/profiles/:id/renew` | `{ months }` | `{ newExpiryDate }` |
| POST | `/admin/users` | `{ email, password, companyName, ownerName, contactPhone?, planType?, country?, timezone?, currency?, phone_country_code?, hotmartUrl? }` | `{ id }` |
| DELETE | `/admin/users/:id` | — | `{ msg }` (cascade delete) |

### Público (`/public`) — sem autenticação

| Método | Path | Parâmetros | Retorno |
|---|---|---|---|
| GET | `/public/profile/:id` | — | `{ profile, services, availability, appointments }` |
| POST | `/public/view/:id` | — | `{ success }` (incrementa page_views) |
| POST | `/public/log-error` | `{ message, stack?, componentStack?, url?, userAgent?, filename?, lineno? }` | `{ success }` |

### Telegram Webhook (`/telegram-webhook`)

| Método | Path | Descrição |
|---|---|---|
| POST | `/telegram-webhook` | Recebe updates do Telegram, processa `/start TOKEN` para Deep Linking |

---

## Variáveis de Ambiente (`.env`)

```dotenv
# Banco de dados
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=nome_do_banco
DB_USER=usuario_mysql
DB_PASS=senha_mysql
DB_CHARSET=utf8mb4

# Aplicação
API_VERSION=1.0.0
DEBUG_MODE=false          # true apenas em desenvolvimento (habilita debug.log)

# Telegram — Notificações de agendamento
TELEGRAM_BOT_TOKEN=       # Token do bot oficial do sistema (@Cpagendaprobot)

# Telegram — Monitoramento de erros (bot separado)
TELEGRAM_MONITOR_TOKEN=   # Token do bot dedicado a alertas de erro
TELEGRAM_ERROR_CHAT_ID=   # Chat ID do administrador do sistema para receber alertas
TELEGRAM_ADMIN_CHAT_ID=   # Chat ID alternativo para notificações administrativas

# SMTP — E-mail transacional
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=email@dominio.com
SMTP_PASSWORD=senha_smtp
SMTP_FROM=noreply@dominio.com
SMTP_FROM_NAME=CP Agenda Pro
```

---

## Pipeline de Deploy (GitHub Actions)

O arquivo `.github/workflows/deploy.yml` dispara automaticamente a cada `git push` na branch `main`.

**Fluxo completo:**

```
git push origin main
        │
        ▼
1. Checkout do código (actions/checkout@v4)
        │
        ▼
2. Configurar Node.js 20
        │
        ▼
3. npm install && npm run build
   → Vite compila o React/TypeScript para /dist
   → esbuild remove console.log e debugger
   → target ES2015 para compatibilidade
        │
        ▼
4. Configurar PHP 8.3 + Composer v2
        │
        ▼
5. composer install --optimize-autoloader (para PHPStan)
        │
        ▼
6. PHPStan analyse (larastan)
   ⛔ Se houver erro de tipagem → DEPLOY CANCELADO
        │
        ▼
7. Gerar .env de produção a partir dos GitHub Secrets
   (nunca commitar segredos no repositório)
        │
        ▼
8. Configurar chave SSH (deploy_key)
        │
        ▼
9. Verificar identidade do projeto na VPS
   (cat /var/www/cpagendapro/.project-id deve ser "cpagenda-jp-v1")
   ⛔ Se diferente → DEPLOY CANCELADO (proteção anti-deploy errado)
        │
        ▼
10. rsync frontend (dist/ → /var/www/cpagendapro/public/)
    --delete: remove arquivos obsoletos
        │
        ▼
11. rsync backend (api/, database/, migrate.php, .env, composer.json)
    --exclude=vendor/
        │
        ▼
12. SSH na VPS:
    a. chown -R deploy:www-data (PHP-FPM lê o .env)
    b. chmod 640 .env
    c. composer install --no-dev --optimize-autoloader
    d. php migrate.php (migrações idempotentes)
    e. /home/deploy/bin/safe-deploy-jp.sh
       → backup, permissões e nginx/php-fpm reload
        │
        ▼
"Deploy concluído com sucesso"
```

---

## Comandos de Build e Execução

```bash
# Instalar dependências Node
npm install

# Servidor de desenvolvimento (hot reload)
npm run dev

# Build de produção
npm run build

# Pré-visualização do build
npm run preview

# Análise estática PHP (backend/)
cd backend && ./vendor/bin/phpstan analyse

# Instalar dependências PHP
cd backend && composer install

# Rodar migrações
php backend/migrate.php
```

---

# Bloco 4 — Regras de Negócio, Permissões e Fluxos de Exceção

## Perfis de Acesso

### `client` (Profissional)
- Acessa o painel com abas: Agendamentos, Disponibilidade, Serviços, Clientes, Histórico, Minha Conta
- Visualiza e gerencia apenas os dados da própria conta (`account_id` fixado na sessão)
- Pode atualizar o próprio perfil, serviços, disponibilidade e agendamentos
- Pode conectar/desconectar o Telegram
- **Não pode** acessar dados de outros profissionais
- Ao ter conta `blocked` ou `expired`: cai na `BlockedScreen` e não pode acessar nenhuma funcionalidade

### `admin` / `super_admin`
- Acessa o `AdminDashboard` com lista de todos os clientes (role `client`)
- Pode criar novos profissionais (cria conta + usuário atomicamente)
- Pode editar dados de qualquer conta: nome, e-mail, plano, status, localização, faturas
- Pode renovar planos: soma meses à data de expiração vigente (ou à data atual se já expirado)
- Pode bloquear/desbloquear acesso (`accountStatus`)
- Pode excluir profissional (cascade deleta todos os dados relacionados)
- **Verificação no backend:** `admin.php` rejeita com HTTP 403 qualquer usuário cuja role seja diferente de `admin` ou `super_admin`

---

## Regras de Negócio Críticas

### Conflito de Horário
- A verificação usa sobreposição de intervalos: `start_at < newEnd AND end_datetime > newStart`
- Executa dentro de transação para serializar acessos simultâneos
- Retorna HTTP 409 se houver conflito: "Este horário acabou de ser reservado. Por favor, escolha outro."
- Agendamentos com status `canceled`, `rejected` ou com `deleted_at IS NOT NULL` **não contam** para conflito

### Buffer de Limpeza
- `end_datetime = startAt + duration + cleaning_buffer_min`
- O buffer é somado no momento da criação do agendamento
- A consulta de slots disponíveis na página pública usa `end_datetime` para marcar os intervalos ocupados
- Um agendamento de 45 min com buffer de 15 bloqueia 60 min no calendário

### Datas Bloqueadas
- Bloqueio de dia inteiro: `start_time IS NULL AND end_time IS NULL`
- Bloqueio parcial: `TIME(newStart) < end_time AND TIME(newEnd) > start_time`
- A verificação ocorre antes da verificação de conflito de agendamentos, com prioridade
- Retorna HTTP 400: "Esta reserva entra em conflito com uma data ou horário bloqueado."

### Antecedência Mínima de 1 Dia
- Não é possível agendar para o dia atual (comparação de datas no fuso horário da conta)
- Não é possível agendar em datas passadas
- A verificação usa `DateTimeZone` da conta para calcular "hoje" corretamente

### Plano Expirado
- Contas com `status != 'active'` retornam a página pública com `{ services: [], availability: {}, appointments: [] }` — sem dados sensíveis
- Profissional logado com conta bloqueada/expirada é redirecionado para `BlockedScreen`
- O motivo é diferenciado: "Conta bloqueada" vs "Plano vencido"

### `must_change_password`
- Quando ativo, o sistema intercepta o login antes de mostrar o painel e exibe `ForcePasswordChange`
- Após trocar a senha, o campo é zerado no banco e na sessão em memória (`$_SESSION['user']['must_change_password'] = false`), sem necessidade de novo login
- Novos profissionais criados pelo admin têm esse campo ativado automaticamente

### Disponibilidade por Mês (`availableMonths`)
- O calendário público só exibe meses que estejam na lista `availableMonths`
- Padrão: todos os 12 meses disponíveis
- Meses não incluídos na lista bloqueiam completamente os dias correspondentes no calendário

---

## Fluxos de Exceção

### Sessão Expirada
- O interceptor Axios (`apiClient.ts`) detecta HTTP 401
- O erro propaga para o componente, que chama `setSession(null)`
- O App renderiza a tela de login (`LoginScreen`) com os dados limpos via `clearAllStates()`

### Servidor Indisponível (Network Error)
- Erros de rede durante o polling de 15 segundos são capturados pelo `.catch(() => {})` e silenciados
- A lista de agendamentos não é atualizada — mantém o último estado conhecido
- Não gera alerta no Telegram de monitoramento
- Erro exibido ao usuário apenas em ações explícitas (ex: clicar em "salvar")

### Banco de Dados Fora do Ar
- O roteador `index.php` tem rota de diagnóstico `GET /db` que tenta `SELECT 1`
- Em caso de falha, chama `Monitor::critical('Falha na conexão com o banco de dados', ...)` enviando alerta imediato ao Telegram
- Retorna HTTP 500 ao cliente
- Todas as queries subsequentes lançam exceções que são capturadas pelo handler global do `Monitor`

### Erro Inesperado no PHP
- `Monitor::register()` instala `set_exception_handler` para exceções não tratadas
- `register_shutdown_function` captura erros fatais (`E_ERROR`, `E_PARSE`, `E_CORE_ERROR`, `E_COMPILE_ERROR`, `E_USER_ERROR`)
- O alerta inclui: ambiente, timestamp, método+URI da requisição, IP, mensagem de erro, arquivo+linha e stack trace resumido (6 frames)
- Resposta ao cliente: HTTP 500 com `{ ok: false, error: "Internal server error" }`

### Crash do React (Frontend)
- O `ErrorBoundary` (classe React) envolve toda a aplicação
- `componentDidCatch` captura o erro e chama `reportErrorToBackend` com message, stack, componentStack, URL e userAgent
- O backend encaminha ao `Monitor::clientError()` que formata e envia ao Telegram
- O usuário vê uma tela de "Ops! Algo deu errado." com botão para recarregar
- Limite de 5 erros por sessão (`MAX_CLIENT_ERRORS_REPORTED = 5`) para evitar spam

### Erro JS Global (window.onerror e unhandledrejection)
- Handlers registrados no `useEffect` do `App` capturam qualquer erro JS não tratado
- Mesma função `reportErrorToBackend` é chamada com os dados disponíveis
- O app **não** é desmontado — apenas o erro é reportado silenciosamente
- O handler de `unhandledrejection` captura Promises rejeitadas sem `.catch()`

---

## Segurança

- **Senhas:** armazenadas com `password_hash($pass, PASSWORD_DEFAULT)` (bcrypt) e verificadas com `password_verify()`
- **Sessões:** cookie com flags `HttpOnly`, `Secure`, `SameSite=Lax`; sessão regenerada no login (`session_regenerate_id(true)`)
- **CORS:** allowlist explícita — apenas `https://cpagendapro.creativeprintjp.com`, `http://localhost:5173` e `http://localhost:5174`; origens não listadas não recebem header CORS
- **Rate limiting — login:** 10 tentativas por IP em 15 minutos (HTTP 429)
- **Rate limiting — reset de senha:** 5 pedidos por e-mail em 10 minutos; resposta sempre 200 para não revelar se o e-mail existe
- **Rate limiting — implementação:** arquivo com lock exclusivo `LOCK_EX` para evitar condição de corrida TOCTOU
- **HTTPS:** obrigatório em produção (cookie `Secure`, links hardcoded com `https://`)
- **Colunas explícitas:** `me.php` usa `SELECT name, status, ...` em vez de `SELECT *` em tabelas sensíveis
- **Tokens:** reset de senha gerado com `bin2hex(random_bytes(32))` (criptograficamente seguro)
- **Token Telegram:** gerado com `bin2hex(random_bytes(16))`, validade de 10 minutos, invalidado após uso
- **Validação de tipos:** campos de configuração regional (`plan_type`, `country`, `currency`, `phone_country_code`, `timezone`) são validados contra whitelist antes de qualquer UPDATE
- **DEBUG_MODE:** desativado por padrão (`false`); ativado apenas via `.env` em desenvolvimento — nunca expõe logs em produção
- **Segredos:** nunca commitar no repositório; gerados pelo GitHub Actions a partir de Secrets e enviados à VPS via rsync + chmod 640

---

## Monitoramento

### `Monitor.php` — Backend

- **Bot dedicado:** usa `TELEGRAM_MONITOR_TOKEN` (separado do bot de agendamentos)
- **Destino:** `TELEGRAM_ERROR_CHAT_ID` (chat pessoal do administrador)
- **Rate limiting:** alertas idênticos (mesmo MD5 de mensagem+arquivo+linha) são suprimidos por **5 minutos** entre envios
- **Timeout:** todas as chamadas ao Telegram têm timeout de 5 segundos para não bloquear a resposta ao usuário
- **Método:** `@file_get_contents()` com `ignore_errors: true` — erros no monitor nunca crasham a aplicação
- **Conteúdo do alerta:** ambiente (DEV/PRODUÇÃO), timestamp, método+host+URI, IP do cliente, mensagem de erro, arquivo+linha, stack trace resumido (6 frames mais relevantes)
- **Erros de negócio excluídos:** conflito de horário, data passada, bloqueio de data — são HTTP 400 esperados, não geram alerta

### Erros de Frontend

- **Endpoint:** `POST /public/log-error` (sem autenticação para funcionar antes do login)
- **Captura:** `window.onerror`, `window.addEventListener('unhandledrejection')`, `ErrorBoundary.componentDidCatch`
- **Conteúdo:** URL, user-agent, nome do arquivo JS, número de linha, stack trace JS (até 1.000 chars), component stack React (até 1.000 chars)
- **Throttle no cliente:** máximo de 5 erros reportados por carregamento de página (`MAX_CLIENT_ERRORS_REPORTED`)

---

## Backup e Deploy

- **Backup:** executado via `safe-deploy-jp.sh` na VPS antes de cada deploy (script externo, não incluído no repositório)
- **Deploy incremental:** `rsync -az --delete` para o frontend garante que arquivos removidos do repositório são removidos da VPS
- **Backend sem vendor:** o diretório `vendor/` não é enviado via rsync; o `composer install --no-dev` é executado diretamente na VPS após o envio
- **Migrações idempotentes:** `migrate.php` usa `IF NOT EXISTS` / `ALTER TABLE ... IF NOT EXISTS column` para ser seguro de rodar em todo deploy
- **Sessões PHP:** armazenadas em `/home/deploy/php-sessions` para sobreviver a reloads do PHP-FPM e ao limpador automático do systemd (que padrão limpa a cada 24 minutos)

---

# Sumário Executivo

## 5 Argumentos de Venda para Anúncios e E-mails de Marketing

---

### Argumento 1 — Pare de gerenciar agenda pelo WhatsApp
> "Cada mensagem de cliente pedindo horário custa seu tempo — e seu tempo vale dinheiro. O CP Agenda Pro coloca uma página profissional no ar em minutos: o cliente vê seus serviços, escolha o horário e confirma sozinho. Você acorda com a agenda cheia."

---

### Argumento 2 — Receba notificação instantânea no Telegram
> "Novos agendamentos chegam diretamente no seu Telegram — com nome, telefone, serviço e horário já formatados. Sem abrir painel, sem checar e-mail. Em dois cliques você confirma e um link de WhatsApp pré-pronto já está esperando para você avisar o cliente."

---

### Argumento 3 — Sem conflito de horário, nunca mais
> "O sistema verifica automaticamente conflitos antes de confirmar qualquer agendamento — incluindo o tempo de limpeza entre atendimentos. Duas pessoas nunca ocupam o mesmo slot. Você bloqueia feriados e férias em segundos, e o calendário se atualiza na hora."

---

### Argumento 4 — Sua página, sua identidade
> "Logo, foto de capa, cores da sua marca, descrição, título dos serviços com foto e preço — tudo personalizável pelo painel, sem precisar de designer ou programador. Em menos de 10 minutos sua página pública está com a sua cara, pronta para compartilhar no Instagram e no WhatsApp."

---

### Argumento 5 — Monitoramento e segurança de nível profissional
> "Segurança bancária nos dados dos seus clientes: senhas criptografadas, cookies seguros, limite de tentativas de login e isolamento total entre contas. E se algo incomum acontecer no sistema, você recebe um alerta no Telegram antes de qualquer cliente perceber — isso é tecnologia trabalhando por você, não contra você."

---

*Relatório gerado com base na leitura completa do código-fonte do repositório `cp_agenda_pro`. Todas as funcionalidades, regras e métricas aqui documentadas foram verificadas diretamente nos arquivos listados. Nenhuma funcionalidade foi inventada ou suposta.*
