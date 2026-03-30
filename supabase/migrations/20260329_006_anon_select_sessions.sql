-- Allow anonymous users to select review sessions
-- needed because the insert uses .select("id") to return the new row

create policy "Anonymous can select review sessions"
  on review_sessions for select
  using (auth.role() = 'anon');
