'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Eye, ChevronDown, ChevronUp,
  FileText, Link2, BarChart2, Star, Shield, Award, Loader2, RefreshCw,
  Search, MessageSquare
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { DbOutcomeValidation, ValidationStatus, ValidationEvidence } from '@/lib/supabase/types';
import { cn } from '@/lib/cn';

const STATUS_CONFIG: Record<ValidationStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending:           { label: 'Pending',          color: 'text-[#fbbf24]', bg: 'bg-[#2a1a00]', icon: Clock },
  under_review:      { label: 'Under Review',     color: 'text-[#6D5DFD]', bg: 'bg-[#001a22]', icon: Eye },
  approved:          { label: 'Approved',         color: 'text-accent',    bg: 'bg-accent-light', icon: CheckCircle2 },
  rejected:          { label: 'Rejected',         color: 'text-[#f87171]', bg: 'bg-[#2a0a0a]', icon: XCircle },
  requires_evidence: { label: 'Needs Evidence',   color: 'text-[#a78bfa]', bg: 'bg-[#1a0a2a]', icon: AlertCircle },
};

const EVIDENCE_ICON: Record<string, typeof FileText> = {
  screenshot:   FileText,
  document:     FileText,
  url:          Link2,
  metric:       BarChart2,
  attestation:  Star,
  certificate:  Award,
};

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'requires_evidence', label: 'Needs Evidence' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

interface ReviewPayload {
  status: ValidationStatus;
  reviewer_notes?: string;
  confidence_score?: number;
}

export default function OutcomeValidationPage() {
  const [validations, setValidations] = useState<DbOutcomeValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [reviewPayload, setReviewPayload] = useState<ReviewPayload>({ status: 'approved' });
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const loadValidations = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetch(`/api/outcomes/validations?${params}`);
    if (res.ok) {
      const json = await res.json();
      setValidations(json.validations ?? []);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadValidations(); }, [loadValidations]);

  async function handleReview(id: string) {
    setSubmitting(true);
    const res = await fetch(`/api/outcomes/validations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload),
    });
    if (res.ok) {
      await loadValidations();
      setReviewOpen(null);
    }
    setSubmitting(false);
  }

  const filtered = validations.filter(v =>
    !search || v.id.includes(search) || v.validation_type.includes(search.toLowerCase())
  );

  const counts: Record<string, number> = { all: validations.length };
  validations.forEach(v => { counts[v.status] = (counts[v.status] ?? 0) + 1; });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#e8f0fe]">Outcome Validation</h1>
          <p className="text-[#7a8fa8] text-sm mt-0.5">
            Review evidence, verify outcomes, build outcome confidence scores
          </p>
        </div>
        <button
          onClick={loadValidations}
          className="flex items-center gap-2 h-10 px-4 bg-[#111927] border border-[#1c2a3a] text-[#7a8fa8] rounded-xl text-sm hover:text-[#e8f0fe] transition-colors"
        >
          <RefreshCw size={14} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {(['pending', 'under_review', 'requires_evidence', 'approved', 'rejected'] as ValidationStatus[]).map(s => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-2xl border transition-all text-left',
                statusFilter === s
                  ? `${cfg.bg} border-current/30`
                  : 'bg-[#111927] border-[#1c2a3a] hover:border-[#2c3a4a]'
              )}
            >
              <Icon size={18} className={cfg.color} strokeWidth={1.8} />
              <div>
                <p className={cn('text-[20px] font-bold', cfg.color)}>{counts[s] ?? 0}</p>
                <p className="text-[10px] text-[#7a8fa8] font-medium leading-none mt-0.5">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d5068]" strokeWidth={2} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search validations…"
            className="w-full h-9 pl-9 pr-4 bg-[#111927] border border-[#1c2a3a] rounded-lg text-[13px] text-[#e8f0fe] placeholder-[#3d5068] focus:outline-none focus:border-[#2c3a4a]"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                statusFilter === f.key
                  ? 'bg-accent/10 text-accent border border-accent/25'
                  : 'text-[#7a8fa8] hover:text-[#e8f0fe] hover:bg-[#111927]'
              )}
            >
              {f.label}
              {counts[f.key] !== undefined && (
                <span className="ml-1 text-[#3d5068]">({counts[f.key]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#111927] rounded-2xl border border-[#1c2a3a]">
          <Shield size={36} className="text-[#3d5068] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[#7a8fa8] font-medium">No validations found</p>
          <p className="text-[#3d5068] text-sm mt-1">Validations are created when participants submit outcome evidence.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(v => {
            const cfg = STATUS_CONFIG[v.status];
            const Icon = cfg.icon;
            const isExpanded = expanded === v.id;
            const isReviewing = reviewOpen === v.id;

            return (
              <div
                key={v.id}
                className="bg-[#111927] border border-[#1c2a3a] rounded-2xl overflow-hidden"
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : v.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#162030] transition-colors text-left"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <Icon size={15} className={cfg.color} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#e8f0fe] truncate">
                      {v.outcome_event_id ? `Outcome #${v.outcome_event_id.slice(0, 8)}` : 'Outcome Submission'}
                      {v.mission_id && <span className="text-[#3d5068] ml-2">· Mission {v.mission_id.slice(0, 8)}</span>}
                    </p>
                    <p className="text-[11px] text-[#7a8fa8] mt-0.5 capitalize">
                      {v.validation_type.replace(/_/g, ' ')} · {v.evidence.length} piece{v.evidence.length !== 1 ? 's' : ''} of evidence
                      {v.confidence_score !== null && (
                        <span className="ml-2 text-accent font-semibold">{v.confidence_score}% confidence</span>
                      )}
                    </p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0', cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                  <span className="text-[11px] text-[#3d5068] flex-shrink-0">
                    {new Date(v.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {isExpanded ? <ChevronUp size={15} className="text-[#3d5068]" /> : <ChevronDown size={15} className="text-[#3d5068]" />}
                </button>

                {/* Expanded evidence + review panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-[#1c2a3a] pt-4">
                        {/* Evidence */}
                        <p className="text-[11px] font-bold text-[#3d5068] uppercase tracking-wider mb-3">
                          Evidence ({v.evidence.length})
                        </p>
                        {v.evidence.length === 0 ? (
                          <p className="text-[12px] text-[#7a8fa8] mb-4">No evidence submitted yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                            {v.evidence.map((ev: ValidationEvidence, i: number) => {
                              const EvidIcon = EVIDENCE_ICON[ev.type] ?? FileText;
                              return (
                                <div key={i} className="flex items-start gap-3 bg-[#0a1020] rounded-xl p-3 border border-[#1c2a3a]">
                                  <div className="w-8 h-8 bg-[#162030] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <EvidIcon size={14} className="text-[#6D5DFD]" strokeWidth={1.8} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-[#e8f0fe] truncate">{ev.label}</p>
                                    <p className="text-[10px] text-[#7a8fa8] capitalize">{ev.type}</p>
                                    {ev.url && (
                                      <a href={ev.url} target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] text-accent hover:underline truncate block">
                                        View →
                                      </a>
                                    )}
                                    {ev.value && <p className="text-[10px] text-[#7a8fa8] mt-0.5 truncate">{ev.value}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reviewer notes */}
                        {v.reviewer_notes && (
                          <div className="mb-4 flex items-start gap-2 bg-[#0a1020] rounded-xl p-3 border border-[#1c2a3a]">
                            <MessageSquare size={14} className="text-[#7a8fa8] mt-0.5 flex-shrink-0" strokeWidth={1.8} />
                            <div>
                              <p className="text-[10px] font-bold text-[#3d5068] uppercase tracking-wider mb-1">Reviewer Notes</p>
                              <p className="text-[12px] text-[#e8f0fe]">{v.reviewer_notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Review actions */}
                        {['pending', 'under_review', 'requires_evidence'].includes(v.status) && (
                          <>
                            {!isReviewing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setReviewOpen(v.id); setReviewPayload({ status: 'approved', confidence_score: 85 }); }}
                                  className="flex items-center gap-1.5 h-8 px-3 bg-accent/10 text-accent border border-accent/25 rounded-lg text-[12px] font-semibold hover:bg-accent/20 transition-all"
                                >
                                  <CheckCircle2 size={13} strokeWidth={2.5} /> Approve
                                </button>
                                <button
                                  onClick={() => { setReviewOpen(v.id); setReviewPayload({ status: 'requires_evidence' }); }}
                                  className="flex items-center gap-1.5 h-8 px-3 bg-[#1a0a2a] text-[#a78bfa] border border-[#a78bfa]/25 rounded-lg text-[12px] font-semibold hover:bg-[#2a1040] transition-all"
                                >
                                  <AlertCircle size={13} strokeWidth={2.5} /> Request Evidence
                                </button>
                                <button
                                  onClick={() => { setReviewOpen(v.id); setReviewPayload({ status: 'rejected' }); }}
                                  className="flex items-center gap-1.5 h-8 px-3 bg-[#2a0a0a] text-[#f87171] border border-[#f87171]/25 rounded-lg text-[12px] font-semibold hover:bg-[#3a1010] transition-all"
                                >
                                  <XCircle size={13} strokeWidth={2.5} /> Reject
                                </button>
                              </div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0a1020] rounded-xl p-4 border border-[#1c2a3a]"
                              >
                                <p className="text-[12px] font-bold text-[#e8f0fe] mb-3">
                                  Review: <span className={cn(STATUS_CONFIG[reviewPayload.status].color, 'capitalize')}>
                                    {reviewPayload.status.replace(/_/g, ' ')}
                                  </span>
                                </p>

                                {reviewPayload.status === 'approved' && (
                                  <div className="mb-3">
                                    <label className="text-[11px] font-semibold text-[#7a8fa8] block mb-1">
                                      Confidence Score: {reviewPayload.confidence_score ?? 85}%
                                    </label>
                                    <input
                                      type="range" min={0} max={100}
                                      value={reviewPayload.confidence_score ?? 85}
                                      onChange={e => setReviewPayload(p => ({ ...p, confidence_score: Number(e.target.value) }))}
                                      className="w-full accent-accent"
                                    />
                                  </div>
                                )}

                                <textarea
                                  placeholder="Reviewer notes (optional)…"
                                  value={reviewPayload.reviewer_notes ?? ''}
                                  onChange={e => setReviewPayload(p => ({ ...p, reviewer_notes: e.target.value }))}
                                  rows={2}
                                  className="w-full bg-[#111927] border border-[#1c2a3a] rounded-lg px-3 py-2 text-[12px] text-[#e8f0fe] placeholder-[#3d5068] focus:outline-none focus:border-[#2c3a4a] resize-none mb-3"
                                />

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReview(v.id)}
                                    disabled={submitting}
                                    className="flex items-center gap-1.5 h-8 px-4 bg-accent text-[#060a0e] rounded-lg text-[12px] font-bold disabled:opacity-60"
                                  >
                                    {submitting ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : null}
                                    Submit Review
                                  </button>
                                  <button
                                    onClick={() => setReviewOpen(null)}
                                    className="h-8 px-3 text-[#7a8fa8] text-[12px] hover:text-[#e8f0fe] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
