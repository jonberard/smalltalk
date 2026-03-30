-- Allow anonymous users to read business/service/employee data
-- needed for the consumer review flow (no auth required)

create policy "Anonymous can select businesses"
  on businesses for select
  using (auth.role() = 'anon');

create policy "Anonymous can select services"
  on services for select
  using (auth.role() = 'anon');

create policy "Anonymous can select employees"
  on employees for select
  using (auth.role() = 'anon');
