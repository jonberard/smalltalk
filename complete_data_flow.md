BUSINESS OWNER SIDE:
Dashboard Send → creates review_link in Supabase (business_id, service_id,
employee_id, customer_name, unique_code) → triggers Twilio SMS to customer

SMS contains: usesmalltalk.com/r/[unique_code]

CUSTOMER SIDE:
Customer taps link → /r/[code] page loads
  ↓
Page queries Supabase: review_links → businesses, services, employees
  ↓
Creates review_session (status: "created")
  ↓
Screen 1: Stars → saves star_rating, status: "in_progress"
  ↓
Determines tier (1-2 negative, 3 neutral, 4-5 positive)
  ↓
1-2 stars? → Show public/private fork
  ↓                              ↓
  Public path               Private path
  ↓                              ↓
Screen 2: Topic chips (from Supabase, tier-specific)
  ↓
Screen 3+: Follow-up per topic (spectrum + optional detail)
  ↓
Screen: Optional open text
  ↓                              ↓
  Public:                    Private:
  POST /api/generate-review  Save to session
  ↓                          feedback_type: "private"
  review-generator.ts        Show confirmation
  picks random voice         Notify owner via email
  applies tone layer         ↓
  calls Claude API           DONE
  ↓
Screen: Review draft (editable)
  "Try another" → calls API again, different voice
  ↓
"Copy & Post to Google"
  → clipboard copy
  → open Google review URL (deep link on mobile)
  → status: "copied"
  → if 1-2 stars: trigger /api/notify-owner
  ↓
Screen: Success + paste coaching

BACK ON THE DASHBOARD:
Owner opens dashboard → queries review_sessions
  → Stats cards update
  → Activity feed shows new entry
  → Needs Attention shows incomplete sessions
  → Nudge button re-sends SMS for stuck sessions
