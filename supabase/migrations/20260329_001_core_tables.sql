-- Core tables: businesses, services, employees

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  google_review_url text not null,
  stripe_customer_id text,
  subscription_status text not null default 'trial',
  trial_requests_remaining integer not null default 10,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
