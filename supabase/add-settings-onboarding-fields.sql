-- Moves tax/savings rate from browser-only localStorage into the account
-- (business_profiles), so it's tied to login rather than the device, and
-- adds an onboarding_completed flag so new signups get a one-time setup
-- wizard without being re-prompted on every login (even if they skip it).
ALTER TABLE business_profiles ALTER COLUMN business_name DROP NOT NULL;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 20;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS savings_rate NUMERIC(5,2) NOT NULL DEFAULT 10;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark onboarding already done for existing accounts (i.e. you),
-- and seed your current rates so nothing changes on next login.
UPDATE business_profiles
SET onboarding_completed = true
WHERE user_id = '86cc903b-0c33-49d2-a84d-859226647d2d';
