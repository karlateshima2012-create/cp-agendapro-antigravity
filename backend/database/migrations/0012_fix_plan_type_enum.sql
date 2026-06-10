-- Adiciona '1m' e '3m' ao ENUM plan_type para alinhar com os planos
-- disponíveis no frontend (PlanType: '1m' | '3m' | '6m' | '12m').
-- Dados existentes ('trial', '6m', '12m') não são afetados.
ALTER TABLE cp_agenda_accounts
  MODIFY COLUMN plan_type ENUM('trial', '1m', '3m', '6m', '12m') DEFAULT '6m';
