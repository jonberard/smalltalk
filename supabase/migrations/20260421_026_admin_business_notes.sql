create table if not exists admin_business_notes (
  business_id uuid primary key references businesses(id) on delete cascade,
  follow_up_status text not null default 'none'
    check (follow_up_status in ('none', 'watching', 'follow_up', 'blocked', 'resolved')),
  note text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_business_notes_follow_up_status
  on admin_business_notes (follow_up_status)
  where follow_up_status <> 'none';

alter table admin_business_notes enable row level security;
