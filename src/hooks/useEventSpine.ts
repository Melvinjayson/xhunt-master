'use client';

/**
 * useEventSpine — declarative event instrumentation for mission pages.
 *
 * Drop this into any page that involves a mission. It fires mission_viewed
 * on mount, provides typed callbacks for step lifecycle events, and handles
 * duration measurement automatically via markStepStart / measureDuration.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  emitTypedEvent,
  emitEvent,
  markStepStart,
  measureDuration,
  syncMissionState,
} from '@/lib/supabase/events';

export type SpineSource = 'explore' | 'home' | 'direct' | 'recommendation';
export type SkipReason  = 'too_hard' | 'irrelevant' | 'no_time' | 'user_skipped';

export interface UseEventSpineOptions {
  missionId:      string | null;
  /** Where the user came from — attached to mission_viewed metadata. */
  source?:        SpineSource;
  /** Impact DNA match score 0–100, attached to mission_viewed metadata. */
  matchScore?:    number;
  /**
   * Set false to suppress the automatic mission_viewed event on mount.
   * Useful on the active execution page where mission_started / mission_resumed
   * are emitted manually instead.
   */
  autoViewEvent?: boolean;
}

export interface EventSpine {
  /** Mark when a step card is shown and emit step_started. */
  onStepStart:       (stepId: number, stepIndex: number, stepType: string) => void;
  /** Measure duration and emit step_completed. */
  onStepComplete:    (stepId: number, stepIndex: number, stepType: string, adapted?: boolean) => void;
  /** Emit step_skipped with optional reason. */
  onStepSkip:        (stepId: number, stepIndex: number, reason?: SkipReason) => void;
  /** Emit step_adapted when an AI-adapted version replaces the original. */
  onStepAdapted:     (stepId: number, stepIndex: number) => void;
  /** Emit mission_completed and sync state to 'completed'. */
  onMissionComplete: (stats?: { stepsSkipped?: number; stepsAdapted?: number }) => void;
  /** Emit ask_xeno for AI assistant interactions. */
  onAskXeno:         (context?: string) => void;
  /** Push a state machine transition to Supabase. */
  onStateTransition: (newState: string, prevState?: string) => void;
}

export function useEventSpine(opts: UseEventSpineOptions): EventSpine {
  const completedRef = useRef(false);
  const { missionId, source, matchScore, autoViewEvent = true } = opts;

  // Fire mission_viewed on mount (unless suppressed)
  useEffect(() => {
    if (!missionId || !autoViewEvent) return;
    emitTypedEvent('mission_viewed', missionId, {
      source,
      match_score: matchScore,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  const onStepStart = useCallback(
    (stepId: number, stepIndex: number, stepType: string) => {
      if (!missionId) return;
      markStepStart(stepId);
      emitTypedEvent('step_started', missionId, {
        step_id:    stepId,
        step_index: stepIndex,
        step_type:  stepType,
      });
    },
    [missionId],
  );

  const onStepComplete = useCallback(
    (stepId: number, stepIndex: number, stepType: string, adapted = false) => {
      if (!missionId) return;
      const duration_ms = measureDuration(stepId);
      emitTypedEvent('step_completed', missionId, {
        step_id:    stepId,
        step_index: stepIndex,
        step_type:  stepType,
        duration_ms,
        adapted,
      });
    },
    [missionId],
  );

  const onStepSkip = useCallback(
    (stepId: number, stepIndex: number, reason?: SkipReason) => {
      if (!missionId) return;
      emitTypedEvent('step_skipped', missionId, {
        step_id:    stepId,
        step_index: stepIndex,
        reason,
      });
    },
    [missionId],
  );

  const onStepAdapted = useCallback(
    (stepId: number, stepIndex: number) => {
      if (!missionId) return;
      emitTypedEvent('step_adapted', missionId, {
        step_id:    stepId,
        step_index: stepIndex,
      });
    },
    [missionId],
  );

  const onMissionComplete = useCallback(
    (stats?: { stepsSkipped?: number; stepsAdapted?: number }) => {
      if (!missionId) return;
      completedRef.current = true;
      emitTypedEvent('mission_completed', missionId, {
        steps_skipped: stats?.stepsSkipped,
        steps_adapted: stats?.stepsAdapted,
      });
      syncMissionState(missionId, 'completed', 'in_progress');
    },
    [missionId],
  );

  const onAskXeno = useCallback(
    (context?: string) => {
      if (!missionId) return;
      emitEvent('ask_xeno', { missionId, metadata: { context } });
    },
    [missionId],
  );

  const onStateTransition = useCallback(
    (newState: string, prevState?: string) => {
      if (!missionId) return;
      syncMissionState(missionId, newState, prevState);
    },
    [missionId],
  );

  return {
    onStepStart,
    onStepComplete,
    onStepSkip,
    onStepAdapted,
    onMissionComplete,
    onAskXeno,
    onStateTransition,
  };
}
