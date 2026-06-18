<?php
// backend/api/routes/telegram_webhook.php

// ✅ SECURITY [1.2]: Validate webhook secret token to authenticate Telegram payload origin
$incomingSecret = $_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '';
$expectedSecret = get_env_var('WEBHOOK_SECRET', '');

if (empty($expectedSecret) || !hash_equals($expectedSecret, $incomingSecret)) {
    http_response_code(403);
    exit;
}

// Telegram sends POST requests with JSON body
$input = file_get_contents('php://input');
$update = json_decode($input, true);

if (!$update || !isset($update['message'])) {
    exit; // Silently exit for non-message updates
}

$message = $update['message'];
$chatId = $message['chat']['id'] ?? null;
$text = $message['text'] ?? '';

if ($chatId && (strpos($text, '/start') === 0)) {
    $botToken = get_env_var('TELEGRAM_BOT_TOKEN', '');
    if (empty($botToken)) { header('HTTP/1.1 200 OK'); echo json_encode(['status' => 'ok']); exit; }
    
    // Parse parameter: /start TOKEN
    $parts = explode(' ', $text);
    $startParam = isset($parts[1]) ? trim($parts[1]) : '';

    if (!empty($startParam)) {
        // Look up the account by valid token
        $account = Db::fetch(
            'SELECT id FROM cp_agenda_accounts 
             WHERE telegram_link_token = ? AND telegram_link_expires_at > NOW()',
            [$startParam]
        );


        if ($account) {

            // Associated successfully! Save the chat_id, clear the token columns.
            Db::query(
                'UPDATE cp_agenda_accounts 
                 SET telegram_chat_id = ?, 
                     telegram_link_token = NULL, 
                     telegram_link_expires_at = NULL 
                 WHERE id = ?',
                [$chatId, $account['id']]
            );

            $msg = "<b>✅ CP Agenda Pro — Telegram conectado com sucesso!</b>\n\n"
                 . "A partir de agora você receberá uma mensagem aqui toda vez que um novo agendamento for realizado ou alterado. 🚀\n\n"
                 . "<b>Você já pode voltar para o sistema!</b>";
        } else {
            // Token expired or invalid
            $msg = "❌ <b>Link de conexão inválido ou expirado!</b>\n\n"
                 . "Por favor, volte ao seu painel em <i>Minha Conta</i> e gere um novo link de conexão clicando em <b>Conectar Telegram</b>. O link expira em 10 minutos.";
        }
    } else {
        // Fallback for simple /start (without token parameter)
        $msg = "Olá! Bem-vindo ao assistente do <b>CP Agenda Pro</b> 🚀\n\n"
             . "Para ativar as notificações automáticas de seus agendamentos, por favor clique no botão <b>Conectar Telegram</b> diretamente no painel administrativo do seu sistema. ⚡";
    }

    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $params = [
        'chat_id' => $chatId,
        'text' => $msg,
        'parse_mode' => 'HTML'
    ];

    $options = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query($params)
        ]
    ];
    $context  = stream_context_create($options);
    file_get_contents($url, false, $context);
}

// Always return 200 OK to Telegram
header('HTTP/1.1 200 OK');
echo json_encode(['status' => 'ok']);
exit;
