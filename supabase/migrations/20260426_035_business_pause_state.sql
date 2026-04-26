alter table businesses
add column if not exists paused_until timestamptz;
