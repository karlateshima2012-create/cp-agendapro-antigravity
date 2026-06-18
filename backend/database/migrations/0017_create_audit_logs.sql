-- Migration: Create Audit Logs Table and Add TOTP Secret column
-- Created at: 2026-06-18

CREATE TABLE IF NOT EXISTS `cp_agenda_audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `account_id` INT NULL,
    `user_id` INT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_log_account` FOREIGN KEY (`account_id`) REFERENCES `cp_agenda_accounts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `cp_agenda_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `cp_agenda_users` ADD COLUMN `totp_secret` VARCHAR(100) DEFAULT NULL;
