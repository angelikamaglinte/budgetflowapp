-- Points the existing recurring-expense-fired notification (sent by the
-- daily-automations cron job) at the new Budgets tab with friendlier
-- wording, instead of the generic "was auto-logged" message pointing to
-- /expenses. Everything else in run_daily_automations() is unchanged.
CREATE OR REPLACE FUNCTION public.run_daily_automations()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  today DATE := CURRENT_DATE;
  this_period TEXT := TO_CHAR(today, 'YYYY-MM');
  today_day INT := EXTRACT(DAY FROM today);
  days_in_month INT := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', today) + INTERVAL '1 MONTH - 1 DAY'));
  r RECORD;
  effective_day INT;
  invoice_num TEXT;
  subtotal_amount NUMERIC;
  total_amount NUMERIC;
  computed_due_date DATE;
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
        '💳 ' || r.title || ' (' || to_char(r.amount, 'FM$999,999,990.00') || ') was just charged — check your updated budgeting.',
        '/budgets'
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
      computed_due_date := CASE WHEN r.due_in_days IS NOT NULL THEN today + r.due_in_days ELSE NULL END;

      SELECT COALESCE(SUM((item->>'qty')::numeric * (item->>'rate')::numeric), 0)
      INTO subtotal_amount
      FROM jsonb_array_elements(r.line_items) AS item;
      total_amount := subtotal_amount * (1 + r.tax_rate / 100);

      INSERT INTO pdf_invoices (
        user_id, invoice_number, invoice_date, due_date, terms,
        client_name, client_company, client_address, tax_rate,
        thank_you_note, line_items
      )
      VALUES (
        r.user_id, invoice_num, today, computed_due_date,
        r.terms, r.client_name, r.client_company, r.client_address, r.tax_rate,
        r.thank_you_note, r.line_items
      );

      INSERT INTO invoices (user_id, invoice_number, client_name, amount, status, issue_date, due_date)
      VALUES (r.user_id, invoice_num, r.client_name, total_amount, 'pending', today, computed_due_date);

      UPDATE recurring_invoices
      SET last_run_period = this_period, next_sequence = next_sequence + 1
      WHERE id = r.id;

      INSERT INTO notifications (user_id, message, link)
      VALUES (
        r.user_id,
        'Recurring invoice "' || invoice_num || '" for ' || r.client_name || ' was auto-created.',
        '/invoices'
      );
    END IF;
  END LOOP;

  -- Invoice reminders (Scheduler/Calendar)
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
$function$;
