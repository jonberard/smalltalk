create table if not exists admin_users (
  user_id uuid primary key,
  email text not null,
  role text not null default 'founder' check (role in ('founder', 'operator', 'support')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_admin_users_email on admin_users (lower(email));

alter table admin_users enable row level security;

drop policy if exists "admin_users_select_own" on admin_users;
create policy "admin_users_select_own"
  on admin_users
  for select
  using (auth.uid() = user_id);
