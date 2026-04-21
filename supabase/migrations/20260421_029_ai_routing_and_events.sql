create table if not exists admin_ai_settings (
  id text primary key,
  routing_mode text not null default 'auto'
    check (routing_mode in ('auto', 'force')),
  primary_provider text not null default 'anthropic'
    check (primary_provider in ('anthropic', 'openai', 'gemini')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into admin_ai_settings (id, routing_mode, primary_provider)
values ('global', 'auto', 'anthropic')
on conflict (id) do nothing;

create table if not exists ai_generation_events (
  id uuid primary key default gen_random_uuid(),
  feature text not null
    check (feature in ('review', 'reply')),
  provider text not null
    check (provider in ('anthropic', 'openai', 'gemini')),
  model text not null,
  success boolean not null,
  latency_ms integer,
  fallback_step integer not null default 0,
  routing_mode text not null
    check (routing_mode in ('auto', 'force')),
  primary_provider text not null
    check (primary_provider in ('anthropic', 'openai', 'gemini')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_generation_events_created_at
  on ai_generation_events (created_at desc);

create index if not exists idx_ai_generation_events_provider_created_at
  on ai_generation_events (provider, created_at desc);

create index if not exists idx_ai_generation_events_feature_created_at
  on ai_generation_events (feature, created_at desc);

alter table admin_ai_settings enable row level security;
alter table ai_generation_events enable row level security;
