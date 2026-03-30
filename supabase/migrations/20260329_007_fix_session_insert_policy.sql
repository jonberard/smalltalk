-- Fix: allow any user (anon or authenticated) to insert/update review sessions
-- The previous anon-only policy blocked authenticated users testing the consumer flow

drop policy "Anonymous can insert review sessions" on review_sessions;
drop policy "Anonymous can update review sessions" on review_sessions;

create policy "Anyone can insert review sessions"
  on review_sessions for insert
  with check (true);

create policy "Anyone can update review sessions"
  on review_sessions for update
  using (true);
