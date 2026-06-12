-- Migration: Add Telegram linking token columns
ALTER TABLE `cp_agenda_accounts`
ADD COLUMN `telegram_link_token` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `telegram_link_expires_at` DATETIME DEFAULT NULL;
