-- Migration: Add Localization Columns (Country, Timezone, Currency, Phone Country Code)
-- Date: 2026-06-11
-- Target Table: cp_agenda_accounts

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `cp_agenda_accounts`
  ADD COLUMN `country`            VARCHAR(5)   NOT NULL DEFAULT 'JP',
  ADD COLUMN `timezone`           VARCHAR(50)  NOT NULL DEFAULT 'Asia/Tokyo',
  ADD COLUMN `currency`           VARCHAR(3)   NOT NULL DEFAULT 'JPY',
  ADD COLUMN `phone_country_code` VARCHAR(5)   NOT NULL DEFAULT '81';

SET FOREIGN_KEY_CHECKS = 1;
