-- Mirrors invoices.tax_rate (added for GST/HST collected) but for the
-- other direction: GST/HST paid on a business purchase, claimable back as
-- an Input Tax Credit against what's remitted to the CRA.
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
