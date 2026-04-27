alter table businesses
add column if not exists cancel_scheduled_for timestamptz;
