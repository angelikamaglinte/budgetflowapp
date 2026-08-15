-- Invoice Builder (Tools > Invoice Builder): PDF invoice generation,
-- separate from the existing `invoices` tracker used for bookkeeping.

-- One row per user: the sender info that appears on every generated PDF.
CREATE TABLE IF NOT EXISTS business_profiles (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business profile"
  ON business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business profile"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profile"
  ON business_profiles FOR UPDATE
  USING (auth.uid() = user_id);


-- Saved, editable, duplicable PDF invoices. Line items are stored as JSONB
-- (an array of {description, date_range, qty, rate}) since they're only
-- ever read/written as a group with their parent invoice.
CREATE TABLE IF NOT EXISTS pdf_invoices (
  id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT          NOT NULL,
  invoice_date   DATE          NOT NULL,
  due_date       DATE,
  terms          TEXT,
  client_name    TEXT          NOT NULL,
  client_company TEXT,
  client_address TEXT,
  tax_rate       NUMERIC(5,3)  NOT NULL DEFAULT 0,
  thank_you_note TEXT          DEFAULT 'Thank you for your business!',
  line_items     JSONB         NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE pdf_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pdf invoices"
  ON pdf_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pdf invoices"
  ON pdf_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pdf invoices"
  ON pdf_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pdf invoices"
  ON pdf_invoices FOR DELETE
  USING (auth.uid() = user_id);
