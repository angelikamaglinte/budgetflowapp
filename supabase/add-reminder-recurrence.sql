alter table invoice_reminders add column if not exists recurrence_rule text;
alter table invoice_reminders add column if not exists anchor_date date;
alter table invoice_reminders add column if not exists dismissed_occurrence_date date;

-- New reminders no longer collect reminder_day — it's superseded by
-- recurrence_rule/anchor_date. Kept nullable (not dropped) purely as a
-- rollback safety net for the rows that already have a real value.
alter table invoice_reminders alter column reminder_day drop not null;

-- Backfill existing rows from their reminder_day into an equivalent monthly
-- RRULE + anchor_date, so every reminder the user already has keeps working
-- the moment the app switches to reading recurrence_rule. reminder_day and
-- dismissed_period are deliberately left in place, unused, as a rollback
-- path on a feature that affects real client-invoicing reminders.
-- reminder_day = 31 becomes BYMONTHDAY=-1 (RRULE's native "last day of the
-- month"), not the literal BYMONTHDAY=31 — RRULE skips any month shorter
-- than 31 days outright for a literal day-31 rule, which would silently
-- drop this reminder in 7 months of the year. -1 is what a day-31 reminder
-- always actually meant (see src/lib/recurrence.ts's own day-31 handling).
update invoice_reminders
  set anchor_date = (date_trunc('month', current_date) + (least(reminder_day, 28) - 1) * interval '1 day')::date,
      recurrence_rule = case
        when reminder_day = 31 then 'RRULE:FREQ=MONTHLY;BYMONTHDAY=-1'
        else 'RRULE:FREQ=MONTHLY;BYMONTHDAY=' || reminder_day
      end
  where recurrence_rule is null;
