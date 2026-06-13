'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, BarChart3 } from 'lucide-react';
import { t } from '@/theme/colors';

function ActivityItem({ text, sub, xp, positive, index }: {
  text: string; sub: string; xp: string; positive: boolean; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: .05 + index * .07, duration: .3 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 11, background: positive ? `${t.accent}14` : `${t.error}14`, border: `1px solid ${positive ? t.accent : t.error}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {positive
          ? <CheckCircle2 size={15} strokeWidth={2} style={{ color: t.accent }} />
          : <BarChart3 size={15} strokeWidth={2} style={{ color: t.error }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.txt, lineHeight: 1.25 }}>{text}</p>
        <p style={{ margin: '2px 0 0', fontSize: 10.5, color: t.txtFaint }}>{sub}</p>
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: positive ? t.accent : t.error, flexShrink: 0 }}>{xp}</span>
    </motion.div>
  );
}

interface ActivityFeedProps {
  completedHunts: { title: string }[];
  streak: number;
}

export function ActivityFeed({ completedHunts, streak }: ActivityFeedProps) {
  return (
    <>
      {completedHunts.slice(0, 3).map((hunt, i) => (
        <ActivityItem
          key={i}
          text="Mission Completed"
          sub={hunt.title.length > 32 ? hunt.title.slice(0, 30) + '…' : hunt.title}
          xp="+250 XP"
          positive
          index={i}
        />
      ))}
      {streak > 1 && (
        <ActivityItem
          text="Streak Milestone"
          sub={`${streak} day streak reached`}
          xp={`+${streak * 10} XP`}
          positive
          index={completedHunts.length}
        />
      )}
    </>
  );
}
