alter table admin_business_notes
add column if not exists reminder_due_at timestamptz;

create index if not exists idx_admin_business_notes_reminder_due_at
  on admin_business_notes (reminder_due_at)
  where reminder_due_at is not null;
