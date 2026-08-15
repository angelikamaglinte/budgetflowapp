-- Scheduler: recurring monthly invoice reminders
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_name      TEXT        NOT NULL,
  reminder_day     SMALLINT    NOT NULL CHECK (reminder_day BETWEEN 1 AND 31),
  notes            TEXT,
  dismissed_period TEXT, -- 'YYYY-MM' of the last period this reminder's banner was dismissed for
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoice reminders"
  ON invoice_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice reminders"
  ON invoice_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice reminders"
  ON invoice_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice reminders"
  ON invoice_reminders FOR DELETE
  USING (auth.uid() = user_id);
