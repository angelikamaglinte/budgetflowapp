-- Notes: was previously a static page with real personal budgeting info
-- hardcoded into the app itself (visible to any user, not private). This
-- replaces it with a real per-user table + RLS.
CREATE TABLE IF NOT EXISTS notes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);


-- One-time seed: carries over the content that used to be hardcoded on the
-- Notes page, as a private note under your account only. Safe to edit or
-- delete afterward like any other note.
INSERT INTO notes (user_id, title, content)
VALUES (
  '86cc903b-0c33-49d2-a84d-859226647d2d',
  'Budgeting Reference',
  E'BUDGETING RULE\nIncome received this month = Pay this month''s expenses\n• January work → Paid in February → Covers February expenses\n• February work → Paid in March → Covers March expenses\n\nPAYMENT SCHEDULE\nSatori BLP: Invoiced end of month → Paid quickly (same month / early next month)\n360 Integrations: Invoiced end of month → Paid after 30 days (next month)\n\nCURRENCY TRACKING\nSatori Bear Inc: Invoiced and paid in CAD — amounts in app match invoice exactly.\n360 Integration LLC: Invoiced in USD, received in CAD via wire transfer. The CAD amount received (from your bank statement) is what''s tracked in this app — not the USD invoice amount. This is correct for CRA tax filing.\nExample: Invoice for USD 2,400 → received CAD 3,185.04 → $3,185.04 is entered in the app\n\nALLOCATION FORMULA (per payment)\nTax (20%): Keep in Simplii Savings — do NOT touch\nPersonal Savings (10%): Transfer to TD Savings\nBusiness Expenses: Reimburse to TD Chequing (if paid from TD)\nPersonal Expenses: Transfer to TD Chequing\n\nTRANSFER PROCESS\nSimplii Savings → Simplii Chequing → TD Accounts\n\nMONTHLY FIXED EXPENSES\nTuition fee (Uncle): $2,000\nRent & Utilities: $1,000\nFamily Support (Mom): $1,000\nBusiness Expenses: ~$217\nPersonal & variable expenses: varies\n\nACCOUNTS\nSimplii Savings: Tax money only (20% of all income)\nSimplii Chequing: Receive income, pay business expenses\nTD Savings: Personal savings (10% of all income)\nTD Chequing: Personal living expenses\n\nIMPORTANT REMINDERS\n✓ Set aside tax & savings IMMEDIATELY when payment arrives\n✓ Pay business expenses from Simplii going forward\n✓ Separate each payment''s budget — don''t mix\n✓ Track everything in the app'
);
