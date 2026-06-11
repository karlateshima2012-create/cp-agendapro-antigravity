<?php
// deploy_hostinger/public_html/api/routes/me.php

if ($path === 'me' && $method === 'GET') {
    $user = Auth::requireAuth();

    // Registra último acesso (throttle: só atualiza se passou mais de 1 hora)
    Db::query(
        'UPDATE cp_agenda_accounts SET last_access_at = NOW()
         WHERE id = ? AND (last_access_at IS NULL OR last_access_at < DATE_SUB(NOW(), INTERVAL 1 HOUR))',
        [$user['account_id']]
    );

    // ✅ SECURITY [A-4]: Explicit columns only — never SELECT * on sensitive tables
    $account = Db::fetch(
        'SELECT name, status, plan_type, plan_expires_at,
                primary_color, secondary_color, short_description, services_title,
                services_subtitle, cover_image, view_mode, cover_opacity, profile_image, contact_phone,
                telegram_bot_token, telegram_chat_id, onboarding_seen,
                lifetime_appointments, created_at, invoices, page_views,
                country, timezone, currency, phone_country_code, hotmart_url
         FROM cp_agenda_accounts WHERE id = ?',
        [$user['account_id']]
    );
    
    if ($account && isset($account['invoices'])) {
        $account['invoices'] = json_decode($account['invoices'], true) ?: [];
    } else if ($account) {
        $account['invoices'] = [];
    }

    Response::ok(['user' => $user, 'account' => $account]);
}

if ($path === 'me/profile' && $method === 'PATCH') {
    $user = Auth::requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Filter allowed fields
    $allowed = ['name', 'short_description', 'services_title', 'services_subtitle', 'primary_color', 'secondary_color', 'cover_image', 'view_mode', 'cover_opacity', 'profile_image', 'telegram_bot_token', 'telegram_chat_id', 'timezone', 'country', 'currency'];
    $sets = [];
    $params = [];
    foreach ($data as $key => $val) {
        $snake = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));
        if (!in_array($snake, $allowed)) continue;

        // Validate hex colors
        if (in_array($snake, ['primary_color', 'secondary_color'])) {
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $val)) continue;
        }

        // Reject oversized images (max 6MB as base64)
        if (in_array($snake, ['cover_image', 'profile_image'])) {
            if (strlen((string)$val) > 6 * 1024 * 1024) {
                Response::fail('Imagem muito grande. Máximo permitido: 5MB.', 400);
            }
        }

        $sets[] = "`$snake` = ?";
        $params[] = $val;
    }
    
    if ($sets) {
        $params[] = $user['account_id'];
        Db::query('UPDATE cp_agenda_accounts SET ' . implode(', ', $sets) . ' WHERE id = ?', $params);
    }
    Response::ok(['msg' => 'Profile updated']);
}

if ($path === 'me/change-password' && $method === 'POST') {
    $user = Auth::requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $newPass = $data['password'] ?? '';
    if (strlen($newPass) < 8) Response::fail('A senha deve ter no mínimo 8 caracteres', 400);
    
    $hash = password_hash($newPass, PASSWORD_DEFAULT);
    Db::query('UPDATE cp_agenda_users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [$hash, $user['id']]);
    
    // ✅ FIX: Update session state so the change is reflected immediately without logout
    if (isset($_SESSION['user'])) {
        $_SESSION['user']['must_change_password'] = false;
    }
    
    Response::ok(['msg' => 'Password updated']);
}

if ($path === 'me/test-telegram' && $method === 'POST') {
    $user = Auth::requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $chatId = trim($data['chat_id'] ?? '');

    if (empty($chatId) || !preg_match('/^-?\d+$/', $chatId)) {
        Response::fail('Chat ID inválido. Deve conter apenas números.', 400);
    }

    $token = get_env_var('TELEGRAM_BOT_TOKEN', '');
    if (empty($token)) {
        Response::fail('Bot não configurado no servidor.', 500);
    }

    $text  = "<b>🔔 CP Agenda Pro</b>: Teste de Notificação bem-sucedido!";
    $url   = "https://api.telegram.org/bot{$token}/sendMessage";
    $payload = http_build_query(['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML']);

    $ctx = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content'       => $payload,
            'timeout'       => 5,
            'ignore_errors' => true,
        ],
    ]);
    $res    = @file_get_contents($url, false, $ctx);
    $result = $res ? json_decode($res, true) : null;

    if ($result && $result['ok']) {
        Response::ok(['msg' => 'Notificação enviada com sucesso']);
    } else {
        $desc = $result['description'] ?? 'Chat ID inválido ou bot não iniciado pelo usuário';
        Response::fail($desc, 400);
    }
}

if ($path === 'me/onboarding' && $method === 'POST') {
    $user = Auth::requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $seen = $data['seen'] ? 1 : 0;
    Db::query('UPDATE cp_agenda_accounts SET onboarding_seen = ? WHERE id = ?', [$seen, $user['account_id']]);
    Response::ok(['msg' => 'Onboarding updated']);
}

Response::fail('Not Found', 404);
