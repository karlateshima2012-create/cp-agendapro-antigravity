<?php
// deploy_hostinger/public_html/api/lib/Auth.php

class Auth {
    public static function init() {
        if (session_status() === PHP_SESSION_NONE) {
            $ttl = 30 * 24 * 60 * 60; // 30 dias
            ini_set('session.gc_maxlifetime', $ttl);
            
            // ✅ SECURITY [6.1]: Guard session save path for local/remote compatibility
            if (is_dir('/home/deploy/php-sessions')) {
                session_save_path('/home/deploy/php-sessions');
            }
            
            session_set_cookie_params([
                'lifetime' => $ttl,
                'path' => '/',
                'domain' => '',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            session_start();
        }
        
        // Generate CSRF token if not set
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        self::setCsrfCookie();
    }

    public static function setCsrfCookie() {
        $token = $_SESSION['csrf_token'] ?? '';
        if ($token) {
            $ttl = 30 * 24 * 60 * 60; // 30 dias
            setcookie('XSRF-TOKEN', $token, [
                'expires' => time() + $ttl,
                'path' => '/',
                'domain' => '',
                'secure' => true,
                'httponly' => false, // Must be readable by JavaScript
                'samesite' => 'Lax'
            ]);
        }
    }

    public static function login($user) {
        self::init();
        session_regenerate_id(true);
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        self::setCsrfCookie();
        $_SESSION['user'] = [
            'id' => $user['id'],
            'account_id' => $user['account_id'],
            'role' => $user['role'],
            'name' => $user['name'],
            'email' => $user['email'],
            'must_change_password' => isset($user['must_change_password']) ? (bool)$user['must_change_password'] : false
        ];
    }

    public static function logout() {
        self::init();
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
            // Also clear CSRF cookie
            setcookie('XSRF-TOKEN', '', time() - 42000, '/', '', true, false);
        }
        session_destroy();
    }

    public static function getUser() {
        self::init();
        return $_SESSION['user'] ?? null;
    }

    public static function requireAuth() {
        $user = self::getUser();
        if (!$user) {
            require_once __DIR__ . '/Response.php';
            Response::fail('Unauthorized', 401);
        }
        return $user;
    }

    public static function getAccountId() {
        $user = self::getUser();
        return $user ? $user['account_id'] : null;
    }

    /**
     * Case-insensitive header lookup helper.
     */
    private static function getHeader(string $name): string {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$key])) {
            return $_SERVER[$key];
        }
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $k => $v) {
                if (strcasecmp($k, $name) === 0) {
                    return $v;
                }
            }
        }
        return '';
    }

    /**
     * Validate CSRF token for state-changing requests.
     */
    public static function validateCsrf() {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'], true)) {
            self::init();

            // Extract path to identify public or authentication bypass routes
            $path = $_GET['path'] ?? '';
            if (empty($path)) {
                $full_path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
                if (strpos($full_path, '/api/') !== false) {
                    $path = substr($full_path, strpos($full_path, '/api/') + 5);
                } else {
                    $path = preg_replace('/^\/api/', '', $full_path);
                }
            }
            $path = trim($path, '/');
            
            // Bypass CSRF for public routes and auth entrypoints
            $bypassRoutes = [
                'auth/login',
                'auth/mfa-verify',
                'auth/forgot-password',
                'auth/reset-password',
            ];
            
            if (in_array($path, $bypassRoutes, true)) {
                return;
            }
            
            if (strpos($path, 'public/') === 0 || strpos($path, 'telegram-webhook') === 0) {
                return;
            }

            // Read token from headers (X-CSRF-Token or default Axios X-Xsrf-Token)
            $token = self::getHeader('X-CSRF-Token');
            if (empty($token)) {
                $token = self::getHeader('X-Xsrf-Token');
            }
            
            $token = urldecode($token);
            $sessionToken = $_SESSION['csrf_token'] ?? '';

            if (empty($sessionToken) || !hash_equals($sessionToken, $token)) {
                require_once __DIR__ . '/Response.php';
                Response::fail('Invalid CSRF Token', 403);
            }
        }
    }
}
