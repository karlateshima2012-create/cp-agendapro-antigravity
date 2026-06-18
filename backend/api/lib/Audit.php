<?php
// backend/api/lib/Audit.php

class Audit {
    /**
     * Log a security or operations event to the audit logs.
     *
     * @param string $event The event name (e.g. login_success, password_changed, user_created, user_deleted, plan_renewed)
     * @param string $description Detailed text describing the action/event
     * @param int|null $accountId The tenant account ID (falls back to session if null)
     * @param int|null $userId The user ID performing/affected by the event (falls back to session if null)
     */
    public static function log(string $event, string $description, ?int $accountId = null, ?int $userId = null) {
        try {
            $ip = $_SERVER['REMOTE_ADDR'] ?? null;
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
            
            // Auto-detect IDs from active session if not explicitly provided
            if ($accountId === null && isset($_SESSION['user']['account_id'])) {
                $accountId = (int)$_SESSION['user']['account_id'];
            }
            if ($userId === null && isset($_SESSION['user']['id'])) {
                $userId = (int)$_SESSION['user']['id'];
            }
            
            Db::query(
                'INSERT INTO cp_agenda_audit_logs (account_id, user_id, event, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
                [$accountId, $userId, $event, $description, $ip, $ua]
            );
        } catch (Exception $e) {
            // Decouple audit logging failures from core application flows to prevent lockouts
            // but report the issue to internal monitoring.
            if (class_exists('Monitor')) {
                Monitor::critical('Audit log failed', [
                    'error' => $e->getMessage(),
                    'event' => $event,
                    'description' => $description
                ]);
            }
        }
    }
}
