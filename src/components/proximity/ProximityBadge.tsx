'use client';

import { MapPin } from 'lucide-react';
import { formatDistance, proximityColor } from '@/lib/proximity';

interface Props {
  distanceKm: number;
  size?: 'sm' | 'md';
}

export function ProximityBadge({ distanceKm, size = 'sm' }: Props) {
  const color = proximityColor(distanceKm);
  const isMd  = size === 'md';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: isMd ? 5 : 3,
      padding: isMd ? '4px 10px' : '2px 7px',
      borderRadius: 999,
      background: `${color}10`,
      border: `1px solid ${color}25`,
    }}>
      <MapPin size={isMd ? 11 : 9} strokeWidth={2.5} style={{ color }} />
      <span style={{ fontSize: isMd ? 11 : 9.5, fontWeight: 700, color }}>
        {formatDistance(distanceKm)}
      </span>
    </div>
  );
}
