/**
 * XIL Constitutional Alignment Engine
 *
 * Implements the X-Hunt Constitutional Framework:
 * - 7-question constitutional test
 * - Double Materiality assessment (financial + impact)
 * - Anti-pattern detection
 * - Desiderata alignment scoring
 *
 * This runs in-process as a lightweight heuristic gate.
 * The Trust Guardian agent performs the deep AI-powered assessment.
 */

import { createClient } from '@/lib/supabase/server';

export type ConstitutionalVerdict = 'approved' | 'flagged' | 'rejected';

export interface ConstitutionalAssessment {
  // 7-question test
  helpsFlourist: boolean;
  strengthensTrust: boolean;
  createsValue: boolean;
  improvesEcosystem: boolean;
  isFair: boolean;
  isSustainable: boolean;
  proudIn10Years: boolean;
  constitutionalScore: number;   // 0–7
  // Double materiality
  financialMaterialityScore: number;   // 0–100
  financialMaterialityNotes: string;
  impactMaterialityScore: number;      // 0–100
  impactMaterialityNotes: string;
  // Outcome
  redFlags: string[];
  verdict: ConstitutionalVerdict;
  conditions: string[];
}

// Known anti-patterns that automatically trigger 'flagged' or 'rejected'
const ANTI_PATTERNS: Array<{ pattern: RegExp; severity: 'flag' | 'reject'; flag: string }> = [
  { pattern: /maximiz(e|ing) (engagement|time.on.platform|screen.time|clicks)/i, severity: 'reject', flag: 'Engagement maximization detected' },
  { pattern: /addict(ive|ion)|compulsive|can.t.stop/i, severity: 'reject', flag: 'Addictive design pattern detected' },
  { pattern: /dark.pattern|manipulation|deceptive/i, severity: 'reject', flag: 'Dark pattern / manipulation detected' },
  { pattern: /artificial.urgency|fake.scarcity|FOMO/i, severity: 'flag', flag: 'Artificial urgency / FOMO mechanic detected' },
  { pattern: /hidden.rank|secret.score|opaque.algorithm/i, severity: 'flag', flag: 'Hidden ranking / opaque algorithm detected' },
  { pattern: /override.human|bypass.governance|no.human/i, severity: 'reject', flag: 'Human oversight bypass detected' },
  { pattern: /collect.all|harvest.data|sell.data/i, severity: 'reject', flag: 'Excessive / extractive data collection detected' },
  { pattern: /notification.spam|excessive.notification|push.every/i, severity: 'flag', flag: 'Excessive notification pattern detected' },
  { pattern: /extract(ive|ing) labor|unpaid work/i, severity: 'flag', flag: 'Extractive labor dynamic detected' },
  { pattern: /inflate.reputation|fake.trust|synthetic.review/i, severity: 'reject', flag: 'Trust inflation / fake social proof detected' },
];

// Desiderata keywords for heuristic scoring
const DESIDERATA_POSITIVE = [
  'flourish', 'wellbeing', 'growth', 'learning', 'purpose', 'meaningful',
  'trust', 'transparent', 'accountable', 'reliable',
  'fair', 'equitable', 'inclusive', 'accessible',
  'community', 'civic', 'local', 'social capital',
  'sustainable', 'environment', 'circular', 'sdg',
  'value creation', 'economic', 'viable', 'durable',
  'resilient', 'stable', 'interoperable',
];

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  const hits = DESIDERATA_POSITIVE.filter((kw) => lower.includes(kw)).length;
  return Math.min(100, 50 + hits * 5);
}

export function runHeuristicCheck(
  actionDescription: string,
  context: Record<string, unknown> = {}
): ConstitutionalAssessment {
  const fullText = `${actionDescription} ${JSON.stringify(context)}`;

  const redFlags: string[] = [];
  let hasReject = false;

  for (const { pattern, severity, flag } of ANTI_PATTERNS) {
    if (pattern.test(fullText)) {
      redFlags.push(flag);
      if (severity === 'reject') hasReject = true;
    }
  }

  const impactScore = scoreText(fullText);
  const financialScore = 60; // Default neutral — agents provide real scoring

  // Heuristic answers to the 7 questions based on detected content
  const helpsFlourist    = !redFlags.some((f) => f.includes('Addictive') || f.includes('manipulation'));
  const strengthensTrust = !redFlags.some((f) => f.includes('Hidden') || f.includes('deceptive') || f.includes('Trust inflation'));
  const createsValue     = impactScore > 50;
  const improvesEcosystem = !hasReject;
  const isFair           = !redFlags.some((f) => f.includes('rank') || f.includes('extract'));
  const isSustainable    = !redFlags.some((f) => f.includes('data collection'));
  const proudIn10Years   = !hasReject && redFlags.length < 2;

  const score = [helpsFlourist, strengthensTrust, createsValue, improvesEcosystem, isFair, isSustainable, proudIn10Years]
    .filter(Boolean).length;

  let verdict: ConstitutionalVerdict;
  if (hasReject || score < 4) verdict = 'rejected';
  else if (redFlags.length > 0 || score < 6) verdict = 'flagged';
  else verdict = 'approved';

  const conditions: string[] = [];
  if (verdict === 'flagged') {
    if (redFlags.includes('Artificial urgency / FOMO mechanic detected')) {
      conditions.push('Remove artificial urgency; replace with genuine time-sensitivity');
    }
    if (redFlags.includes('Excessive notification pattern detected')) {
      conditions.push('Cap notification frequency; make opt-in explicit');
    }
    if (redFlags.includes('Hidden ranking / opaque algorithm detected')) {
      conditions.push('Publish ranking criteria; provide user-facing explanations');
    }
    if (redFlags.includes('Extractive labor dynamic detected')) {
      conditions.push('Ensure fair compensation or clear voluntary contribution framing');
    }
  }

  return {
    helpsFlourist,
    strengthensTrust,
    createsValue,
    improvesEcosystem,
    isFair,
    isSustainable,
    proudIn10Years,
    constitutionalScore: score,
    financialMaterialityScore: financialScore,
    financialMaterialityNotes: 'Heuristic baseline — Trust Guardian agent provides deep assessment',
    impactMaterialityScore: impactScore,
    impactMaterialityNotes: `Desiderata keyword density: ${impactScore}`,
    redFlags,
    verdict,
    conditions,
  };
}

export async function persistConstitutionalCheck(
  assessment: ConstitutionalAssessment,
  actionType: string,
  actionDescription: string,
  context: Record<string, unknown> = {},
  agentId?: string,
  userId?: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('xil_constitutional_checks')
    .insert({
      agent_id: agentId ?? null,
      action_type: actionType,
      action_description: actionDescription,
      context,
      user_id: userId ?? null,
      helps_flourish:       assessment.helpsFlourist,
      strengthens_trust:    assessment.strengthensTrust,
      creates_value:        assessment.createsValue,
      improves_ecosystem:   assessment.improvesEcosystem,
      is_fair:              assessment.isFair,
      is_sustainable:       assessment.isSustainable,
      proud_in_10_years:    assessment.proudIn10Years,
      financial_materiality_score: assessment.financialMaterialityScore,
      financial_materiality_notes: assessment.financialMaterialityNotes,
      impact_materiality_score:    assessment.impactMaterialityScore,
      impact_materiality_notes:    assessment.impactMaterialityNotes,
      red_flags:     assessment.redFlags,
      verdict:       assessment.verdict,
      conditions:    assessment.conditions,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[constitution] Failed to persist check:', error);
    return 'unknown';
  }

  return data.id;
}

export async function getAgentRegistry() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('xil_agent_registry')
    .select('*')
    .eq('is_active', true)
    .order('category');
  if (error) throw error;
  return data ?? [];
}

export async function logXILRoute(
  intelligenceFunction: string,
  agentIdsInvoked: string[],
  inputSummary: string,
  outputSummary: string,
  processingMs: number,
  constitutionalCheckId?: string,
  userId?: string,
  sessionId?: string
) {
  const supabase = await createClient();
  await supabase.from('xil_routing_log').insert({
    session_id: sessionId ?? null,
    user_id: userId ?? null,
    intelligence_function: intelligenceFunction,
    agent_ids_invoked: agentIdsInvoked,
    input_summary: inputSummary.slice(0, 500),
    output_summary: outputSummary.slice(0, 500),
    constitutional_check_id: constitutionalCheckId ?? null,
    processing_ms: processingMs,
  });
}
