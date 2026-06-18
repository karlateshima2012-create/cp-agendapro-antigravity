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

    $dbUser = Db::fetch('SELECT totp_secret FROM cp_agenda_users WHERE id = ?', [$user['id']]);
    $user['mfa_enabled'] = ($dbUser && !empty($dbUser['totp_secret']));

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
    
    // ✅ SECURITY [2.3]: Fetch current user record to verify current_password
    $dbUser = Db::fetch('SELECT password_hash, must_change_password FROM cp_agenda_users WHERE id = ?', [$user['id']]);
    if (!$dbUser) {
        Response::fail('Usuário não encontrado', 404);
    }
    
    // Require current password verification only if the password change is not forced (must_change_password is 0)
    if (empty($dbUser['must_change_password'])) {
        $currentPass = $data['current_password'] ?? '';
        if (empty($currentPass) || !password_verify($currentPass, $dbUser['password_hash'])) {
            Response::fail('A senha atual está incorreta', 400);
        }
    }
    
    $hash = password_hash($newPass, PASSWORD_DEFAULT);
    Db::query('UPDATE cp_agenda_users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [$hash, $user['id']]);
    
    // ✅ FIX: Update session state so the change is reflected immediately without logout
    if (isset($_SESSION['user'])) {
        $_SESSION['user']['must_change_password'] = false;
    }
    
    // ✅ SECURITY [4.7]: Audit Log voluntary password change
    Audit::log('password_changed', "Profissional alterou sua senha de acesso voluntariamente", (int)$user['account_id'], (int)$user['id']);
    
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

if ($path === 'me/telegram/link' && $method === 'GET') {
    $user = Auth::requireAuth();
    $token = bin2hex(random_bytes(16));
    
    Db::query(
        'UPDATE cp_agenda_accounts 
         SET telegram_link_token = ?, 
             telegram_link_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) 
         WHERE id = ?',
        [$token, $user['account_id']]
    );
    
    Response::ok([
        'link' => "https://t.me/Cpagendaprobot?start={$token}"
    ]);
}

if ($path === 'me/telegram/status' && $method === 'GET') {
    $user = Auth::requireAuth();
    $account = Db::fetch(
        'SELECT telegram_chat_id FROM cp_agenda_accounts WHERE id = ?',
        [$user['account_id']]
    );
    
    $chatId = $account['telegram_chat_id'] ?? '';
    Response::ok([
        'connected' => !empty($chatId),
        'chat_id' => $chatId
    ]);
}

if ($path === 'me/telegram/disconnect' && $method === 'POST') {
    $user = Auth::requireAuth();
    Db::query(
        'UPDATE cp_agenda_accounts 
         SET telegram_chat_id = NULL, 
             telegram_link_token = NULL, 
             telegram_link_expires_at = NULL 
         WHERE id = ?',
        [$user['account_id']]
    );
    Response::ok(['msg' => 'Telegram desconectado com sucesso']);
}

// ✅ SECURITY [5.9]: Generate secret and OTPAuth URL for Google Authenticator pareament
if ($path === 'me/mfa/setup' && $method === 'GET') {
    $user = Auth::requireAuth();
    $secret = Totp::generateSecret();
    $_SESSION['mfa_setup_secret'] = $secret;
    
    $email = rawurlencode($user['email']);
    $otpauthUrl = "otpauth://totp/CP%20Agenda%20Pro:{$email}?secret={$secret}&issuer=CP%20Agenda%20Pro";
    
    Response::ok([
        'secret' => $secret,
        'otpauth_url' => $otpauthUrl
    ]);
}

// ✅ SECURITY [5.9]: Verify code and save secret in user profile database
if ($path === 'me/mfa/confirm' && $method === 'POST') {
    $user = Auth::requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $code = trim($data['code'] ?? '');
    
    if (!isset($_SESSION['mfa_setup_secret'])) {
        Response::fail('Sessão de setup expirada', 400);
    }
    
    $secret = $_SESSION['mfa_setup_secret'];
    if (Totp::verifyCode($secret, $code)) {
        unset($_SESSION['mfa_setup_secret']);
        Db::query('UPDATE cp_agenda_users SET totp_secret = ? WHERE id = ?', [$secret, $user['id']]);
        
        // Audit log
        Audit::log('mfa_enabled', "Autenticação em duas etapas (MFA) ativada com sucesso", (int)$user['account_id'], (int)$user['id']);
        
        Response::ok(['msg' => 'MFA ativado com sucesso!']);
    } else {
        Response::fail('Código de verificação inválido', 400);
    }
}

// ✅ SECURITY [5.9]: Disable MFA requiring password re-verification
if ($path === 'me/mfa/disable' && $method === 'POST') {
    $user = Auth::requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $password = $data['password'] ?? '';
    
    // Verify password
    $dbUser = Db::fetch('SELECT password_hash FROM cp_agenda_users WHERE id = ?', [$user['id']]);
    if (!$dbUser || !password_verify($password, $dbUser['password_hash'])) {
        Response::fail('Senha incorreta', 400);
    }
    
    Db::query('UPDATE cp_agenda_users SET totp_secret = NULL WHERE id = ?', [$user['id']]);
    
    // Audit log
    Audit::log('mfa_disabled', "Autenticação em duas etapas (MFA) desativada", (int)$user['account_id'], (int)$user['id']);
    
    Response::ok(['msg' => 'MFA desativado com sucesso!']);
}

Response::fail('Not Found', 404);
