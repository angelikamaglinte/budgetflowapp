-- Automations: recurring expenses, recurring invoices, and the in-app
-- notification bell that tells you what happened while you were away.
--
-- No Edge Function needed — the automation logic is a plain SQL function
-- that pg_cron calls directly once a day. This runs with the same access
-- as the "postgres" role that schedules it, so it can see all users' data
-- (a cron job has no logged-in user / auth.uid() context, so normal RLS
-- wouldn't apply anyway).

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---- Recurring Expenses -----------------------------------------
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT          NOT NULL,
  vendor          TEXT,
  category        TEXT          NOT NULL,
  type            TEXT          NOT NULL DEFAULT 'business',
  amount          NUMERIC(10,2) NOT NULL,
  day_of_month    SMALLINT      NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  notes           TEXT,
  active          BOOLEAN       NOT NULL DEFAULT true,
  last_run_period TEXT, -- 'YYYY-MM' of the last period this template fired
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring expenses"
  ON recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring expenses"
  ON recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring expenses"
  ON recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring expenses"
  ON recurring_expenses FOR DELETE USING (auth.uid() = user_id);


-- ---- Recurring Invoices -------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name           TEXT          NOT NULL,
  client_company        TEXT,
  client_address        TEXT,
  terms                 TEXT,
  tax_rate              NUMERIC(5,3)  NOT NULL DEFAULT 0,
  thank_you_note        TEXT          DEFAULT 'Thank you for your business!',
  line_items            JSONB         NOT NULL DEFAULT '[]', -- [{description, qty, rate}]
  invoice_number_prefix TEXT          NOT NULL DEFAULT 'INV',
  next_sequence         INTEGER       NOT NULL DEFAULT 1,
  due_in_days           SMALLINT,
  day_of_month          SMALLINT      NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  active                BOOLEAN       NOT NULL DEFAULT true,
  last_run_period       TEXT,
  created_at            TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring invoices"
  ON recurring_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring invoices"
  ON recurring_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring invoices"
  ON recurring_invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring invoices"
  ON recurring_invoices FOR DELETE USING (auth.uid() = user_id);


-- ---- Notifications --------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message    TEXT        NOT NULL,
  link       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications"
  ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);


-- ---- The automation itself -------------------------------------------
CREATE OR REPLACE FUNCTION run_daily_automations()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  this_period TEXT := TO_CHAR(today, 'YYYY-MM');
  today_day INT := EXTRACT(DAY FROM today);
  days_in_month INT := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', today) + INTERVAL '1 MONTH - 1 DAY'));
  r RECORD;
  effective_day INT;
  invoice_num TEXT;
BEGIN
  -- Recurring expenses
  FOR r IN
    SELECT * FROM recurring_expenses
    WHERE active = true AND (last_run_period IS NULL OR last_run_period <> this_period)
  LOOP
    effective_day := LEAST(r.day_of_month, days_in_month);
    IF today_day >= effective_day THEN
      INSERT INTO expenses (user_id, date, title, vendor, category, type, amount, notes)
      VALUES (r.user_id, today, r.title, r.vendor, r.category, r.type, r.amount, r.notes);

      UPDATE recurring_expenses SET last_run_period = this_period WHERE id = r.id;

      INSERT INTO notifications (user_id, message, link)
      VALUES (
        r.user_id,
        'Recurring expense "' || r.title || '" ($' || r.amount || ') was auto-logged.',
        '/expenses'
      );
    END IF;
  END LOOP;

  -- Recurring invoices
  FOR r IN
    SELECT * FROM recurring_invoices
    WHERE active = true AND (last_run_period IS NULL OR last_run_period <> this_period)
  LOOP
    effective_day := LEAST(r.day_of_month, days_in_month);
    IF today_day >= effective_day THEN
      invoice_num := r.invoice_number_prefix || '-' || LPAD(r.next_sequence::TEXT, 3, '0');

      INSERT INTO pdf_invoices (
        user_id, invoice_number, invoice_date, due_date, terms,
        client_name, client_company, client_address, tax_rate,
        thank_you_note, line_items
      )
      VALUES (
        r.user_id, invoice_num, today,
        CASE WHEN r.due_in_days IS NOT NULL THEN today + r.due_in_days ELSE NULL END,
        r.terms, r.client_name, r.client_company, r.client_address, r.tax_rate,
        r.thank_you_note, r.line_items
      );

      UPDATE recurring_invoices
      SET last_run_period = this_period, next_sequence = next_sequence + 1
      WHERE id = r.id;

      INSERT INTO notifications (user_id, message, link)
      VALUES (
        r.user_id,
        'Recurring invoice "' || invoice_num || '" for ' || r.client_name || ' was auto-created.',
        '/tools'
      );
    END IF;
  END LOOP;
END;
$$;

-- Runs once a day at 9am UTC. Re-running this line is safe — it replaces
-- any existing schedule with the same name instead of creating a duplicate.
SELECT cron.unschedule('daily-automations') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-automations'
);
SELECT cron.schedule('daily-automations', '0 9 * * *', $$ SELECT run_daily_automations(); $$);
