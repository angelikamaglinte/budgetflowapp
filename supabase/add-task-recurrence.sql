alter table tasks add column if not exists due_time text;
alter table tasks add column if not exists all_day boolean not null default true;
alter table tasks add column if not exists recurrence_rule text;
alter table tasks add column if not exists link_url text;
alter table tasks add column if not exists description text;

create table if not exists task_completions (
  id             uuid default gen_random_uuid() primary key,
  task_id        uuid references tasks(id) on delete cascade not null,
  user_id        uuid references auth.users(id) on delete cascade not null,
  occurrence_date date not null,
  completed_at   timestamptz default now(),
  unique (task_id, occurrence_date)
);

alter table task_completions enable row level security;

create policy "Users can view their own task completions"
  on task_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own task completions"
  on task_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own task completions"
  on task_completions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own task completions"
  on task_completions for delete
  using (auth.uid() = user_id);
