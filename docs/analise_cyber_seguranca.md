# Análise Completa de Cyber Segurança — CP Agenda Pro

Este documento apresenta uma auditoria detalhada da postura de segurança da informação, arquitetura de proteção e vulnerabilidades mitigadas ou potenciais no sistema **CP Agenda Pro**. O objetivo é garantir que o sistema permaneça resiliente contra ataques cibernéticos comuns (OWASP Top 10) e preserve a confidencialidade, integridade e disponibilidade dos dados dos inquilinos (Multi-tenant).

---

## 1. POSTURA GERAL DE SEGURANÇA E MATURIDADE

O **CP Agenda Pro** apresenta um nível de maturidade em cyber segurança **alto** para aplicações baseadas na stack React + PHP Vanilla em hospedagem VPS/Compartilhada. Isso é evidenciado pelas seguintes implementações estruturais:

*   **Isolamento Multi-tenant Estrito:** Todas as consultas no banco de dados utilizam a cláusula `account_id` parametrizada, impedindo o vazamento de dados entre profissionais (Invasão de Contas Cruzadas).
*   **Gestão de Sessões Segura:** Cookies de sessão PHP configurados com diretivas modernas (`HttpOnly`, `Secure`, `SameSite=Lax`), mitigando sequestro de sessões (Session Hijacking).
*   **Monitoramento Operacional Ativo:** Mecanismo global em PHP (`Monitor::register`) que intercepta erros fatais e exceções não tratadas no servidor ou no navegador (crashes de React) e envia relatórios estruturados ao canal do Telegram do desenvolvedor em tempo real.
*   **Remoção de Credenciais do Código:** Ausência de credenciais (SMTP, banco de dados, chaves de API) no repositório do Git, centralizadas integralmente no ambiente (`.env` local / GitHub Secrets).

---

## 2. ANÁLISE DOS VETORES DE ATAQUE (OWASP TOP 10)

### A1: Controle de Acesso Quebrado (Broken Access Control)
*   **Status de Proteção:** **Seguro**
*   **Mecanismos Ativos:**
    *   Métodos como `Auth::requireAuth()` bloqueiam o acesso a qualquer rota administrativa caso o usuário não possua sessão válida.
    *   A API do administrador (`admin.php`) exige verificação explícita do campo `role` (`admin` ou `super_admin`) antes de expor perfis ou liberar comandos de exclusão/renovação de planos.
    *   **Isolamento de Contas Inativas:** Se uma conta administrativa for desativada (plano expirado ou conta bloqueada), a rota pública de consulta de perfil (`public.php`) omite todos os dados de serviços, disponibilidade e histórico, retornando apenas informações básicas de suspensão.

### A2: Falhas Criptográficas (Cryptographic Failures)
*   **Status de Proteção:** **Seguro**
*   **Mecanismos Ativos:**
    *   Armazenamento de senhas no banco de dados realizado via hash criptográfico robusto `bcrypt` (`password_hash()` do PHP com sal automático).
    *   Tokens de redefinição de senha gerados através de fontes seguras de entropia do sistema operacional (`bin2hex(random_bytes(32))`), com expiração rígida de 1 hora.

### A3: Injeção (Injection - SQLi e Command Injection)
*   **Status de Proteção:** **Seguro**
*   **Mecanismos Ativos:**
    *   Utilização sistemática de *Prepared Statements* com parâmetros nomeados ou interrogações (`?`) via classe utilitária `Db.php` (driver PDO).
    *   Proibição do uso de `SELECT *` em tabelas com dados sensíveis (usuários e contas), selecionando explicitamente colunas públicas para evitar vazamentos acidentais.
    *   Higienização estrita de strings de entrada usadas em buscas textuais (CRM) e filtragem de campos permitidos (whitelist) no método PATCH de alteração de dados de perfil.

### A4: Design Inseguro (Insecure Design)
*   **Status de Proteção:** **Seguro**
*   **Mecanismos Ativos:**
    *   Antecedência mínima para reservas (1 dia útil) processada e validada de forma redundante tanto no frontend quanto diretamente no backend, evitando fraudes de horário.
    *   Uso de transações atômicas nativas do MySQL (`beginTransaction` / `commit`) no fluxo de agendamento de consultas. Isso previne condições de corrida (Race Conditions) onde dois clientes tentam marcar o mesmo intervalo de tempo.

### A5: Falhas de Configuração de Segurança (Security Misconfiguration)
*   **Status de Proteção:** **Seguro**
*   **Mecanismos Ativos:**
    *   Arquivos de depuração e scripts de manipulação direta de banco sem autenticação (`debug_env.php`, `debug_query.php`, `force_fix.php`) foram removidos do diretório de produção.
    *   Modo de debug controlado estritamente via constante `DEBUG_MODE` extraída do `.env`. Se for falso, erros brutos do PHP são logados de forma segura e omitidos na resposta da API pública.
    *   headers de segurança HTTP configurados no arquivo `.htaccess`:
        *   `X-Content-Type-Options: nosniff` (impede ataques de sniffing de MIME-type).
        *   `X-Frame-Options: DENY` (bloqueia clickjacking).
        *   `Referrer-Policy: strict-origin-when-cross-origin` (previne vazamento de URLs sensíveis).
        *   `Content-Security-Policy` restrito a scripts/imagens de origens autorizadas.

### A6: Vulnerabilidade de Componentes Desatualizados
*   **Status de Proteção:** **Seguro**
*   **Mecanismos Ativos:**
    *   Construído sobre React 19, Vite 6 e PHP 8.3 Vanilla, mantendo as versões de dependências atualizadas. Análise estática através de PHPStan garante integridade dos tipos e previne erros comuns de lógica de desenvolvimento.

---

## 3. PONTOS DE ATENÇÃO E INDICAÇÕES DE MELHORIA

Apesar da excelente postura defensiva, a análise detalhada da base de código revelou **um ponto de atenção operacional** que deve ser tratado para evitar comportamentos inesperados ou ataques de negação de serviço lógicos:

### ⚠️ Injeção de Tags HTML na API do Telegram (Mensagem com Formato Inválido)
*   **Arquivo Afetado:** [backend/api/routes/appointments.php](file:///Users/karlateshima/Developer/cp_agenda_pro/backend/api/routes/appointments.php#L165-L169)
*   **Descrição do Problema:**
    Ao notificar o profissional sobre um novo agendamento, o sistema monta a mensagem em formato HTML utilizando os dados fornecidos pelo cliente na reserva (`clientName` e `serviceName`), e envia via requisição cURL com o parâmetro `parse_mode=HTML`.
    Caso o cliente preencha seu nome com caracteres de formatação (ex: `Carlos <carlos@exemplo.com>` ou `<b>Carlos</b>`), a API do Telegram tentará interpretar as tags HTML. 
    Se a tag estiver mal formatada ou não for suportada (como um sinal de menor `<` isolado), a API do Telegram responderá com erro **HTTP 400 Bad Request** e a mensagem de notificação de agendamento **não será entregue ao profissional**. Além disso, permite *visual spoofing* (fazer a notificação parecer um alerta de erro crítico ou manipular a mensagem).
*   **Mitigação Recomendada:**
    Higienizar as variáveis `clientName` e `serviceName` com `htmlspecialchars` antes de injetá-las na mensagem do Telegram.
    
    ```php
    // Exemplo de correção no script appointments.php:
    $safeClientName = htmlspecialchars($clientName, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $safeServiceName = htmlspecialchars($serviceName, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    
    $text = "<b>🔔 Novo Agendamento!</b>\n\n" .
            "👤 <b>Cliente:</b> {$safeClientName}\n" .
            "📞 <b>Telefone:</b> {$clientPhone}\n" .
            "✂️ <b>Serviço:</b> {$safeServiceName}\n" .
            "📅 <b>Data:</b> {$formattedDate}";
    ```

---

## 4. CHECKLIST DE ENDURECIMENTO (HARDENING) DO SERVIDOR

Para assegurar que as proteções programadas funcionem corretamente no ambiente Hostinger VPS ou Hospedagem Compartilhada, aplique o seguinte guia de endurecimento:

1.  **Proteção do Arquivo de Ambiente:**
    Garantir que o arquivo `.env` tenha permissões de leitura restritas apenas ao processo que executa o servidor web:
    ```bash
    chmod 600 backend/.env
    ```
2.  **Desabilitar Listagem de Diretórios:**
    Adicionar diretiva no arquivo `.htaccess` principal para evitar a listagem de arquivos das pastas caso um diretório não possua `index.html` ou `index.php`:
    ```apache
    Options -Indexes
    ```
3.  **Ambiente de Produção Estrito:**
    Confirmar a seguinte linha no arquivo `.env` de produção:
    ```ini
    DEBUG_MODE=false
    ```
4.  **Isolamento da Pasta de Sessões:**
    Confirmar que a pasta configurada em `Auth.php` (`/home/deploy/php-sessions`) possui permissões exclusivas do usuário `deploy` e do grupo `www-data`, impedindo outros usuários do servidor de lerem dados das sessões em cache.
