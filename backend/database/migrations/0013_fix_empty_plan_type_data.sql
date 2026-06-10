-- Corrige registros com plan_type vazio ou NULL resultantes de inserções
-- anteriores com valor fora do ENUM original ('trial','6m','12m').
-- MySQL em modo não-estrito truncava o valor para '' silenciosamente.
UPDATE cp_agenda_accounts
   SET plan_type = '6m'
 WHERE plan_type = '' OR plan_type IS NULL;
