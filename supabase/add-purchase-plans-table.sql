-- Purchase Savings Calculator: saved what-if purchases
CREATE TABLE IF NOT EXISTS purchase_plans (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name   TEXT          NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price > 0),
  target_date DATE,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE purchase_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchase plans"
  ON purchase_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase plans"
  ON purchase_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase plans"
  ON purchase_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase plans"
  ON purchase_plans FOR DELETE
  USING (auth.uid() = user_id);
