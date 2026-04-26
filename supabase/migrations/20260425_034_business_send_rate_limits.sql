create table if not exists business_rate_limit_windows (
  business_id uuid not null references businesses(id) on delete cascade,
  bucket text not null,
  scope_key text not null default 'global',
  window_started_at timestamptz not null default now(),
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (business_id, bucket, scope_key)
);

create or replace function set_business_rate_limit_windows_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_business_rate_limit_windows_updated_at on business_rate_limit_windows;
create trigger trg_business_rate_limit_windows_updated_at
before update on business_rate_limit_windows
for each row
execute function set_business_rate_limit_windows_updated_at();

create or replace function consume_business_rate_limit(
  p_business_id uuid,
  p_bucket text,
  p_scope_key text default 'global',
  p_max_count integer default 50,
  p_window_seconds integer default 3600
)
returns table (
  allowed boolean,
  current_count integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope_key text := coalesce(nullif(p_scope_key, ''), 'global');
  v_window_started_at timestamptz;
  v_count integer;
begin
  insert into business_rate_limit_windows (
    business_id,
    bucket,
    scope_key,
    window_started_at,
    count,
    updated_at
  )
  values (
    p_business_id,
    p_bucket,
    v_scope_key,
    now(),
    1,
    now()
  )
  on conflict (business_id, bucket, scope_key)
  do update set
    count = case
      when business_rate_limit_windows.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else business_rate_limit_windows.count + 1
    end,
    window_started_at = case
      when business_rate_limit_windows.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else business_rate_limit_windows.window_started_at
    end,
    updated_at = now()
  returning count, window_started_at
  into v_count, v_window_started_at;

  allowed := v_count <= p_max_count;
  current_count := v_count;
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      0,
      p_window_seconds - floor(extract(epoch from (now() - v_window_started_at)))::integer
    )
  end;

  return next;
end;
$$;

alter table business_rate_limit_windows enable row level security;

revoke all on business_rate_limit_windows from anon;
revoke all on business_rate_limit_windows from authenticated;
