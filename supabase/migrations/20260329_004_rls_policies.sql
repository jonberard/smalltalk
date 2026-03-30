-- Row-level security policies

-- ═══════════════════════════════════════════
-- BUSINESSES
-- ═══════════════════════════════════════════

alter table businesses enable row level security;

create policy "Users can select own business"
  on businesses for select
  using (auth.uid() = id);

create policy "Users can insert own business on signup"
  on businesses for insert
  with check (auth.uid() = id);

create policy "Users can update own business"
  on businesses for update
  using (auth.uid() = id);

-- ═══════════════════════════════════════════
-- SERVICES
-- ═══════════════════════════════════════════

alter table services enable row level security;

create policy "Users can select own services"
  on services for select
  using (business_id = auth.uid());

create policy "Users can insert own services"
  on services for insert
  with check (business_id = auth.uid());

create policy "Users can update own services"
  on services for update
  using (business_id = auth.uid());

create policy "Users can delete own services"
  on services for delete
  using (business_id = auth.uid());

-- ═══════════════════════════════════════════
-- EMPLOYEES
-- ═══════════════════════════════════════════

alter table employees enable row level security;

create policy "Users can select own employees"
  on employees for select
  using (business_id = auth.uid());

create policy "Users can insert own employees"
  on employees for insert
  with check (business_id = auth.uid());

create policy "Users can update own employees"
  on employees for update
  using (business_id = auth.uid());

create policy "Users can delete own employees"
  on employees for delete
  using (business_id = auth.uid());

-- ═══════════════════════════════════════════
-- TOPICS
-- ═══════════════════════════════════════════

alter table topics enable row level security;

create policy "Users can select own topics"
  on topics for select
  using (business_id = auth.uid());

create policy "Anyone can select global default topics"
  on topics for select
  using (business_id is null);

create policy "Users can insert own topics"
  on topics for insert
  with check (business_id = auth.uid());

create policy "Users can update own topics"
  on topics for update
  using (business_id = auth.uid());

create policy "Users can delete own topics"
  on topics for delete
  using (business_id = auth.uid());

-- ═══════════════════════════════════════════
-- REVIEW LINKS
-- ═══════════════════════════════════════════

alter table review_links enable row level security;

create policy "Users can select own review links"
  on review_links for select
  using (business_id = auth.uid());

create policy "Users can insert own review links"
  on review_links for insert
  with check (business_id = auth.uid());

create policy "Users can update own review links"
  on review_links for update
  using (business_id = auth.uid());

create policy "Anonymous can select review link by code"
  on review_links for select
  using (auth.role() = 'anon');

-- ═══════════════════════════════════════════
-- REVIEW SESSIONS
-- ═══════════════════════════════════════════

alter table review_sessions enable row level security;

create policy "Users can select own review sessions"
  on review_sessions for select
  using (
    exists (
      select 1 from review_links
      where review_links.id = review_sessions.review_link_id
        and review_links.business_id = auth.uid()
    )
  );

create policy "Anonymous can insert review sessions"
  on review_sessions for insert
  with check (auth.role() = 'anon');

create policy "Anonymous can update review sessions"
  on review_sessions for update
  using (auth.role() = 'anon');
