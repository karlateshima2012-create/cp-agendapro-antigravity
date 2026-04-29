<?php
// backend/api/force_fix.php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/Db.php';
require_once __DIR__ . '/lib/Response.php';

try {
    // 1. Identificar o usuário Karla (karla.teshima.2012@gmail.com)
    $user = Db::fetch('SELECT id, account_id FROM cp_agenda_users WHERE email = ?', ['karla.teshima.2012@gmail.com']);
    if (!$user) {
        die("Usuário não encontrado.");
    }
    $accountId = $user['account_id'];

    // 2. Definir os horários desejados (Seg-Sex: 19-22, Sab: 09-18)
    $workingHours = [
        ['day' => 'segunda', 'name' => 'Segunda-feira', 'isWorking' => false, 'startTime' => '19:00', 'endTime' => '22:00', 'start' => '19:00', 'end' => '22:00'],
        ['day' => 'terca', 'name' => 'Terça-feira', 'isWorking' => true, 'startTime' => '19:00', 'endTime' => '22:00', 'start' => '19:00', 'end' => '22:00'],
        ['day' => 'quarta', 'name' => 'Quarta-feira', 'isWorking' => true, 'startTime' => '19:00', 'endTime' => '22:00', 'start' => '19:00', 'end' => '22:00'],
        ['day' => 'quinta', 'name' => 'Quinta-feira', 'isWorking' => true, 'startTime' => '19:00', 'endTime' => '22:00', 'start' => '19:00', 'end' => '22:00'],
        ['day' => 'sexta', 'name' => 'Sexta-feira', 'isWorking' => true, 'startTime' => '19:00', 'endTime' => '22:00', 'start' => '19:00', 'end' => '22:00'],
        ['day' => 'sabado', 'name' => 'Sábado', 'isWorking' => true, 'startTime' => '09:00', 'endTime' => '18:00', 'start' => '09:00', 'end' => '18:00'],
        ['day' => 'domingo', 'name' => 'Domingo', 'isWorking' => false, 'startTime' => '09:00', 'endTime' => '13:00', 'start' => '09:00', 'end' => '13:00']
    ];
    $jsonHours = json_encode($workingHours);

    // 3. Forçar o Update
    $res = Db::query('UPDATE cp_agenda_availability SET working_hours = ?, interval_minutes = 60 WHERE account_id = ?', [$jsonHours, $accountId]);
    
    echo "<h1>Conserto Realizado!</h1>";
    echo "<p>Conta ID: $accountId atualizada com sucesso.</p>";
    echo "<pre>" . json_encode($workingHours, JSON_PRETTY_PRINT) . "</pre>";
    
} catch (Exception $e) {
    echo "<h1>ERRO:</h1>" . $e->getMessage();
}
