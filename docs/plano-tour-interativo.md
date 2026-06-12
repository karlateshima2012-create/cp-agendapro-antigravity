# Plano de Implementação — Tour Interativo (Spotlight + Tooltips)
## CP Agenda Pro — Painel da Profissional
**Status:** Aguardando aprovação
**Estimativa:** 4–6 dias úteis · 3 fases

---

> **NENHUM CÓDIGO ALTERADO.**
> Este documento é apenas o plano. A implementação começa somente após aprovação.

---

## Contexto e Diferença do Onboarding Atual

O sistema já tem um `OnboardingModal` — um modal de slides que aparece no primeiro login.
Ele **explica** o sistema mas não **mostra** nada: a profissional lê sobre a aba de horários,
mas não sabe onde ela fica.

O **tour interativo** proposto é fundamentalmente diferente:
- Escurece toda a tela e **abre um spotlight** (círculo/retângulo de luz) sobre o elemento real
- **Navega automaticamente** pelas abas (appointments, availability, services, account)
- Mostra um **tooltip posicionado ao lado do elemento** com instrução e botão Próximo
- A profissional vê o elemento real, no lugar certo, com o contexto certo

O tour **substitui e evolui** o onboarding atual — ou pode ser acionado manualmente
via botão "Ver tour" nas configurações para profissionais que queiram rever.

---

## Arquitetura Técnica

### Abordagem: Componente Próprio (sem biblioteca externa)

Optamos por implementação própria em vez de Intro.js / Driver.js por três razões:
1. **Integração com o estado React** — o tour precisa chamar `setActiveTab` para navegar entre abas
2. **Design system** — tooltips e spotlight seguirão exatamente o estilo Tailwind do sistema
3. **Zero nova dependência** — sem risco de conflito ou peso extra no bundle

### Mecanismo de Spotlight

O spotlight é criado por um `<div>` de overlay escuro com um **recorte dinâmico**
usando `clipPath: 'path(...)'` calculado em tempo real a partir do `getBoundingClientRect()`
do elemento alvo. Isso cria o efeito de "buraco" luminoso sem mover os elementos da UI.

```
┌─────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← overlay escuro
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░┌─────────────────────┐░░░░░░░░░░░░░░░│
│░░░░░░░│   ELEMENTO REAL     │░░░░░░░░░░░░░░░│  ← spotlight (sem overlay)
│░░░░░░░│   visível e vivo    │░░░░░░░░░░░░░░░│
│░░░░░░░└─────────────────────┘░░░░░░░░░░░░░░░│
│░░░░░░░░░░░    ┌──────────────────────────┐  │
│░░░░░░░░░░░    │ Tooltip com instrução    │  │  ← tooltip posicionado
│░░░░░░░░░░░    │ [Voltar]  [Próximo →]    │  │
│░░░░░░░░░░░    └──────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Posicionamento dinâmico do Tooltip

O tooltip detecta a posição do spotlight no viewport e escolhe automaticamente
onde se posicionar (abaixo, acima, direita, esquerda) para não sair da tela.
Em mobile, o tooltip vai sempre para baixo do spotlight ou fixo no rodapé.

### Âncoras nos Elementos

Cada elemento-alvo recebe um atributo `data-tour="nome-do-passo"`.
O tour engine busca o elemento pelo atributo, lê sua posição e posiciona o spotlight.
**Não altera nenhum estilo ou comportamento dos elementos** — apenas lê a posição.

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `components/InteractiveTour.tsx` | Componente principal — engine do tour (spotlight, tooltip, navegação) |
| `hooks/useTourEngine.ts` | Hook de lógica: gerencia passo atual, posição, scroll, tab switching |

## Arquivos a Modificar

| Arquivo | O que muda |
|---------|-----------|
| `components/ClientDashboard.tsx` | Adicionar `<InteractiveTour>`, passar `setActiveTab` para o tour, botão "Ver tour novamente" |
| `components/AppointmentsTab.tsx` | Adicionar `data-tour` em: botão confirmar, botão lista, botão calendário, card de agendamento |
| `components/AvailabilityTab.tsx` | Adicionar `data-tour` em: seção de dias da semana, campo de horário, botão salvar |
| `components/AccountTab.tsx` | Adicionar `data-tour` em: seção link público, seção Telegram, seção foto de perfil |
| `backend/api/routes/me.php` | Adicionar campo `tour_seen` (separado do `onboarding_seen`) |
| `backend/database/migrations/0015_add_tour_seen.sql` | Nova coluna `tour_seen TINYINT(1) DEFAULT 0` |

---

## Os 10 Passos do Tour

O tour navega pelas abas automaticamente e destaca elementos reais na ordem pedagógica
mais lógica para uma profissional que acabou de fazer login pela primeira vez.

### Passo 1 — Boas-vindas (sem spotlight)
- **Aba:** qualquer (nenhuma navegação)
- **Elemento:** nenhum spotlight — tela inteira escurecida com card central
- **Conteúdo:** "Vamos te mostrar o sistema em 2 minutos. Você vai ver cada parte no lugar certo."
- **Tipo:** card de introdução com botão "Iniciar Tour" e "Pular"

### Passo 2 — Navegação lateral / menu
- **Aba:** permanece na aba atual
- **Elemento:** `data-tour="nav-sidebar"` — o menu lateral (desktop) ou barra inferior (mobile)
- **Tooltip:** "Essa é sua navegação principal. Cada aba tem uma função. Vamos percorrê-las."
- **Posição tooltip:** direita do menu (desktop) / acima da barra (mobile)

### Passo 3 — Aba Configurações → Perfil e Link Público
- **Navegação automática:** `setActiveTab('account')`
- **Elemento:** `data-tour="account-public-link"` — seção "Minha Página Pública"
- **Tooltip:** "Aqui está o link que você compartilha com seus clientes. Copie e coloque na bio do Instagram."
- **Detalhe:** seta animada piscando apontando para o botão de copiar link
- **Posição tooltip:** abaixo da seção

### Passo 4 — Aba Configurações → Telegram
- **Aba:** permanece em `account`
- **Elemento:** `data-tour="account-telegram"` — seção de configuração do Telegram
- **Scroll automático** até o elemento se estiver fora da tela
- **Tooltip:** "Configure aqui o Telegram para receber notificações de novos agendamentos na hora em que acontecerem."
- **Posição tooltip:** abaixo da seção

### Passo 5 — Aba Configurações → Foto de Perfil
- **Aba:** permanece em `account`
- **Elemento:** `data-tour="account-profile-image"` — campo de foto de perfil
- **Tooltip:** "Uma foto de perfil transmite confiança. Sua foto aparece no topo da página pública."
- **Posição tooltip:** direita ou abaixo

### Passo 6 — Aba Horários
- **Navegação automática:** `setActiveTab('availability')`
- **Elemento:** `data-tour="availability-working-hours"` — seção de dias e horários
- **Tooltip:** "Aqui você define em quais dias e horários atende. O cliente só vê os slots que você liberar."
- **Posição tooltip:** direita ou abaixo

### Passo 7 — Aba Agenda → Visualização em Grade
- **Navegação automática:** `setActiveTab('appointments')`
- **Elemento:** `data-tour="appointments-grid"` — área principal de agendamentos
- **Tooltip:** "Esta é sua agenda. Cada card é um agendamento. Toque em um agendamento para confirmar, cancelar ou enviar mensagem."
- **Posição tooltip:** abaixo do header da lista

### Passo 8 — Aba Agenda → Confirmar Agendamento
- **Aba:** permanece em `appointments`
- **Elemento:** `data-tour="appointment-confirm-btn"` — botão de confirmar em um card
- **Tooltip:** "Quando um cliente agenda, você recebe aqui. Confirme para o cliente saber que está na agenda."
- **Seta animada** pulsante apontando para o botão confirmar
- **Posição tooltip:** ao lado do botão

### Passo 9 — Aba Agenda → Modo Lista
- **Aba:** permanece em `appointments`
- **Elemento:** `data-tour="appointments-view-list"` — botão de trocar para modo lista
- **Tooltip:** "Prefere ver todos os agendamentos em lista? Clique aqui."
- **Ação opcional:** clicar automaticamente no botão para demonstrar a mudança de view
- **Posição tooltip:** abaixo do botão

### Passo 10 — Aba Agenda → Modo Calendário
- **Aba:** permanece em `appointments`
- **Elemento:** `data-tour="appointments-view-calendar"` — botão de calendário
- **Tooltip:** "Ou veja em formato de calendário mensal — ideal para ter uma visão do mês inteiro."
- **Ação opcional:** clicar automaticamente para demonstrar o calendário
- **Posição tooltip:** abaixo do botão

### Passo 11 — Conclusão (sem spotlight)
- **Elemento:** nenhum spotlight — card central
- **Conteúdo:** "Você conheceu as partes principais! Agora configure seus serviços e horários e compartilhe seu link."
- **Botões:** "Ver Serviços" (navega para `services`) e "Fechar tour"
- **Marca `tour_seen = true`** no banco via API

---

## Fase 1 — Engine e Estrutura Base
**Duração:** 2 dias

### Tarefa 1.1 — Migration `0015_add_tour_seen.sql`
```sql
ALTER TABLE cp_agenda_accounts
  ADD COLUMN tour_seen TINYINT(1) NOT NULL DEFAULT 0;
```
Separado de `onboarding_seen` para que o tour possa ser reiniciado independentemente.

### Tarefa 1.2 — Backend: expor e salvar `tour_seen`
- `me.php`: incluir `tour_seen` no SELECT e no campo `$allowed`
- `types.ts`: adicionar `tourSeen?: boolean` em `AccountInfo`
- `App.tsx`: mapear `tour_seen` → `tourSeen` junto com `onboarding_seen`

### Tarefa 1.3 — `hooks/useTourEngine.ts`
Hook responsável por toda a lógica, isolando-a do componente visual:

```typescript
interface TourStep {
  id: string;                  // identificador único
  anchor: string;              // valor do data-tour="..." alvo
  tab?: TabType;               // aba para navegar antes de mostrar
  title: string;               // título do tooltip
  body: string;                // texto explicativo
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  spotlightPadding?: number;   // padding ao redor do elemento iluminado
  autoAction?: () => void;     // ação automática (ex: trocar view mode)
  arrowPulse?: boolean;        // mostrar seta pulsante animada
  type?: 'intro' | 'step' | 'outro'; // tipo do passo (sem spotlight / com / card final)
}

// Retorno do hook:
// - currentStep, totalSteps
// - spotlightRect: DOMRect do elemento alvo
// - tooltipPosition: { top, left, placement }
// - isVisible, isTransitioning
// - goNext(), goPrev(), skipTour(), restartTour()
```

**Responsabilidades do hook:**
- Chamar `setActiveTab` (recebido como parâmetro) para trocar a aba
- Esperar a aba renderizar (100ms de delay) antes de buscar o `data-tour` anchor
- Calcular `getBoundingClientRect()` do elemento alvo
- Recalcular posição em `resize` e `scroll`
- Fazer `scrollIntoView({ behavior: 'smooth', block: 'center' })` automaticamente
- Salvar progresso em `localStorage` para não reiniciar se fechar acidentalmente
- Chamar `onComplete()` ao final para marcar `tour_seen` na API

### Tarefa 1.4 — `components/InteractiveTour.tsx`
Componente visual puro — recebe os dados do hook e renderiza:

**Sub-componentes internos:**
- `<TourOverlay>` — div fullscreen com `pointer-events: none`, cor `rgba(0,0,0,0.72)`, `clipPath` dinâmico criando o "buraco" do spotlight
- `<TourSpotlight>` — borda de highlight ao redor do elemento (ring animado)
- `<TourTooltip>` — card branco com título, texto, contador de passos, botões Voltar/Próximo
- `<TourArrow>` — SVG animado (pulse) quando `arrowPulse: true`, apontando do tooltip para o elemento
- `<TourIntroCard>` — card de boas-vindas para o passo 1 (sem spotlight)
- `<TourOutroCard>` — card de conclusão para o passo 11

**Design do Tooltip:**
```
╔════════════════════════════════════════╗
║  Passo 3 de 11          [✕ Pular tour] ║
║  ─────────────────────────────────────  ║
║  Minha Página Pública                  ║
║                                        ║
║  Aqui está o link que você compartilha ║
║  com seus clientes. Copie e coloque    ║
║  na bio do Instagram.                  ║
║                                        ║
║  [← Voltar]              [Próximo →]   ║
╚════════════════════════════════════════╝
```

**Estilo:**
- Background: `white`, border-radius `rounded-2xl`, sombra `shadow-2xl`
- Título: `font-black text-gray-900 text-sm`
- Texto: `text-gray-500 text-xs leading-relaxed`
- Botão Próximo: `bg-primary text-white` — mesma identidade do sistema
- Seta: `<svg>` animada com `animate-bounce` ou keyframe custom

---

## Fase 2 — Âncoras e Integração com Abas
**Duração:** 1–2 dias

### Tarefa 2.1 — Adicionar `data-tour` em `AppointmentsTab.tsx`

| Elemento | `data-tour` |
|----------|------------|
| Container principal da lista de agendamentos | `appointments-grid` |
| Botão confirmar (primeiro card com status pending) | `appointment-confirm-btn` |
| Botão de view modo lista | `appointments-view-list` |
| Botão de view modo calendário | `appointments-view-calendar` |

### Tarefa 2.2 — Adicionar `data-tour` em `AvailabilityTab.tsx`

| Elemento | `data-tour` |
|----------|------------|
| Container da lista de dias da semana | `availability-working-hours` |
| Botão de salvar disponibilidade | `availability-save-btn` |

### Tarefa 2.3 — Adicionar `data-tour` em `AccountTab.tsx`

| Elemento | `data-tour` |
|----------|------------|
| Seção "Minha Página Pública" (link + QR code) | `account-public-link` |
| Seção de configuração do Telegram | `account-telegram` |
| Seção de foto de perfil | `account-profile-image` |

### Tarefa 2.4 — Adicionar `data-tour` em `ClientDashboard.tsx`

| Elemento | `data-tour` |
|----------|------------|
| Menu lateral / nav (desktop) | `nav-sidebar` |

### Tarefa 2.5 — Integrar `<InteractiveTour>` em `ClientDashboard.tsx`

```typescript
// ClientDashboard.tsx recebe um novo prop opcional (ou gerencia internamente):
const [showTour, setShowTour] = useState(!account.tourSeen);

// Passa setActiveTab para o tour engine:
<InteractiveTour
  isActive={showTour}
  onComplete={async () => {
    setShowTour(false);
    await onUpdateAccount({ tourSeen: true });
  }}
  onSkip={async () => {
    setShowTour(false);
    await onUpdateAccount({ tourSeen: true });
  }}
  setActiveTab={setActiveTab}
/>
```

### Tarefa 2.6 — Botão "Ver tour novamente" em `AccountTab.tsx`
Na seção de configurações da conta, adicionar um botão discreto:
```
[ Ver tour de configuração novamente ]
```
Que chama `onUpdateAccount({ tourSeen: false })` e recarrega — retornando ao início do tour.

---

## Fase 3 — Refinamentos e Persistência
**Duração:** 1–2 dias

### Tarefa 3.1 — Persistência com `localStorage`
Se a profissional fechar o browser no passo 6, ao reabrir o tour recomeça do passo 6.
- Chave: `cpagenda_tour_step_${userId}`
- Limpar ao completar ou pular o tour

### Tarefa 3.2 — Responsividade mobile
- Em telas menores que 768px (mobile), o tooltip vai fixo no rodapé
  (`position: fixed; bottom: 80px; left: 16px; right: 16px`) acima da barra de navegação
- O spotlight continua dinâmico no elemento
- A seta não aparece no mobile (tooltip não fica ao lado, fica embaixo)

### Tarefa 3.3 — Transição suave entre passos
- Ao avançar para o próximo passo: fade-out do spotlight atual → navegação de aba (se necessário) → fade-in do novo spotlight
- Duração total da transição: 350ms
- Usar `isTransitioning` do hook para desabilitar botões durante transição

### Tarefa 3.4 — Escape e click fora
- Pressionar `Esc` pausa/pergunta se quer sair (não sai imediatamente, para evitar acidente)
- Clicar fora do tooltip mostra um leve "shake" no tooltip (não fecha)
- Botão "Pular tour" sempre visível

### Tarefa 3.5 — Acessibilidade
- `role="dialog"` e `aria-modal="true"` no overlay
- `aria-label` em todos os botões de navegação
- `aria-live="polite"` no tooltip para leitores de tela

---

## Relação com o OnboardingModal Existente

O `OnboardingModal` atual **não é removido** — ele continua funcionando como antes,
controlado pelo `onboarding_seen`. O tour interativo é um **nível acima**: é acionado
por um campo separado `tour_seen`. A profissional pode:

1. Passar pelo `OnboardingModal` (slides de texto) → marca `onboarding_seen`
2. Logo em seguida, o tour interativo inicia → marca `tour_seen`

Ou, se preferir, os dois podem ser unificados: substituir completamente o
`OnboardingModal` pelo tour interativo, usando apenas um campo `tour_seen`.
**Essa decisão fica para aprovação antes da implementação.**

---

## Fluxo Visual Completo (Storyboard)

```
Login → Tela carrega
         │
         ├── OnboardingModal aparece (atual — slides) ──→ "Pular" ou "Acessar"
         │
         └── Após OnboardingModal fechar → InteractiveTour inicia
                │
                ├── Passo 1: Card boas-vindas (sem spotlight)
                │           [ Pular ]     [ Iniciar Tour → ]
                │
                ├── Passo 2: Spotlight no menu lateral
                │           Tooltip: "Essa é sua navegação..."
                │
                ├── Passo 3: Navega → account tab
                │           Spotlight na seção "Página Pública"
                │           Seta pulsante no botão "Copiar Link"
                │
                ├── Passo 4: Scroll → seção Telegram
                │           Spotlight na seção Telegram
                │
                ├── Passo 5: Spotlight na seção foto de perfil
                │
                ├── Passo 6: Navega → availability tab
                │           Spotlight nos dias da semana
                │
                ├── Passo 7: Navega → appointments tab
                │           Spotlight na área de agendamentos
                │
                ├── Passo 8: Spotlight no botão "Confirmar" de um card
                │           Seta pulsante no botão
                │
                ├── Passo 9: Spotlight no botão modo Lista
                │           (opcional: troca automaticamente para lista)
                │
                ├── Passo 10: Spotlight no botão modo Calendário
                │            (opcional: troca automaticamente para calendário)
                │
                └── Passo 11: Card de conclusão
                             [ Ver Serviços ]  [ Concluir ]
                             → marca tour_seen = true no banco
```

---

## Estimativa de Esforço

| Fase | Descrição | Dias |
|------|-----------|------|
| 1 | Engine (`useTourEngine.ts`) + Componente visual (`InteractiveTour.tsx`) + Migration | 2 |
| 2 | Âncoras `data-tour` nos componentes + Integração no `ClientDashboard` + botão "Ver tour novamente" | 1–2 |
| 3 | Mobile, transições, persistência, acessibilidade | 1–2 |
| **Total** | | **4–6 dias** |

---

## Pontos de Decisão para Aprovação

1. **OnboardingModal:** manter os dois (modal de slides + tour interativo) ou substituir o modal pelo tour?
2. **Passo de serviços:** incluir a aba de serviços no tour ou manter o foco nas 4 áreas pedidas (configurações, horários, página pública, telegram, agenda)?
3. **Ações automáticas:** o tour deve apenas destacar os botões de lista/calendário ou deve clicar neles automaticamente para demonstrar?
4. **Gatilho de reinício:** o botão "Ver tour novamente" fica na aba Configurações ou em outro lugar?

---

> **Aguardando aprovação e definição de data de início.**
> Nenhum arquivo será alterado até a aprovação formal.

*Plano elaborado em 12 de junho de 2026.*
*Nenhuma alteração de código ou banco foi efetuada.*
