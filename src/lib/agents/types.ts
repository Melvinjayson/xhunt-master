export type AgentId =
  | 'mission-architect'
  | 'outcome-planner'
  | 'experience-designer'
  | 'behavioral-analyst'
  | 'knowledge-agent'
  | 'insight-analyst'
  | 'economy-coordinator'
  | 'discovery-agent'
  | 'community-catalyst'
  | 'trust-guardian'
  | 'sustainability-navigator'
  | 'agent-foundry';

// ── Mission Architect ─────────────────────────────────────────────────────────

export interface MissionArchitectInput {
  goal: string;
  audience: string;
  industry: string;
  duration: string;
  success_metric: string;
}

export interface MissionArchitectOutput {
  title: string;
  story_context: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: string;
  tags: string[];
  reward: string;
  steps: Array<{
    type: 'action' | 'reflection' | 'discovery';
    instruction: string;
    success_criteria: string;
  }>;
  rationale: string;
}

// ── Experience Designer ───────────────────────────────────────────────────────

export interface ExperienceDesignerInput {
  title: string;
  story_context: string;
  steps: Array<{
    type: string;
    instruction: string;
    success_criteria: string;
  }>;
  audience?: string;
}

export interface ExperienceDesignerOutput {
  improved_story: string;
  engagement_score: number;
  improvements: Array<{
    step_index: number;
    original: string;
    improved: string;
    reason: string;
  }>;
  narrative_tips: string[];
  motivation_hooks: string[];
}

// ── Behavioral Analyst ────────────────────────────────────────────────────────

export interface BehavioralAnalystInput {
  mission_title: string;
  total_attempts: number;
  total_completions: number;
  step_drop_offs: Array<{ step_index: number; step_label: string; drop_count: number }>;
  avg_time_minutes?: number;
}

export interface BehavioralAnalystOutput {
  friction_score: number;
  top_friction_point: string;
  drop_off_analysis: Array<{
    step_index: number;
    reason: string;
    recommendation: string;
  }>;
  overall_recommendations: string[];
  predicted_lift_pct: number;
}

// ── Outcome Planner ───────────────────────────────────────────────────────────

export interface OutcomePlannerInput {
  desired_outcome: string;
  current_state?: string;
  audience: string;
  industry: string;
  timeline_weeks: number;
  constraints?: string;
}

export interface OutcomePlannerOutput {
  roadmap_title: string;
  outcome_definition: string;
  success_milestones: Array<{
    week: number;
    milestone: string;
    measurement: string;
  }>;
  mission_sequence: Array<{
    phase: number;
    mission_type: string;
    purpose: string;
    estimated_duration: string;
    prerequisite_phase: number | null;
  }>;
  risk_factors: string[];
  predicted_timeline_weeks: number;
  confidence_pct: number;
  key_assumptions: string[];
}

// ── Knowledge Agent ───────────────────────────────────────────────────────────

export interface KnowledgeAgentInput {
  query: string;
  context?: string;
  node_types?: string[];
  max_recommendations?: number;
}

export interface KnowledgeAgentOutput {
  answer: string;
  reasoning: string;
  recommendations: Array<{
    label: string;
    node_type: string;
    relationship: string;
    confidence_pct: number;
    rationale: string;
  }>;
  related_concepts: string[];
  knowledge_gaps: string[];
}

// ── Insight Analyst ───────────────────────────────────────────────────────────

export interface InsightAnalystInput {
  tenant_name: string;
  period_days: number;
  total_missions: number;
  active_missions: number;
  total_users: number;
  total_attempts: number;
  total_completions: number;
  completion_rate_pct: number;
  top_missions: Array<{ title: string; completions: number; rate_pct: number }>;
}

export interface InsightAnalystOutput {
  headline: string;
  summary: string;
  key_findings: string[];
  opportunities: string[];
  risks: string[];
  recommended_actions: string[];
  roi_narrative: string;
}

// ── Economy Coordinator ───────────────────────────────────────────────────────

export type EconomyCoordinatorContext =
  | 'opportunity_match'
  | 'contribution_review'
  | 'trust_assessment'
  | 'coordination_design';

export interface EconomyCoordinatorInput {
  context: EconomyCoordinatorContext;
  currentSkills: string[];
  contributionHistory: Array<{ type: string; points: number; domain: string }>;
  trustScores: Record<string, number>;  // dimension → score
  objective: string;
}

export interface EconomyCoordinatorOutput {
  recommendation: string;
  action_type: 'match_opportunity' | 'validate_contribution' | 'build_trust' | 'coordinate_team';
  priority_actions: Array<{
    action: string;
    rationale: string;
    expected_impact: string;
  }>;
  skill_gaps: string[];
  trust_opportunities: string[];
  coordination_plan?: {
    workflow_type: 'human_only' | 'ai_assisted' | 'hybrid' | 'autonomous';
    steps: Array<{
      step: string;
      assignee_type: 'human' | 'ai' | 'either';
      checkpoint: boolean;
    }>;
  };
  desiderata_alignment: string[];
  anti_objectives_check: string;
  confidence_pct: number;
}

// ── Discovery Agent (Participant Intelligence) ────────────────────────────────

export interface DiscoveryAgentInput {
  goals: string[];
  currentSkills: string[];
  interests: string[];
  location?: string;
  historyContext?: string;
  maxRecommendations?: number;
}

export interface DiscoveryAgentOutput {
  opportunities: Array<{
    title: string;
    description: string;
    relevance_score: number;
    rationale: string;
    skill_match_pct: number;
    learning_value: string;
    time_commitment: string;
    community_impact: string;
    accessibility_notes?: string;
  }>;
  skill_path: Array<{
    skill: string;
    current_level: string;
    target_level: string;
    path_steps: string[];
  }>;
  discovery_insight: string;
  diversity_note: string;    // ensures diverse opportunities, not just popular ones
  desiderata_alignment: string[];
  anti_objectives_check: string;
}

// ── Community Catalyst (Community Intelligence) ───────────────────────────────

export interface CommunityCatalystInput {
  communityContext: string;
  activeMissions: Array<{ id: string; title: string; participantCount: number; tags: string[] }>;
  participantCohort: Array<{ interests: string[]; skills: string[]; location?: string }>;
  focusArea?: string;
}

export interface CommunityCatalystOutput {
  collaboration_opportunities: Array<{
    title: string;
    participants_needed: number;
    rationale: string;
    expected_impact: string;
    formation_mechanism: string;
  }>;
  engagement_strategy: string;
  social_capital_initiatives: Array<{
    initiative: string;
    mechanism: string;
    expected_outcome: string;
    local_economy_impact?: string;
  }>;
  community_health_score: number;
  feedback_loops: {
    reinforcing: string[];
    balancing: string[];
    risks: string[];
  };
  second_order_effects: string[];
  desiderata_alignment: string[];
}

// ── Trust Guardian (Governance) ───────────────────────────────────────────────

export interface TrustGuardianInput {
  proposedAction: string;
  actionType: 'feature' | 'recommendation' | 'policy' | 'agent_behavior' | 'data_usage' | 'gamification';
  context: Record<string, unknown>;
  stakeholders: string[];
}

export interface TrustGuardianOutput {
  constitutional_assessment: {
    helps_flourish:     boolean;
    strengthens_trust:  boolean;
    creates_value:      boolean;
    improves_ecosystem: boolean;
    is_fair:            boolean;
    is_sustainable:     boolean;
    proud_in_10_years:  boolean;
    score: number;  // 0–7
  };
  financial_materiality: { score: number; analysis: string };
  impact_materiality:    { score: number; analysis: string };
  red_flags: string[];
  risks: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;
  verdict: 'approved' | 'flagged' | 'rejected';
  conditions: string[];    // conditions required if flagged
  recommendation: string;
  anti_patterns_detected: string[];
}

// ── Sustainability Navigator ──────────────────────────────────────────────────

export interface SustainabilityNavigatorInput {
  missionContext: string;
  activityType: string;
  participantCount: number;
  geographicalContext?: string;
  currentSDGAlignment?: string[];
}

export interface SustainabilityNavigatorOutput {
  environmental_impact: {
    estimate: string;
    carbon_equivalent?: string;
    positive_aspects: string[];
    concerns: string[];
  };
  sustainable_alternatives: Array<{
    alternative: string;
    rationale: string;
    impact: string;
    implementation_effort: 'low' | 'medium' | 'high';
  }>;
  sdg_alignment: Array<{
    goal: string;
    alignment: string;
    score: number;
  }>;
  behavior_incentives: Array<{
    behavior: string;
    mechanism: string;
    expected_lift: string;
  }>;
  circular_economy_opportunities: string[];
  sustainability_score: number;
  greenwashing_risk: string;   // explicit flag if claims are not substantiated
  desiderata_alignment: string[];
}

// ── Agent Foundry ─────────────────────────────────────────────────────────────

export interface AgentFoundryInput {
  agentName: string;
  purpose: string;
  category: string;
  stakeholders: string[];
  problemContext: string;
  constraints?: string[];
}

export interface AgentFoundryOutput {
  agent_spec: {
    agent_id: string;
    name: string;
    category: string;
    purpose: string;
    primary_stakeholders: string[];
    scope_of_authority: string;
    operational_boundaries: string;
    primary_objective: string;
    secondary_objectives: string[];
    anti_objectives: string[];
    inputs: Array<{ signal: string; source: string; required: boolean }>;
    outputs: Array<{ type: string; description: string; explainable: boolean }>;
    constraints: {
      ethical: string[];
      legal: string[];
      technical: string[];
      business: string[];
    };
    financial_materiality: { assessment: string; score: number; factors: string[] };
    impact_materiality:    { assessment: string; score: number; factors: string[] };
    feedback_loops: {
      reinforcing: string[];
      balancing: string[];
      failure_modes: string[];
      emergent_effects: string[];
    };
    desiderata_alignment: string[];
    governance_controls: string[];
    success_metrics: string[];
    monitoring_strategy: string;
    deployment_notes: string;
  };
  constitutional_compliance: {
    verdict: 'approved' | 'flagged';
    score: number;
    notes: string;
  };
  estimated_complexity: 'low' | 'medium' | 'high';
  implementation_roadmap: Array<{
    phase: number;
    milestone: string;
    duration: string;
    dependencies: string[];
  }>;
}
