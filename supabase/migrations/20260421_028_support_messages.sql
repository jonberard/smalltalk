create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_email text,
  category text not null
    check (category in ('setup_help', 'feature_question', 'bug_report', 'suggestion', 'billing')),
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'closed')),
  founder_email_sent_at timestamptz,
  founder_email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_messages_status_created_at
  on support_messages (status, created_at desc);

create index if not exists idx_support_messages_business_id_created_at
  on support_messages (business_id, created_at desc);

alter table support_messages enable row level security;
