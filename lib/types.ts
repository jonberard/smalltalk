// ═══════════════════════════════════════════
// BUSINESSES
// ═══════════════════════════════════════════

export type Business = {
  id: string;
  name: string;
  owner_email: string | null;
  logo_url: string | null;
  google_review_url: string;
  google_place_id: string | null;
  business_city: string | null;
  neighborhoods: string[] | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  trial_requests_remaining: number;
  trial_ends_at: string | null;
  api_key: string | null;
  connected_crms: Record<string, unknown>;
  reply_voice_id: string;
  custom_reply_voice: string | null;
  onboarding_completed: boolean;
  reminder_sequence_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  business_timezone: string;
  created_at: string;
};

export type BusinessInsert = {
  id: string;
  name: string;
  owner_email?: string | null;
  logo_url?: string | null;
  google_review_url?: string;
  google_place_id?: string | null;
  business_city?: string | null;
  neighborhoods?: string[] | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string;
  trial_requests_remaining?: number;
  trial_ends_at?: string | null;
  api_key?: string | null;
  connected_crms?: Record<string, unknown>;
  reply_voice_id?: string;
  custom_reply_voice?: string | null;
  onboarding_completed?: boolean;
  reminder_sequence_enabled?: boolean;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  business_timezone?: string;
  created_at?: string;
};

export type BusinessUpdate = Partial<Omit<BusinessInsert, "id">>;

// ═══════════════════════════════════════════
// ADMIN USERS
// ═══════════════════════════════════════════

export type AdminRole = "founder" | "operator" | "support";

export type AdminUser = {
  user_id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
};

export type AdminBusinessFollowUpStatus =
  | "none"
  | "watching"
  | "follow_up"
  | "blocked"
  | "resolved";

export type AdminBusinessNote = {
  business_id: string;
  follow_up_status: AdminBusinessFollowUpStatus;
  note: string | null;
  reminder_due_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportMessageCategory =
  | "setup_help"
  | "feature_question"
  | "bug_report"
  | "suggestion"
  | "billing";

export type SupportMessageStatus = "new" | "reviewed" | "closed";

export type SupportMessage = {
  id: string;
  business_id: string;
  owner_user_id: string | null;
  owner_email: string | null;
  category: SupportMessageCategory;
  message: string;
  status: SupportMessageStatus;
  founder_email_sent_at: string | null;
  founder_email_error: string | null;
  created_at: string;
  updated_at: string;
};

export type AiProvider = "anthropic" | "openai" | "gemini";
export type AiRoutingMode = "auto" | "force";
export type AiGenerationFeature = "review" | "reply";

export type AdminAiSettings = {
  id: string;
  routing_mode: AiRoutingMode;
  primary_provider: AiProvider;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AiGenerationEvent = {
  id: string;
  feature: AiGenerationFeature;
  provider: AiProvider;
  model: string;
  success: boolean;
  latency_ms: number | null;
  fallback_step: number;
  routing_mode: AiRoutingMode;
  primary_provider: AiProvider;
  error_message: string | null;
  created_at: string;
};

// ═══════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════

export type Service = {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
};

export type ServiceInsert = {
  id?: string;
  business_id: string;
  name: string;
  created_at?: string;
};

export type ServiceUpdate = Partial<Omit<ServiceInsert, "id" | "business_id">>;

// ═══════════════════════════════════════════
// EMPLOYEES
// ═══════════════════════════════════════════

export type Employee = {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
};

export type EmployeeInsert = {
  id?: string;
  business_id: string;
  name: string;
  created_at?: string;
};

export type EmployeeUpdate = Partial<Omit<EmployeeInsert, "id" | "business_id">>;

// ═══════════════════════════════════════════
// TOPICS
// ═══════════════════════════════════════════

export type TopicTier = "positive" | "neutral" | "negative";

export type Topic = {
  id: string;
  business_id: string | null;
  label: string;
  tier: TopicTier;
  follow_up_question: string;
  follow_up_options: string[];
  sort_order: number;
  created_at: string;
};

export type TopicInsert = {
  id?: string;
  business_id?: string | null;
  label: string;
  tier: TopicTier;
  follow_up_question: string;
  follow_up_options: string[];
  sort_order?: number;
  created_at?: string;
};

export type TopicUpdate = Partial<Omit<TopicInsert, "id" | "business_id">>;

// ═══════════════════════════════════════════
// REVIEW LINKS
// ═══════════════════════════════════════════

export type ReviewLink = {
  id: string;
  business_id: string;
  service_id: string;
  employee_id: string | null;
  customer_name: string;
  customer_contact: string;
  unique_code: string;
  source: string;
  is_generic: boolean;
  reminder_sequence_enabled: boolean;
  sequence_completed: boolean;
  initial_sent_at: string | null;
  created_at: string;
};

export type ReviewLinkInsert = {
  id?: string;
  business_id: string;
  service_id: string;
  employee_id?: string | null;
  customer_name: string;
  customer_contact: string;
  unique_code: string;
  source?: string;
  is_generic?: boolean;
  reminder_sequence_enabled?: boolean;
  sequence_completed?: boolean;
  initial_sent_at?: string | null;
  created_at?: string;
};

export type ReviewLinkUpdate = Partial<Omit<ReviewLinkInsert, "id" | "business_id">>;

// ═══════════════════════════════════════════
// REVIEW SESSIONS
// ═══════════════════════════════════════════

export type ReviewSessionStatus = "created" | "in_progress" | "drafted" | "copied" | "posted";

export type FeedbackType = "public" | "private";
export type PrivateFeedbackStatus = "new" | "handled";

export type TopicSelection = {
  topic_id: string;
  label: string;
  follow_up_answer: string;
};

export type ReviewSession = {
  id: string;
  review_link_id: string;
  device_token: string | null;
  customer_contact: string | null;
  star_rating: number | null;
  topics_selected: TopicSelection[] | null;
  optional_text: string | null;
  generated_review: string | null;
  status: ReviewSessionStatus;
  feedback_type: FeedbackType;
  private_feedback_status: PrivateFeedbackStatus;
  private_feedback_handled_at: string | null;
  parent_private_feedback_session_id: string | null;
  generation_count: number;
  reply_generation_count: number;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewSessionInsert = {
  id?: string;
  review_link_id: string;
  device_token?: string | null;
  customer_contact?: string | null;
  star_rating?: number | null;
  topics_selected?: TopicSelection[] | null;
  optional_text?: string | null;
  generated_review?: string | null;
  status?: ReviewSessionStatus;
  feedback_type?: FeedbackType;
  private_feedback_status?: PrivateFeedbackStatus;
  private_feedback_handled_at?: string | null;
  parent_private_feedback_session_id?: string | null;
  reply_text?: string | null;
  replied_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ReviewSessionUpdate = Partial<Omit<ReviewSessionInsert, "id" | "review_link_id">>;

// ═══════════════════════════════════════════
// REVIEW MESSAGE DELIVERIES
// ═══════════════════════════════════════════

export type ReviewMessageDeliveryKind = "initial" | "reminder_1" | "reminder_2";
export type ReviewMessageDeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export type ReviewMessageDelivery = {
  id: string;
  review_link_id: string;
  business_id: string;
  channel: "sms" | "email";
  kind: ReviewMessageDeliveryKind;
  status: ReviewMessageDeliveryStatus;
  scheduled_for: string;
  sent_at: string | null;
  claimed_at: string | null;
  attempt_count: number;
  provider_sid: string | null;
  last_error: string | null;
  skipped_reason: string | null;
  to_address: string;
  normalized_phone: string | null;
  message_body: string | null;
  created_at: string;
  updated_at: string;
};
