<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/Db.php';
require_once __DIR__ . '/lib/Mail.php';

$to = 'karla.teshima.2012@gmail.com';
$subject = 'Teste de Conexão - CP Agenda Pro';
$body = '<h1>Teste de E-mail</h1><p>Se você recebeu este e-mail, a configuração do PHPMailer está funcionando corretamente!</p>';

echo "Iniciando teste de envio para: $to...\n";

try {
    $result = Mail::send($to, $subject, $body);
    if ($result) {
        echo "✅ SUCESSO: E-mail enviado com sucesso!\n";
    } else {
        echo "❌ FALHA: O método Mail::send retornou falso.\n";
    }
} catch (Exception $e) {
    echo "❌ ERRO FATAL: " . $e->getMessage() . "\n";
}
