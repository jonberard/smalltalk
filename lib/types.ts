// ═══════════════════════════════════════════
// BUSINESSES
// ═══════════════════════════════════════════

export type Business = {
  id: string;
  name: string;
  logo_url: string | null;
  google_review_url: string;
  google_place_id: string | null;
  business_city: string | null;
  neighborhoods: string[] | null;
  stripe_customer_id: string | null;
  subscription_status: string;
  trial_requests_remaining: number;
  trial_ends_at: string | null;
  created_at: string;
};

export type BusinessInsert = {
  id: string;
  name: string;
  logo_url?: string | null;
  google_review_url: string;
  google_place_id?: string | null;
  business_city?: string | null;
  neighborhoods?: string[] | null;
  stripe_customer_id?: string | null;
  subscription_status?: string;
  trial_requests_remaining?: number;
  trial_ends_at?: string | null;
  created_at?: string;
};

export type BusinessUpdate = Partial<Omit<BusinessInsert, "id">>;

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
  created_at?: string;
};

export type ReviewLinkUpdate = Partial<Omit<ReviewLinkInsert, "id" | "business_id">>;

// ═══════════════════════════════════════════
// REVIEW SESSIONS
// ═══════════════════════════════════════════

export type ReviewSessionStatus = "created" | "in_progress" | "drafted" | "copied" | "posted";

export type FeedbackType = "public" | "private";

export type TopicSelection = {
  topic_id: string;
  label: string;
  follow_up_answer: string;
};

export type ReviewSession = {
  id: string;
  review_link_id: string;
  star_rating: number | null;
  topics_selected: TopicSelection[] | null;
  optional_text: string | null;
  generated_review: string | null;
  status: ReviewSessionStatus;
  feedback_type: FeedbackType;
  created_at: string;
  updated_at: string;
};

export type ReviewSessionInsert = {
  id?: string;
  review_link_id: string;
  star_rating?: number | null;
  topics_selected?: TopicSelection[] | null;
  optional_text?: string | null;
  generated_review?: string | null;
  status?: ReviewSessionStatus;
  feedback_type?: FeedbackType;
  created_at?: string;
  updated_at?: string;
};

export type ReviewSessionUpdate = Partial<Omit<ReviewSessionInsert, "id" | "review_link_id">>;
