'use client';

import { motion } from 'framer-motion';
import { MapPin, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { t } from '@/theme/colors';
import type { PermissionStatus } from '@/hooks/useProximity';

interface Props {
  status: PermissionStatus;
  loading: boolean;
  cityName?: string | null;
  onRequest: () => void;
}

export function LocationPermissionCard({ status, loading, cityName, onRequest }: Props) {
  if (status === 'granted' && cityName) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 12, background: `${t.accent}0A`, border: `1px solid ${t.accent}18`, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${t.accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MapPin size={12} strokeWidth={2.5} style={{ color: t.accent }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>Showing missions near {cityName}</span>
      </motion.div>
    );
  }

  if (status === 'denied') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14, background: `${t.error}08`, border: `1px solid ${t.error}18`, marginBottom: 14 }}>
        <AlertCircle size={15} strokeWidth={2} style={{ color: t.error, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: t.txt }}>Location access blocked</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: t.txtDim, lineHeight: 1.4 }}>
            Enable location in your browser settings to see missions near you.
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === 'unsupported') return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: '14px 16px', borderRadius: 16, background: `${t.ai}08`, border: `1px solid ${t.ai}20`, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${t.ai}14`, border: `1px solid ${t.ai}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Navigation size={17} strokeWidth={1.8} style={{ color: t.ai }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.txt }}>Find missions near you</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: t.txtDim }}>Enable location to see distance and sort by proximity</p>
        </div>
        <button
          onClick={onRequest}
          disabled={loading}
          style={{ flexShrink: 0, height: 36, padding: '0 14px', borderRadius: 10, background: t.ai, border: 'none', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading
            ? <Loader2 size={13} strokeWidth={2} style={{ color: t.txt, animation: 'spin 1s linear infinite' }} />
            : <Navigation size={13} strokeWidth={2.5} style={{ color: '#fff' }} />
          }
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{loading ? 'Locating…' : 'Allow'}</span>
        </button>
      </div>
    </motion.div>
  );
}
