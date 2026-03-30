-- Topics table + default seed data

create table topics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  label text not null,
  tier text not null check (tier in ('positive', 'neutral', 'negative')),
  follow_up_question text not null,
  follow_up_options text[] not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_topics_business_id on topics(business_id);
create index idx_topics_tier on topics(tier);

-- ═══════════════════════════════════════════
-- POSITIVE TIER
-- ═══════════════════════════════════════════

insert into topics (business_id, label, tier, follow_up_question, follow_up_options, sort_order) values
  (null, 'Timeliness',          'positive', 'How was the timing?',                  array['Early', 'Right on time', 'A bit late', 'Very late'], 1),
  (null, 'Work Quality',        'positive', 'How was the quality?',                 array['Exceptional', 'Solid', 'Acceptable', 'Needs improvement'], 2),
  (null, 'Communication',       'positive', 'How was communication?',               array['Excellent', 'Good', 'Could improve', 'Poor'], 3),
  (null, 'Pricing/Value',       'positive', 'How was the value?',                   array['Great deal', 'Fair price', 'A bit high', 'Overpriced'], 4),
  (null, 'Professionalism',     'positive', 'How professional was the service?',    array['Outstanding', 'Professional', 'Adequate', 'Unprofessional'], 5),
  (null, 'Cleanliness',         'positive', 'How clean was everything after?',      array['Spotless', 'Clean', 'Mostly clean', 'Left a mess'], 6),
  (null, 'Went Above & Beyond', 'positive', 'What surprised you?',                 array['Noticed something I missed', 'Stayed late to finish', 'Went out of their way', 'Checked in after'], 7),
  (null, 'Would Recommend',     'positive', 'Who would you recommend them to?',     array['Everyone', 'Friends & family', 'Anyone with the same issue', 'With some reservations'], 8);

-- ═══════════════════════════════════════════
-- NEUTRAL TIER
-- ═══════════════════════════════════════════

insert into topics (business_id, label, tier, follow_up_question, follow_up_options, sort_order) values
  (null, 'Timeliness',          'neutral', 'How was the timing?',                   array['Early', 'Right on time', 'A bit late', 'Very late'], 1),
  (null, 'Work Quality',        'neutral', 'How was the quality?',                  array['Exceptional', 'Solid', 'Acceptable', 'Needs improvement'], 2),
  (null, 'Communication',       'neutral', 'How was communication?',                array['Excellent', 'Good', 'Could improve', 'Poor'], 3),
  (null, 'Pricing/Value',       'neutral', 'How was the value?',                    array['Great deal', 'Fair price', 'A bit high', 'Overpriced'], 4),
  (null, 'Professionalism',     'neutral', 'How professional was the service?',     array['Outstanding', 'Professional', 'Adequate', 'Unprofessional'], 5),
  (null, 'Cleanliness',         'neutral', 'How clean was everything after?',       array['Spotless', 'Clean', 'Mostly clean', 'Left a mess'], 6),
  (null, 'What Went Well',      'neutral', 'What was the bright spot?',             array['The end result', 'The person', 'The price', 'The convenience'], 7),
  (null, 'What Could Improve',  'neutral', 'What would make it better next time?',  array['Better timing', 'Better communication', 'More thorough work', 'More reasonable pricing'], 8);

-- ═══════════════════════════════════════════
-- NEGATIVE TIER
-- ═══════════════════════════════════════════

insert into topics (business_id, label, tier, follow_up_question, follow_up_options, sort_order) values
  (null, 'Timeliness',              'negative', 'How was the timing?',                  array['Early', 'Right on time', 'A bit late', 'Very late'], 1),
  (null, 'Work Quality',            'negative', 'How was the quality?',                 array['Exceptional', 'Solid', 'Acceptable', 'Needs improvement'], 2),
  (null, 'Communication',           'negative', 'How was communication?',               array['Excellent', 'Good', 'Could improve', 'Poor'], 3),
  (null, 'Pricing/Value',           'negative', 'How was the value?',                   array['Great deal', 'Fair price', 'A bit high', 'Overpriced'], 4),
  (null, 'Professionalism',         'negative', 'How professional was the service?',    array['Outstanding', 'Professional', 'Adequate', 'Unprofessional'], 5),
  (null, 'Cleanliness',             'negative', 'How clean was everything after?',      array['Spotless', 'Clean', 'Mostly clean', 'Left a mess'], 6),
  (null, 'Responsiveness',          'negative', 'How responsive were they?',            array['Slow to reply', 'Hard to reach', 'Never responded', 'Ignored my concerns'], 7),
  (null, 'Follow-Through',          'negative', 'Did they follow through?',             array['Partially', 'Made promises but didn''t deliver', 'Had to keep asking', 'Not at all'], 8),
  (null, 'Didn''t Fix the Problem', 'negative', 'What happened?',                      array['Same issue returned', 'Told it was fixed but wasn''t', 'Never fully addressed', 'Made it worse'], 9);
