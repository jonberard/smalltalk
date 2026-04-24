alter table businesses
  add column if not exists batch_initial_sms_enabled boolean default false,
  add column if not exists batch_initial_sms_hour integer default 18
    check (batch_initial_sms_hour >= 0 and batch_initial_sms_hour <= 23);

create or replace function claim_due_review_message_deliveries(p_limit integer default 50)
returns setof review_message_deliveries
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update review_message_deliveries
  set claimed_at = now(),
      updated_at = now()
  where id in (
    select id
    from review_message_deliveries
    where status = 'pending'
      and channel = 'sms'
      and kind in ('initial', 'reminder_1', 'reminder_2')
      and scheduled_for <= now()
      and (claimed_at is null or claimed_at < now() - interval '10 minutes')
      and attempt_count < 3
    order by scheduled_for asc
    limit p_limit
    for update skip locked
  )
  returning *;
end;
$$;

grant update (batch_initial_sms_enabled, batch_initial_sms_hour)
  on businesses to authenticated;
