ALTER TABLE businesses ADD COLUMN onboarding_completed boolean DEFAULT false;

-- Mark existing businesses as onboarded so they aren't forced through the flow
UPDATE businesses SET onboarding_completed = true;
