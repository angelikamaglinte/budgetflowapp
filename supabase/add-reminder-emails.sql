-- Extends the daily automation to also email you when an invoice reminder
-- (Scheduler/Calendar) becomes due, not just recurring expenses/invoices.
-- Fires once per period the first day a reminder becomes due, tracked
-- separately from dismissed_period (which is only for the in-app banner).

ALTER TABLE invoice_reminders ADD COLUMN IF NOT EXISTS notified_period TEXT;

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

  -- Invoice reminders (Scheduler/Calendar) — notify once per period the
  -- first day they become due, independent of the in-app dismiss state.
  FOR r IN
    SELECT * FROM invoice_reminders
    WHERE notified_period IS NULL OR notified_period <> this_period
  LOOP
    effective_day := LEAST(r.reminder_day, days_in_month);
    IF today_day >= effective_day THEN
      UPDATE invoice_reminders SET notified_period = this_period WHERE id = r.id;

      INSERT INTO notifications (user_id, message, link)
      VALUES (
        r.user_id,
        'Time to invoice ' || r.client_name || '.',
        '/dashboard'
      );
    END IF;
  END LOOP;
END;
$$;
