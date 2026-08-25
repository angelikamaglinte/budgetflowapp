-- Backs the new Tax tab's provincial income tax calculation. Nullable —
-- the Tax page prompts to set it rather than assuming a default province.
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS province TEXT;
