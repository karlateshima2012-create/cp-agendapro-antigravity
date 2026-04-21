<?php
// backend/api/routes/admin.php

$user = Auth::requireAuth();
// ✅ SECURITY FIX: Debug logging only when DEBUG_MODE=true in .env
if (DEBUG_MODE) {
    file_put_contents(__DIR__ . '/../debug.log', date('Y-m-d H:i:s') . " - ADMIN: Path=$path | Method=$method | Role={$user['role']}\n", FILE_APPEND);
}
if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') Response::fail('Forbidden', 403);

if ($path === 'admin/profiles' && $method === 'GET') {
    $profiles = Db::fetchAll("SELECT u.id, u.email, u.role, a.name as companyName, a.owner_name as ownerName, a.status as accountStatus, a.plan_type as planType, a.plan_expires_at as planExpiresAt, a.contact_phone as contactPhone, a.lifetime_appointments as appointmentCount, a.created_at as createdAt FROM cp_agenda_users u JOIN cp_agenda_accounts a ON u.account_id = a.id WHERE u.role = 'client' ORDER BY a.created_at DESC");
    Response::ok($profiles);
}

if (preg_match('/^admin\/profiles\/(\d+)$/', $path, $matches) && $method === 'PATCH') {
    $userId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Update account associated with this user
    $usr = Db::fetch('SELECT account_id FROM cp_agenda_users WHERE id = ?', [$userId]);
    if (!$usr) Response::fail('User not found');
    
    $accId = $usr['account_id'];
    $allowed = ['name', 'owner_name', 'status', 'plan_type', 'plan_expires_at', 'contact_phone'];
    $sets = [];
    $params = [];
    foreach ($data as $key => $val) {
        $snake = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));
        if ($snake === 'account_status') $snake = 'status';
        if (in_array($snake, $allowed)) {
            $sets[] = "`$snake` = ?";
            $params[] = $val;
        }
    }
    if ($sets) {
        $params[] = $accId;
        Db::query('UPDATE cp_agenda_accounts SET ' . implode(', ', $sets) . ' WHERE id = ?', $params);
    }
    Response::ok(['msg' => 'Profile updated']);
}

if (preg_match('/^admin\/profiles\/(\d+)\/renew$/', $path, $matches) && $method === 'POST') {
    $userId = $matches[1];
    $data = json_decode(file_get_contents('php://input'), true);
    $months = (int)($data['months'] ?? 1);
    
    $usr = Db::fetch('SELECT account_id FROM cp_agenda_users WHERE id = ?', [$userId]);
    $acc = Db::fetch('SELECT plan_expires_at FROM cp_agenda_accounts WHERE id = ?', [$usr['account_id']]);
    
    $currentMatch = $acc['plan_expires_at'];
    $date = (strtotime($currentMatch) > time()) ? strtotime($currentMatch) : time();
    $newExpiry = date('Y-m-d H:i:s', strtotime("+$months months", $date));
    
    Db::query('UPDATE cp_agenda_accounts SET plan_expires_at = ?, status = "active" WHERE id = ?', [$newExpiry, $usr['account_id']]);
    Response::ok(['newExpiryDate' => $newExpiry]);
}

if ($path === 'admin/users' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    error_log("ADMIN USER CREATE DATA: " . print_r($data, true));
    // Atomic creation
    try {
        $pdo = Db::getInstance()->getPdo();
        $pdo->beginTransaction();
        
        
        $planType = $data['planType'] ?? '6m';
        $months = match($planType) {
            '12m' => 12,
            '6m' => 6,
            '3m' => 3,
            '1m' => 1,
            default => 6
        };
        $expiresAt = date('Y-m-d H:i:s', strtotime("+$months months"));
        
        Db::query('INSERT INTO cp_agenda_accounts (name, owner_name, status, contact_phone, plan_type, plan_expires_at) VALUES (?, ?, ?, ?, ?, ?)', 
            [$data['companyName'], $data['ownerName'], 'active', $data['contactPhone'] ?? '', $planType, $expiresAt]);
        $accId = $pdo->lastInsertId();
        
        Db::query('INSERT INTO cp_agenda_users (account_id, email, password_hash, role, name, must_change_password) VALUES (?, ?, ?, ?, ?, ?)', [
            $accId,
            $data['email'],
            password_hash($data['password'], PASSWORD_DEFAULT),
            'client',
            $data['ownerName'],
            1
        ]);
        
        $pdo->commit();

        // ✅ AUTOMATION: Send Welcome Email
        $userName = $data['ownerName'];
        $userEmail = $data['email'];
        $password = $data['password'];
        $loginUrl = "https://" . $_SERVER['HTTP_HOST'];
        $landingPage = "https://saibamaiscpagendapro.creativeprintjp.com/";

        $subject = "Bem-vindo ao CP Agenda Pro!";
        $body = "
        <div style='font-family: sans-serif; color: #333; max-width: 600px;'>
            <h2 style='color: #4F46E5;'>Sua agenda profissional está pronta!</h2>
            <p>Olá, <strong>{$userName}</strong>,</p>
            <p>É um prazer ter você conosco! Seu acesso ao <strong>CP Agenda Pro</strong> foi criado com sucesso.</p>
            
            <div style='background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;'>
                <p style='margin: 0 0 10px 0;'><strong>Dados de Acesso:</strong></p>
                <p style='margin: 5px 0;'>E-mail: <code>{$userEmail}</code></p>
                <p style='margin: 5px 0;'>Senha Temporária: <code>{$password}</code></p>
            </div>

            <p>Você pode acessar seu painel de duas formas:</p>
            <ol>
                <li>Pelo nosso <strong>Site Oficial</strong>: <a href='{$landingPage}'>{$landingPage}</a> (clique em Login)</li>
                <li>Pelo <strong>Link Direto</strong>: <a href='{$loginUrl}'>{$loginUrl}</a></li>
            </ol>

            <p style='color: #ef4444; font-size: 0.9em;'><em>* Por segurança, você deverá alterar sua senha logo no primeiro acesso.</em></p>

            <hr style='border: 0; border-top: 1px solid #eee; margin: 30px 0;'>
            <p style='font-size: 0.8em; color: #999;'>Este é um e-mail automático. Se precisar de suporte, responda a este e-mail ou entre em contato via WhatsApp.</p>
        </div>
        ";

        Mail::send($userEmail, $subject, $body);

        Response::ok(['id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        $pdo->rollBack();
        Response::fail($e->getMessage());
    }
}

if (preg_match('/^admin\/users\/(\d+)$/', $path, $matches) && $method === 'DELETE') {
    $userId = $matches[1];
    $usr = Db::fetch('SELECT account_id FROM cp_agenda_users WHERE id = ?', [$userId]);
    if ($usr) {
        Db::query('DELETE FROM cp_agenda_accounts WHERE id = ?', [$usr['account_id']]); // Cascades to user
    }
    Response::ok(['msg' => 'Deleted']);
}

Response::fail("Not Found: '$path'", 404);
