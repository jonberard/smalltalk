-- Review links and review sessions

create table review_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  customer_name text not null,
  customer_contact text not null,
  unique_code text not null,
  created_at timestamptz not null default now()
);

create unique index idx_review_links_unique_code on review_links(unique_code);

create table review_sessions (
  id uuid primary key default gen_random_uuid(),
  review_link_id uuid not null references review_links(id) on delete cascade,
  star_rating integer check (star_rating between 1 and 5),
  topics_selected jsonb,
  optional_text text,
  generated_review text,
  status text not null default 'created',
  feedback_type text not null default 'public' check (feedback_type in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_review_sessions_link_id on review_sessions(review_link_id);
create index idx_review_sessions_status on review_sessions(status);
