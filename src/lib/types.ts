export type StepType = 'action' | 'reflection' | 'discovery' | 'research' | 'submission' | 'collaboration';
export type Difficulty = 'easy' | 'medium' | 'hard';

/** The nature of the work being commissioned */
export type MissionType =
  | 'challenge'       // Open-ended problem to solve
  | 'research'        // Data gathering, analysis, reporting
  | 'fieldwork'       // On-the-ground, location-based work
  | 'consultation'    // Expert advice or assessment
  | 'creative'        // Design, content, media production
  | 'technical'       // Code, engineering, data
  | 'community'       // Outreach, facilitation, organizing
  | 'advocacy'        // Policy, awareness, campaigning
  | 'training'        // Teach, workshop, mentor
  | 'audit';          // Review, evaluation, compliance

/** Posting organisation category */
export type OrgType =
  | 'ngo'
  | 'startup'
  | 'university'
  | 'government'
  | 'enterprise'
  | 'social-enterprise'
  | 'community';

/** Where the work happens */
export type LocationType = 'remote' | 'local' | 'hybrid';

/** UN Sustainable Development Goal number (1–17) */
export type SDGGoal = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17;

export interface Step {
  id: number;
  type: StepType;
  instruction: string;
  success_criteria: string;
}

export interface Hunt {
  /* ── core ── */
  id: string;
  title: string;
  story_context: string;
  difficulty: Difficulty;
  estimated_time: string;
  steps: Step[];
  reward: string;
  tags: string[];
  createdAt?: string;

  /* ── organisation ── */
  tenantName?: string;
  tenantLogo?: string | null;
  tenantSlug?: string;
  isVerified?: boolean;
  organizationType?: OrgType;
  organizationAbout?: string;

  /* ── classification ── */
  missionType?: MissionType;
  category?: string;
  impactArea?: string;
  sdgGoals?: SDGGoal[];
  locationType?: LocationType;

  /* ── econometrics ── */
  cashReward?: number;          // USD amount
  xpReward?: number;
  certificationReward?: string;
  portfolioCredits?: number;

  /* ── capacity & demand ── */
  requiredSkills?: string[];
  deliverables?: string[];
  spotsTotal?: number;
  spotsRemaining?: number;
  applicationCount?: number;
  deadline?: string;            // ISO date
  teamSize?: string;            // "1 person" | "2–5 people"

  /* ── proximity / location ── */
  location?: string;            // free-text display label
  locationCity?: string;
  locationCountry?: string;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;            // how far a hunter can be (default 50 km)
}

export interface HuntProgress {
  huntId: string;
  currentStepIndex: number;
  completedSteps: number[];
  startedAt: string;
  completedAt?: string;
}

export interface UserProfile {
  interests: string[];
  goals: string[];
  location?: string;
  locationCity?: string;
  locationCountry?: string;
  lat?: number | null;
  lng?: number | null;
  onboardingComplete: boolean;
}

export interface SkillScore {
  name: string;
  score: number; // 0–100
}

export interface ImpactProfile {
  archetype: string;           // e.g. "Systems Innovator"
  strengths: SkillScore[];     // top skills with scores
  causes: string[];            // e.g. ["Climate", "Education"]
  personality: string[];       // e.g. ["Builder", "Analyst"]
  motivations: string[];       // e.g. ["Learning", "Income"]
  growthAreas: string[];       // e.g. ["Fundraising", "Policy"]
  availability: string;        // e.g. "5–10 hrs/week"
  impactScore: number;         // 0–100
  extractedAt: string;         // ISO date
}

export interface CompletedHunt {
  huntId: string;
  huntTitle: string;
  reward: string;
  completedAt: string;
}

export interface AppState {
  user: UserProfile | null;
  hunts: Hunt[];
  progress: Record<string, HuntProgress>;
  completedHunts: CompletedHunt[];
  streak: number;
}
