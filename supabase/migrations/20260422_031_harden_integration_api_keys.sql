create extension if not exists pgcrypto;

alter table businesses
  add column if not exists api_key_hash text,
  add column if not exists api_key_last_four text;

update businesses
set
  api_key_hash = encode(digest(api_key, 'sha256'), 'hex'),
  api_key_last_four = right(api_key, 4)
where api_key is not null
  and api_key_hash is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'businesses_api_key_key'
  ) then
    alter table businesses drop constraint businesses_api_key_key;
  end if;
end $$;

drop index if exists idx_businesses_api_key;

create unique index if not exists idx_businesses_api_key_hash
  on businesses (api_key_hash)
  where api_key_hash is not null;

update businesses
set api_key = null
where api_key is not null;
