create table budget_categories (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  name             text not null,
  monthly_target   numeric(10,2) not null,
  source_type      text not null check (source_type in ('expense', 'bucket')),
  expense_category text,
  bucket_id        uuid references payout_buckets(id) on delete set null,
  sort_order       integer not null default 0,
  created_at       timestamptz default now()
);

alter table budget_categories enable row level security;

create policy "Users can view their own budget categories"
  on budget_categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budget categories"
  on budget_categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budget categories"
  on budget_categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own budget categories"
  on budget_categories for delete
  using (auth.uid() = user_id);
