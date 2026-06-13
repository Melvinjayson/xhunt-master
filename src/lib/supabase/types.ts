export type Role = 'platform_admin' | 'tenant_admin' | 'mission_creator' | 'analyst' | 'participant';
export type MissionStatus = 'draft' | 'active' | 'published' | 'paused' | 'archived';
export type Plan = 'starter' | 'growth' | 'enterprise';
export type RewardType = 'points' | 'badge' | 'coupon' | 'experience' | 'benefit';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface DbTenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: Plan;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'free' | 'trial' | 'pro';

export interface DbRateLimitConfig {
  tier: SubscriptionTier;
  ai_requests_per_day: number;
  can_access_premium_missions: boolean;
  model_id: string;
  updated_at: string;
}

export interface DbUserProfile {
  id: string;
  tenant_id: string | null;
  role: Role;
  display_name: string | null;
  avatar_url: string | null;
  interests: string[];
  goals: string[];
  onboarding_complete: boolean;
  // ── Freemium ──────────────────────────────────────────────
  subscription_tier: SubscriptionTier;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  ai_requests_today: number;
  ai_requests_reset_at: string;
  // ── Stripe ────────────────────────────────────────────────
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  // ──────────────────────────────────────────────────────────
  created_at: string;
  updated_at: string;
}

export interface DbMission {
  id: string;
  tenant_id: string;
  created_by: string | null;
  title: string;
  story_context: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: string | null;
  steps: DbStep[];
  reward: string;
  tags: string[];
  status: MissionStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbStep {
  id: number;
  type: 'action' | 'reflection' | 'discovery';
  instruction: string;
  success_criteria: string;
}

export interface DbMissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  tenant_id: string | null;
  current_step_index: number;
  completed_steps: number[];
  started_at: string;
  completed_at: string | null;
}

export interface DbRewardEvent {
  id: string;
  user_id: string;
  mission_id: string;
  tenant_id: string | null;
  reward_type: string;
  reward_value: Record<string, unknown>;
  redeemed: boolean;
  issued_at: string;
}

// ── Sprint 2 ──────────────────────────────────────────────────────────────────

export interface DbAudienceSegment {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  filters: AudienceFilters;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AudienceFilters {
  roles?: Role[];
  interests?: string[];
  geography?: string[];
  tags?: string[];
}

export interface DbRewardConfig {
  id: string;
  tenant_id: string;
  name: string;
  type: RewardType;
  value: RewardConfigValue;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardConfigValue {
  points?: number;
  badge_icon?: string;
  badge_label?: string;
  coupon_code?: string;
  discount_pct?: number;
  description?: string;
}

export interface DbAuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DbMissionApproval {
  id: string;
  mission_id: string;
  tenant_id: string;
  status: ApprovalStatus;
  reviewer_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Phase 2 ───────────────────────────────────────────────────────────────────

// ── Timeline ──────────────────────────────────────────────────────────────────

export type PostType   = 'completion' | 'moment' | 'highlight';
export type LiveStatus = 'scheduled' | 'live' | 'ended';

export interface DbExperiencePost {
  id:             string;
  user_id:        string;
  mission_id:     string | null;
  tenant_id:      string | null;
  post_type:      PostType;
  caption:        string | null;
  media_url:      string | null;
  metadata:       Record<string, unknown>;
  reaction_count: number;
  is_public:      boolean;
  created_at:     string;
}

export interface DbLiveSession {
  id:                 string;
  host_id:            string;
  mission_id:         string | null;
  tenant_id:          string | null;
  title:              string;
  description:        string | null;
  status:             LiveStatus;
  current_step_index: number;
  total_steps:        number;
  viewer_count:       number;
  is_pro_only:        boolean;
  started_at:         string | null;
  ended_at:           string | null;
  scheduled_for:      string | null;
  created_at:         string;
}

// ── Knowledge Graph ───────────────────────────────────────────────────────────

export type KgNodeType = 'user' | 'skill' | 'mission' | 'outcome' | 'reward' | 'organization' | 'industry';
export type KgRelationship = 'completes' | 'requires' | 'develops' | 'unlocks' | 'leads_to' | 'similar_to';
export type OutcomeType = 'skill_acquired' | 'task_completed' | 'product_adopted' | 'behavior_changed' | 'custom';

export interface DbKgNode {
  id: string;
  tenant_id: string | null;
  node_type: KgNodeType;
  label: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface DbKgEdge {
  id: string;
  tenant_id: string | null;
  from_node_id: string;
  to_node_id: string;
  relationship: KgRelationship | string;
  weight: number;
  created_at: string;
}

export interface DbMissionScore {
  id: string;
  mission_id: string;
  tenant_id: string | null;
  completion_score: number;
  engagement_score: number;
  retention_score: number;
  outcome_score: number;
  mei: number;
  sample_size: number;
  computed_at: string;
}

export interface DbOutcomeEvent {
  id: string;
  tenant_id: string | null;
  mission_id: string | null;
  user_id: string | null;
  outcome_type: OutcomeType | string;
  outcome_value: Record<string, unknown>;
  measured_at: string;
}

export interface DbOutcomeRoadmap {
  id: string;
  tenant_id: string;
  created_by: string | null;
  desired_outcome: string;
  roadmap: Record<string, unknown>;
  created_at: string;
}

// ── Outcomes Intelligence & Validation ────────────────────────────────────────

export type ValidationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_evidence';
export type ValidationType = 'self_reported' | 'peer_verified' | 'automated' | 'manager_verified';
export type EvidenceType = 'screenshot' | 'document' | 'url' | 'metric' | 'attestation' | 'certificate';

export interface ValidationEvidence {
  type: EvidenceType;
  label: string;
  url?: string;
  value?: string;
  submitted_at: string;
}

export interface DbOutcomeValidation {
  id: string;
  tenant_id: string;
  mission_id: string | null;
  user_id: string | null;
  outcome_event_id: string | null;
  status: ValidationStatus;
  validation_type: ValidationType;
  evidence: ValidationEvidence[];
  reviewer_id: string | null;
  reviewer_notes: string | null;
  confidence_score: number | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Escrow Services ───────────────────────────────────────────────────────────

export type EscrowStatus = 'created' | 'funded' | 'locked' | 'partially_released' | 'fully_released' | 'disputed' | 'refunded';
export type EscrowReleaseCondition = 'mei_threshold' | 'outcome_count' | 'manual_approval' | 'deadline_based' | 'hybrid';

export interface DbEscrowAccount {
  id: string;
  tenant_id: string;
  mission_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: EscrowStatus;
  release_condition: EscrowReleaseCondition;
  release_config: Record<string, unknown>;
  funded_at: string | null;
  released_at: string | null;
  released_amount_cents: number;
  dispute_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEscrowTransaction {
  id: string;
  escrow_id: string;
  tenant_id: string;
  transaction_type: 'fund' | 'release' | 'refund' | 'dispute_hold';
  amount_cents: number;
  stripe_transfer_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Event Spine ───────────────────────────────────────────────────────────────

export type MissionEventType =
  | 'mission_viewed'    | 'mission_started'    | 'mission_resumed'
  | 'step_started'      | 'step_completed'     | 'step_skipped'     | 'step_adapted'
  | 'reward_viewed'     | 'reward_claimed'     | 'mission_completed'
  | 'mission_abandoned' | 'mission_shared'     | 'ask_xeno'         | 'profile_match_viewed';

export interface DbMissionEvent {
  id:          string;
  user_id:     string;
  tenant_id:   string | null;
  mission_id:  string | null;
  step_id:     number | null;
  event_type:  MissionEventType;
  session_id:  string | null;
  duration_ms: number | null;
  client_ts:   string;
  metadata:    Record<string, unknown>;
  created_at:  string;
}

export type MissionStateName =
  | 'not_started' | 'active' | 'in_progress'
  | 'stalled'     | 'completed' | 'analyzed';

export interface DbMissionState {
  id:             string;
  user_id:        string;
  mission_id:     string;
  tenant_id:      string | null;
  state:          MissionStateName;
  previous_state: MissionStateName | null;
  entered_at:     string;
  metadata:       Record<string, unknown>;
  updated_at:     string;
}

// ── Revenue Manager ───────────────────────────────────────────────────────────

export type RevenueCategory = 'subscription' | 'mission_fee' | 'outcome_bonus' | 'escrow_release' | 'api_usage' | 'professional_services';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
  category: RevenueCategory;
}

export interface DbRevenueRecord {
  id: string;
  tenant_id: string;
  mission_id: string | null;
  escrow_id: string | null;
  stripe_payment_intent_id: string | null;
  category: RevenueCategory;
  amount_cents: number;
  currency: string;
  description: string;
  period_start: string | null;
  period_end: string | null;
  recognized_at: string;
  created_at: string;
}

export interface DbInvoice {
  id: string;
  tenant_id: string;
  stripe_invoice_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  amount_cents: number;
  currency: string;
  line_items: InvoiceLineItem[];
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
}

// ── XChat: Messaging ──────────────────────────────────────────────────────────

export type ConversationType = 'direct' | 'mission' | 'team' | 'organization' | 'community';
export type MemberRole = 'member' | 'moderator' | 'admin' | 'owner';
export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'mission_share' | 'system';

export interface DbConversation {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  mission_id: string | null;
  tenant_id: string | null;
  created_by: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  last_read_at: string | null;
  is_muted: boolean;
  joined_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  metadata: Record<string, unknown>;
  reply_to_id: string | null;
  is_deleted: boolean;
  is_encrypted: boolean;
  iv: string | null;
  edited_at: string | null;
  created_at: string;
}

export interface DbMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface DbMessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

// Enriched types used in the UI (joins resolved)
export interface MessageWithSender extends DbMessage {
  sender: { display_name: string | null; avatar_url: string | null } | null;
}

export interface ConversationWithDetails extends DbConversation {
  members: Array<{
    user_id: string;
    role: MemberRole;
    last_read_at: string | null;
    profile: { display_name: string | null; avatar_url: string | null } | null;
  }>;
  last_message: { content: string | null; sender_id: string; created_at: string } | null;
  unread_count: number;
}
