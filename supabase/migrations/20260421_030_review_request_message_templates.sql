alter table businesses
  add column if not exists review_request_sms_template text,
  add column if not exists review_request_email_subject_template text,
  add column if not exists review_request_email_intro_template text;
