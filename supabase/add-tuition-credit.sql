-- Backs the Tax tab's federal tuition credit carry-forward estimate. This
-- is a manually-updated value (from the user's latest CRA Notice of
-- Assessment) rather than something the app auto-decrements — CRA's actual
-- assessment is the real authority on the remaining balance.
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS tuition_credit_remaining NUMERIC(10,2);
