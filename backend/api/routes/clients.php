<?php
// backend/api/routes/clients.php

$user = Auth::requireAuth();
$accountId = $user['account_id'];

if ($path === 'clients' && $method === 'GET') {
    $search = $_GET['search'] ?? '';
    
    $sql = 'SELECT * FROM cp_agenda_clients WHERE account_id = ?';
    $params = [$accountId];
    
    if (!empty($search)) {
        $sql .= ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }
    
    $sql .= ' ORDER BY name ASC';
    $clients = Db::fetchAll($sql, $params);
    Response::ok($clients);
}

if (preg_match('/^clients\/(\d+)$/', $path, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    Db::query('DELETE FROM cp_agenda_clients WHERE id = ? AND account_id = ?', [$id, $accountId]);
    Response::ok(['msg' => 'Client deleted']);
}

Response::fail('Not Found', 404);
