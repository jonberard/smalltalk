-- Add stripe_subscription_id column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update subscription_status default from 'trial' to 'none' for new signups
-- (Stripe now manages the trial via checkout with trial_period_days: 7)
ALTER TABLE businesses ALTER COLUMN subscription_status SET DEFAULT 'none';
