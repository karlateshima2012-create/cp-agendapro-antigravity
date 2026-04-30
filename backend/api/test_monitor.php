<?php
// Temporary test script — will be deleted after validation
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/Db.php';
require_once __DIR__ . '/lib/Monitor.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== CP Agenda Pro — Monitor Test ===\n\n";

// 1. Check environment variables
$token  = get_config_var('TELEGRAM_MONITOR_TOKEN', '');
$chatId = get_config_var('TELEGRAM_ERROR_CHAT_ID', '');

echo "TELEGRAM_MONITOR_TOKEN : " . (empty($token)  ? "❌ NAO CONFIGURADO" : "✅ OK (***" . substr($token,  -6) . ")") . "\n";
echo "TELEGRAM_ERROR_CHAT_ID : " . (empty($chatId) ? "❌ NAO CONFIGURADO" : "✅ OK ($chatId)") . "\n\n";

if (empty($token) || empty($chatId)) {
    echo "⛔ Abortando: variáveis de ambiente ausentes.\n";
    echo "Verifique os GitHub Secrets e aguarde o próximo deploy.\n";
    exit;
}

// 2. Send test alert via Monitor::critical()
echo "Enviando alerta de teste para o Telegram...\n";

Monitor::critical('✅ Teste de Monitoramento', [
    'status'    => 'Sistema funcionando corretamente',
    'timestamp' => date('d/m/Y H:i:s T'),
    'server'    => $_SERVER['HTTP_HOST'] ?? 'unknown',
    'note'      => 'Este é um teste manual. Pode ignorar.',
]);

echo "✅ Monitor::critical() chamado com sucesso.\n\n";

// 3. Verify Telegram API directly
echo "Verificando conexão direta com a API do Telegram...\n";
$url = "https://api.telegram.org/bot{$token}/getMe";
$ctx = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
$res = @file_get_contents($url, false, $ctx);
$json = $res ? json_decode($res, true) : null;

if ($json && $json['ok']) {
    echo "✅ Bot conectado: @" . ($json['result']['username'] ?? 'unknown') . "\n";
    echo "   Nome: " . ($json['result']['first_name'] ?? 'unknown') . "\n";
} else {
    echo "❌ Falha ao conectar com a API do Telegram.\n";
    echo "   Resposta: " . ($res ?: 'sem resposta') . "\n";
}

echo "\n=== Teste concluído ===\n";
echo "Se tudo estiver ✅, verifique seu Telegram — a mensagem deve ter chegado!\n";
