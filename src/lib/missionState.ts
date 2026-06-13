/**
 * Mission state machine — pure types and derivation logic.
 *
 * States flow: not_started → active → in_progress ⟷ stalled → completed → analyzed
 *
 * The `deriveMissionState` function is pure (no side effects) so it can be
 * called on any snapshot of progress data without touching the DB.
 * Persistence is handled by syncMissionState() in supabase/events.ts.
 */

export type MissionState =
  | 'not_started'  // user has never opened the mission
  | 'active'       // started, 0 steps completed yet
  | 'in_progress'  // 1+ steps completed, still going
  | 'stalled'      // in_progress but no activity for STALL_THRESHOLD_MS
  | 'completed'    // all steps done
  | 'analyzed';    // MEI computed + outcomes extracted

export interface MissionStateContext {
  totalSteps:        number;
  completedStepCount: number;
  /** Timestamp of the last recorded step_completed or step_started event. */
  lastActivityAt:    Date | null;
  isCompleted:       boolean;
  meiComputed:       boolean;
}

/** 24 hours of inactivity transitions in_progress → stalled. */
export const STALL_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/** Derive the correct state from a progress snapshot. */
export function deriveMissionState(ctx: MissionStateContext): MissionState {
  if (ctx.meiComputed)  return 'analyzed';
  if (ctx.isCompleted)  return 'completed';
  if (ctx.completedStepCount === 0) return 'active';

  if (ctx.lastActivityAt !== null) {
    const idleMs = Date.now() - ctx.lastActivityAt.getTime();
    if (idleMs > STALL_THRESHOLD_MS) return 'stalled';
  }

  return 'in_progress';
}

/** Legal transitions — enforced in the UI, not the DB. */
export const STATE_TRANSITIONS: Record<MissionState, MissionState[]> = {
  not_started: ['active'],
  active:      ['in_progress', 'completed', 'stalled'],
  in_progress: ['completed', 'stalled'],
  stalled:     ['in_progress', 'completed'],
  completed:   ['analyzed'],
  analyzed:    [],
};

export function canTransition(from: MissionState, to: MissionState): boolean {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Display metadata ──────────────────────────────────────────────────────────

export interface StateDisplayMeta {
  label:       string;
  color:       string;
  description: string;
  pulse:       boolean;  // whether to show an animated indicator
}

export const STATE_META: Record<MissionState, StateDisplayMeta> = {
  not_started: {
    label:       'Not Started',
    color:       '#4A5578',
    description: 'This mission is waiting for you.',
    pulse:       false,
  },
  active: {
    label:       'Active',
    color:       '#22FFAA',
    description: 'You just started — keep going.',
    pulse:       true,
  },
  in_progress: {
    label:       'In Progress',
    color:       '#6D5DFD',
    description: 'Making progress on this mission.',
    pulse:       true,
  },
  stalled: {
    label:       'Stalled',
    color:       '#FFB84D',
    description: 'No activity in the last 24 hours.',
    pulse:       false,
  },
  completed: {
    label:       'Completed',
    color:       '#22FFAA',
    description: 'All steps done. Awaiting reward.',
    pulse:       false,
  },
  analyzed: {
    label:       'Analyzed',
    color:       '#60A5FA',
    description: 'Outcomes extracted. Impact scored.',
    pulse:       false,
  },
};

// ── Helper: derive from HuntProgress (frontend type) ─────────────────────────

import type { HuntProgress } from './types';

export function stateFromProgress(
  progress: HuntProgress | null,
  totalSteps: number,
): MissionState {
  if (!progress) return 'not_started';
  return deriveMissionState({
    totalSteps,
    completedStepCount: progress.completedSteps.length,
    lastActivityAt:     null, // client doesn't track last-activity timestamp
    isCompleted:        Boolean(progress.completedAt),
    meiComputed:        false,
  });
}
