-- The plain invoices table has one flat "amount" field with no tax
-- breakdown (unlike pdf_invoices/recurring_invoices, which already have
-- tax_rate). Without this, GST/HST collected on behalf of the CRA gets
-- counted as taxable income on the Tax tab and Quarterly Tax report.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);

-- Lets the Invoices form prefill new invoices' GST/HST rate automatically
-- once the user is registered, instead of retyping it every time.
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS gst_registered BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2);
