<?php
// debug_env.php
require_once __DIR__ . '/api/config.php';
header('Content-Type: text/plain');

echo "=== DEBUG ENV ===\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Current Dir: " . __DIR__ . "\n";
echo ".env Path Check:\n";
echo "- ../../.env: " . (file_exists(__DIR__ . '/../../.env') ? 'YES' : 'NO') . "\n";
echo "- ../.env: " . (file_exists(__DIR__ . '/../.env') ? 'YES' : 'NO') . "\n";
echo "- .env (here): " . (file_exists(__DIR__ . '/.env') ? 'YES' : 'NO') . "\n";

echo "\n=== Constants ===\n";
echo "DB_HOST: " . (defined('DB_HOST') ? DB_HOST : 'UNDEFINED') . "\n";
echo "DB_NAME: " . (defined('DB_NAME') ? (empty(DB_NAME) ? '[EMPTY]' : '***') : 'UNDEFINED') . "\n";
echo "DB_USER: " . (defined('DB_USER') ? (empty(DB_USER) ? '[EMPTY]' : '***') : 'UNDEFINED') . "\n";
echo "DEBUG_MODE: " . (defined('DEBUG_MODE') ? (DEBUG_MODE ? 'TRUE' : 'FALSE') : 'UNDEFINED') . "\n";

echo "\n=== Test DB Connection ===\n";
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "SUCCESS: Connected to database!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
