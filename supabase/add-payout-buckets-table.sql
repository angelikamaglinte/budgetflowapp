create table payout_buckets (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  percentage numeric(5,2),
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table payout_buckets enable row level security;

create policy "Users can view their own payout buckets"
  on payout_buckets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own payout buckets"
  on payout_buckets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own payout buckets"
  on payout_buckets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own payout buckets"
  on payout_buckets for delete
  using (auth.uid() = user_id);

-- percentage = null marks the "remainder" bucket that absorbs whatever's
-- left over — at most one per user.
create unique index payout_buckets_one_remainder_per_user
  on payout_buckets(user_id)
  where percentage is null;
