with duplicate_topics as (
  select
    id,
    row_number() over (
      partition by business_id, label, tier
      order by created_at, id
    ) as row_num
  from topics
  where business_id is not null
)
delete from topics
where id in (
  select id
  from duplicate_topics
  where row_num > 1
);

drop index if exists idx_topics_business_label_tier_unique;

create unique index if not exists idx_topics_business_label_tier_unique
on topics (business_id, label, tier);
