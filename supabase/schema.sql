-- ============================================================
-- BudgetFlow — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ---- Expenses ------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        DATE        NOT NULL,
  title       TEXT        NOT NULL,
  vendor      TEXT,
  category    TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'business' CHECK (type IN ('business', 'personal')),
  amount      NUMERIC(10,2) NOT NULL,
  notes       TEXT,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);


-- ---- Invoices ------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT        NOT NULL,
  client_name    TEXT        NOT NULL,
  client_email   TEXT,
  amount         NUMERIC(10,2) NOT NULL,
  status         TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  issue_date     DATE        NOT NULL,
  due_date       DATE,
  date_paid      DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);


-- ---- Receipts ------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename     TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,
  public_url   TEXT        NOT NULL,
  expense_id   UUID        REFERENCES expenses(id) ON DELETE SET NULL,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
  ON receipts FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- Migration: add expense type column
-- Run this if you already have the expenses table created above.
-- If running schema.sql fresh, the column is already included above.
-- ============================================================
-- ALTER TABLE expenses
--   ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'business'
--   CHECK (type IN ('business', 'personal'));
-- ============================================================

-- ============================================================
-- Migration: add date_paid column to invoices
-- Run this if you already have the invoices table created above.
-- If running schema.sql fresh, the column is already included above.
-- ============================================================
-- ALTER TABLE invoices
--   ADD COLUMN IF NOT EXISTS date_paid DATE;
-- ============================================================

-- ============================================================
-- Storage bucket setup (run separately in Dashboard UI or here)
-- ============================================================
-- In Supabase Dashboard → Storage → New bucket:
--   Name: receipts
--   Public: false (private)
--
-- Then add these storage policies:
-- Policy name: "Users can upload their own receipts"
--   Allowed operation: INSERT
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- Policy name: "Users can view their own receipts"
--   Allowed operation: SELECT
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- Policy name: "Users can delete their own receipts"
--   Allowed operation: DELETE
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
-- ============================================================
