'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, SkipForward, X, Sparkles, Loader2 } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';
import { cn } from '@/lib/cn';
import { loadState, saveState } from '@/lib/store';

import type { Hunt, HuntProgress, Step } from '@/lib/types';
import { emitEvent, emitTypedEvent, syncProgress, markStepStart, measureDuration } from '@/lib/supabase/events';

const STEP_TYPE_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  action:        { label: 'Action',        emoji: '⚡', bg: 'bg-[rgba(255,184,77,0.08)]',   text: 'text-[#FFB84D]', border: 'border-[rgba(255,184,77,0.18)]'  },
  reflection:    { label: 'Reflection',    emoji: '💭', bg: 'bg-[rgba(109,93,253,0.08)]',   text: 'text-[#6D5DFD]', border: 'border-[rgba(109,93,253,0.18)]'  },
  discovery:     { label: 'Discovery',     emoji: '🔍', bg: 'bg-[rgba(34,255,170,0.08)]',   text: 'text-[#22FFAA]', border: 'border-[rgba(34,255,170,0.15)]'  },
  research:      { label: 'Research',      emoji: '🔬', bg: 'bg-[rgba(96,165,250,0.08)]',   text: 'text-[#60A5FA]', border: 'border-[rgba(96,165,250,0.18)]'  },
  submission:    { label: 'Submission',    emoji: '📤', bg: 'bg-[rgba(34,255,170,0.08)]',   text: 'text-[#22FFAA]', border: 'border-[rgba(34,255,170,0.15)]'  },
  collaboration: { label: 'Collaborate',   emoji: '🤝', bg: 'bg-[rgba(167,139,250,0.08)]',  text: 'text-[#a78bfa]', border: 'border-[rgba(167,139,250,0.18)]' },
};

type SheetState = 'hidden' | 'skip_confirm' | 'adapting' | 'adapted';

export default function ActiveHuntPage() {
  const params = useParams();
  const router = useRouter();
  const huntId = params?.id as string;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [progress, setProgress] = useState<HuntProgress | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sheet, setSheet] = useState<SheetState>('hidden');
  const [adaptedStep, setAdaptedStep] = useState<Step | null>(null);
  const [isAdaptedMode, setIsAdaptedMode] = useState(false);

  useEffect(() => {
    const state = loadState();
    const allHunts = state.hunts;
    const found = allHunts.find((h) => h.id === huntId);
    if (!found) return;
    setHunt(found);

    const existing = state.progress[huntId];
    if (existing) {
      setProgress(existing);
      const resumeStep = found.steps[existing.currentStepIndex];
      emitEvent('mission_resumed', { missionId: huntId });
      emitTypedEvent('step_started', huntId, {
        step_id:    resumeStep?.id,
        step_index: existing.currentStepIndex,
        step_type:  resumeStep?.type,
      });
      if (resumeStep) markStepStart(resumeStep.id);
    } else {
      const fresh: HuntProgress = {
        huntId, currentStepIndex: 0, completedSteps: [],
        startedAt: new Date().toISOString(),
      };
      setProgress(fresh);
      saveState({ ...state, progress: { ...state.progress, [huntId]: fresh } });
      const firstStep = found.steps[0];
      emitEvent('mission_started', { missionId: huntId });
      emitTypedEvent('step_started', huntId, {
        step_id:    firstStep?.id,
        step_index: 0,
        step_type:  firstStep?.type,
      });
      if (firstStep) markStepStart(firstStep.id);
    }
    setMounted(true);
  }, [huntId]);

  useEffect(() => {
    setIsAdaptedMode(false);
    setAdaptedStep(null);
  }, [progress?.currentStepIndex]);

  if (!mounted || !hunt || !progress) return null;

  const rawStep = hunt.steps[progress.currentStepIndex];
  const currentStep = isAdaptedMode && adaptedStep ? adaptedStep : rawStep;
  const isLastStep = progress.currentStepIndex === hunt.steps.length - 1;
  const progressPercent = Math.round((progress.completedSteps.length / hunt.steps.length) * 100);
  const typeConfig = STEP_TYPE_CONFIG[currentStep.type];

  function completeStep() {
    if (!hunt || !progress) return;
    const updatedCompleted = [...progress.completedSteps, rawStep.id];
    const state = loadState();
    const dur = measureDuration(rawStep.id);
    emitTypedEvent('step_completed', huntId, {
      step_id:    rawStep.id,
      step_index: progress.currentStepIndex,
      step_type:  rawStep.type,
      duration_ms: dur,
      adapted:    isAdaptedMode,
    });

    if (isLastStep) {
      const updatedProgress: HuntProgress = { ...progress, completedSteps: updatedCompleted, completedAt: new Date().toISOString() };
      const alreadyCompleted = state.completedHunts.some((c) => c.huntId === huntId);
      const newCompleted = alreadyCompleted
        ? state.completedHunts
        : [...state.completedHunts, { huntId, huntTitle: hunt.title, reward: hunt.reward, completedAt: new Date().toISOString() }];
      saveState({ ...state, progress: { ...state.progress, [huntId]: updatedProgress }, completedHunts: newCompleted, streak: (state.streak || 0) + 1 });
      syncProgress(huntId, updatedProgress);
      emitTypedEvent('mission_completed', huntId, {});
      router.push(`/complete/${huntId}`);
    } else {
      const nextIndex = progress.currentStepIndex + 1;
      const nextStep  = hunt.steps[nextIndex];
      const updatedProgress: HuntProgress = { ...progress, currentStepIndex: nextIndex, completedSteps: updatedCompleted };
      setProgress(updatedProgress);
      saveState({ ...state, progress: { ...state.progress, [huntId]: updatedProgress } });
      syncProgress(huntId, updatedProgress);
      emitTypedEvent('step_started', huntId, {
        step_id:    nextStep?.id,
        step_index: nextIndex,
        step_type:  nextStep?.type,
      });
      if (nextStep) markStepStart(nextStep.id);
    }
  }

  function skipStep() {
    if (!hunt || !progress) return;
    const state = loadState();
    emitTypedEvent('step_skipped', huntId, {
      step_id:    rawStep.id,
      step_index: progress.currentStepIndex,
      step_type:  rawStep.type,
      reason:     'user_skipped',
    });
    if (isLastStep) { router.push(`/complete/${huntId}`); return; }
    const nextSkipIndex = progress.currentStepIndex + 1;
    const nextSkipStep  = hunt.steps[nextSkipIndex];
    const updatedProgress: HuntProgress = { ...progress, currentStepIndex: nextSkipIndex };
    setProgress(updatedProgress);
    saveState({ ...state, progress: { ...state.progress, [huntId]: updatedProgress } });
    syncProgress(huntId, updatedProgress);
    emitTypedEvent('step_started', huntId, {
      step_id:    nextSkipStep?.id,
      step_index: nextSkipIndex,
      step_type:  nextSkipStep?.type,
    });
    if (nextSkipStep) markStepStart(nextSkipStep.id);
    setSheet('hidden');
  }

  async function handleAdaptRequest() {
    if (!hunt) return;
    setSheet('adapting');
    try {
      const state = loadState();
      const res = await fetch('/api/adapt-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          huntTitle: hunt.title, storyContext: hunt.story_context,
          step: rawStep, context: 'user_skipped',
          userInterests: state.user?.interests ?? [],
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.adaptedStep) { setAdaptedStep(data.adaptedStep); setSheet('adapted'); }
      else setSheet('skip_confirm');
    } catch { setSheet('skip_confirm'); }
  }

  function applyAdaptedStep() {
    setIsAdaptedMode(true);
    setSheet('hidden');
    emitTypedEvent('step_adapted', huntId, {
      step_id:    rawStep.id,
      step_index: progress?.currentStepIndex,
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050816' }}>
      <div className="max-w-[430px] mx-auto w-full flex flex-col min-h-screen">
        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: '#0D1530' }}>
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ boxShadow: '0 0 8px rgba(34,255,170,.6)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-10 pb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#0A1226', border: '1px solid rgba(255,255,255,.07)' }}
          >
            <ArrowLeft size={18} strokeWidth={2} style={{ color: '#F0F4FF' }} />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-semibold" style={{ color: '#8B9CC0' }}>
              Step {progress.currentStepIndex + 1} of {hunt.steps.length}
            </p>
            <p className="text-[11px] mt-0.5 truncate max-w-[180px]" style={{ color: '#4A5578' }}>{hunt.title}</p>
          </div>
          <button
            onClick={() => router.push(`/hunt/${huntId}`)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#0A1226', border: '1px solid rgba(255,255,255,.07)' }}
          >
            <X size={16} strokeWidth={2} style={{ color: '#8B9CC0' }} />
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 flex flex-col px-5 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${progress.currentStepIndex}-${isAdaptedMode}`}
              initial={{ opacity: 0, x: isAdaptedMode ? 0 : 30, y: isAdaptedMode ? 10 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col flex-1"
            >
              {isAdaptedMode && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4 self-start"
                  style={{ background: 'rgba(109,93,253,.08)', border: '1px solid rgba(109,93,253,.2)' }}
                >
                  <Sparkles size={13} className="text-ai" strokeWidth={2} />
                  <span className="text-[12px] font-semibold text-ai">AI-adapted for you</span>
                </div>
              )}

              <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 self-start border', typeConfig.bg, typeConfig.text, typeConfig.border)}>
                <span className="text-base">{typeConfig.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{typeConfig.label}</span>
              </div>

              <div className="flex-1">
                <p className="text-[22px] font-bold leading-snug mb-6" style={{ color: '#F0F4FF' }}>
                  {currentStep.instruction}
                </p>
                <div
                  className="rounded-xl p-4"
                  style={{ background: '#0A1226', border: '1px solid rgba(255,255,255,.07)' }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#4A5578' }}>
                    {isAdaptedMode ? 'Easier version — done when' : "You're done when"}
                  </p>
                  <p className="text-[14px] leading-relaxed" style={{ color: '#8B9CC0' }}>
                    {currentStep.success_criteria}
                  </p>
                </div>
              </div>

              {/* Step dots */}
              <div className="flex justify-center gap-2 py-6">
                {hunt.steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn('rounded-full transition-all duration-300')}
                    style={{
                      width: i === progress.currentStepIndex ? 20 : 8,
                      height: 8,
                      background: i <= progress.currentStepIndex ? '#22FFAA' : '#0D1530',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={completeStep}
            className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            style={{
              background: '#22FFAA',
              color: '#050816',
              boxShadow: '0 4px 24px rgba(34,255,170,.4)',
            }}
          >
            <Check size={20} strokeWidth={2.5} />
            {isLastStep ? 'Complete Hunt' : 'Mark as Done'}
          </motion.button>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSheet('skip_confirm')}
              className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium"
              style={{ color: '#4A5578' }}
            >
              <SkipForward size={14} strokeWidth={2} />
              {isAdaptedMode ? 'Still too hard — skip' : 'Skip this step'}
            </button>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,.07)' }} />
            <AIAssistant
              context={{
                huntTitle:       hunt.title,
                huntStory:       hunt.story_context,
                stepInstruction: currentStep.instruction,
                stepType:        currentStep.type,
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {sheet !== 'hidden' && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => sheet === 'skip_confirm' && setSheet('hidden')}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]"
              style={{ background: '#07101F', borderTop: '1px solid rgba(255,255,255,.07)' }}
            >
              <div className="max-w-[430px] mx-auto">
                <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'rgba(255,255,255,.1)' }} />

                {sheet === 'skip_confirm' && (
                  <>
                    <h3 className="text-xl font-bold mb-1" style={{ color: '#F0F4FF' }}>This step feeling tough?</h3>
                    <p className="text-sm mb-6" style={{ color: '#8B9CC0' }}>
                      Let AI adapt it into an easier version, or skip entirely.
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={handleAdaptRequest}
                        className="w-full rounded-2xl font-semibold flex items-center justify-center gap-2 py-3.5 text-ai"
                        style={{ background: 'rgba(109,93,253,.08)', border: '1px solid rgba(109,93,253,.25)', boxShadow: '0 4px 20px rgba(109,93,253,.2)' }}
                      >
                        <Sparkles size={16} strokeWidth={2} />
                        Make it easier for me
                      </button>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => setSheet('hidden')}
                          className="flex-1 h-12 rounded-2xl font-semibold"
                          style={{ background: '#0D1530', border: '1px solid rgba(255,255,255,.07)', color: '#F0F4FF' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={skipStep}
                          className="flex-1 h-12 rounded-2xl font-semibold"
                          style={{ background: '#F0F4FF', color: '#050816' }}
                        >
                          Skip entirely
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {sheet === 'adapting' && (
                  <div className="flex flex-col items-center py-6 gap-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={32} className="text-ai" strokeWidth={2} />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-bold text-lg mb-1" style={{ color: '#F0F4FF' }}>Adapting your step…</p>
                      <p className="text-sm" style={{ color: '#8B9CC0' }}>Creating an easier version just for you.</p>
                    </div>
                  </div>
                )}

                {sheet === 'adapted' && adaptedStep && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={16} className="text-ai" strokeWidth={2} />
                      <p className="text-[13px] font-bold text-ai uppercase tracking-wide">Easier version ready</p>
                    </div>
                    <div
                      className="rounded-2xl p-4 mb-5"
                      style={{ background: 'rgba(109,93,253,.08)', border: '1px solid rgba(109,93,253,.2)' }}
                    >
                      <p className="text-[15px] font-semibold leading-snug mb-2" style={{ color: '#F0F4FF' }}>
                        {adaptedStep.instruction}
                      </p>
                      <p className="text-[12px]" style={{ color: '#8B9CC0' }}>{adaptedStep.success_criteria}</p>
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={skipStep}
                        className="flex-1 h-12 rounded-2xl font-semibold text-sm"
                        style={{ background: '#0D1530', border: '1px solid rgba(255,255,255,.07)', color: '#8B9CC0' }}
                      >
                        Skip anyway
                      </button>
                      <button
                        onClick={applyAdaptedStep}
                        className="flex-[2] h-12 rounded-2xl font-bold text-ai"
                        style={{ background: 'rgba(109,93,253,.12)', border: '1px solid rgba(109,93,253,.25)', boxShadow: '0 4px 20px rgba(109,93,253,.2)' }}
                      >
                        Try this version
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
