<?php
// deploy_hostinger/public_html/api/config.php

// DB Configuration
// Helper to safely get env vars
function get_env_var($key, $default) {
    return getenv($key) !== false ? getenv($key) : $default;
}

// Try to load .env manually if not using a library (e.g. for local dev)
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

// Default to potentially production values if not in ENV, OR use placeholders if preferred.
// For now, we keep the original values as defaults to avoid breaking existing production if .env is missing.
define('DB_HOST', get_env_var('DB_HOST', '127.0.0.1'));
define('DB_PORT', get_env_var('DB_PORT', '3306'));
define('DB_NAME', get_env_var('DB_NAME', 'u176367625_CPagendaPro'));
define('DB_USER', get_env_var('DB_USER', 'u176367625_cpagendakt'));
define('DB_PASS', get_env_var('DB_PASS', 'u5RjUpN$4/rX'));
define('DB_CHARSET', get_env_var('DB_CHARSET', 'utf8mb4'));

// App Configuration
define('API_VERSION', get_env_var('API_VERSION', '1.0.0'));
define('DEBUG_MODE', filter_var(get_env_var('DEBUG_MODE', 'true'), FILTER_VALIDATE_BOOLEAN));

// Timezone
date_default_timezone_set('Asia/Tokyo');

