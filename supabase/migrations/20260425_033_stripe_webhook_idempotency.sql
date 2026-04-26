-- Track processed Stripe webhook events so retries are safe
create table if not exists processed_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  stripe_created_at timestamptz not null,
  processing_started_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_processed_webhook_events_processed_at
  on processed_webhook_events (processed_at);

revoke all on processed_webhook_events from anon;
revoke all on processed_webhook_events from authenticated;
