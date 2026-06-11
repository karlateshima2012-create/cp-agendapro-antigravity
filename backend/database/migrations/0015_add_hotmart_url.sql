-- Migration: Add hotmart_url column to cp_agenda_accounts
-- Created: 2026-06-11

ALTER TABLE `cp_agenda_accounts`
  ADD COLUMN `hotmart_url` VARCHAR(255) NOT NULL DEFAULT '';
