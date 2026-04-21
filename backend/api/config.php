<?php
// backend/api/config.php

// DB Configuration
// Helper to safely get env vars
function get_env_var($key, $default = '') {
    $val = getenv($key);
    return ($val !== false) ? $val : $default;
}

// Load .env file if it exists (local dev)
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        [$name, $value] = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

// ✅ SECURITY FIX: No hardcoded fallback credentials.
// All values MUST be defined in the .env file on the server.
define('DB_HOST',    get_env_var('DB_HOST',    '127.0.0.1'));
define('DB_PORT',    get_env_var('DB_PORT',    '3306'));
define('DB_NAME',    get_env_var('DB_NAME',    ''));
define('DB_USER',    get_env_var('DB_USER',    ''));
define('DB_PASS',    get_env_var('DB_PASS',    ''));
define('DB_CHARSET', get_env_var('DB_CHARSET', 'utf8mb4'));

// App Configuration
define('API_VERSION', get_env_var('API_VERSION', '1.0.0'));
// ✅ SECURITY FIX: DEBUG_MODE defaults to FALSE. Enable only via .env (DEBUG_MODE=true).
define('DEBUG_MODE', filter_var(get_env_var('DEBUG_MODE', 'false'), FILTER_VALIDATE_BOOLEAN));

// Timezone
date_default_timezone_set('Asia/Tokyo');
