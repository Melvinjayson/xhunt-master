'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coords, GeoPlace } from '@/lib/proximity';
import { reverseGeocode } from '@/lib/proximity';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'idle';

export interface ProximityState {
  coords: Coords | null;
  place: GeoPlace | null;
  status: PermissionStatus;
  loading: boolean;
  error: string | null;
  /** Call this to trigger a geolocation request. */
  requestLocation: () => void;
}

const COORDS_KEY = 'xhunt-user-coords';
const PLACE_KEY  = 'xhunt-user-place';

function loadCachedCoords(): Coords | null {
  try { return JSON.parse(localStorage.getItem(COORDS_KEY) ?? 'null'); } catch { return null; }
}
function loadCachedPlace(): GeoPlace | null {
  try { return JSON.parse(localStorage.getItem(PLACE_KEY) ?? 'null'); } catch { return null; }
}

export function useProximity(): ProximityState {
  const [coords,  setCoords]  = useState<Coords | null>(null);
  const [place,   setPlace]   = useState<GeoPlace | null>(null);
  const [status,  setStatus]  = useState<PermissionStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const resolving = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const c = loadCachedCoords();
    const p = loadCachedPlace();
    if (c) { setCoords(c); setStatus('granted'); }
    if (p) setPlace(p);

    // Check current permission state without triggering a prompt
    if (!navigator.permissions) {
      if (!c) setStatus('idle');
      return;
    }
    navigator.permissions.query({ name: 'geolocation' }).then(perm => {
      setStatus(perm.state as PermissionStatus);
      perm.onchange = () => setStatus(perm.state as PermissionStatus);
    }).catch(() => setStatus('idle'));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setStatus('unsupported'); return; }
    if (resolving.current) return;
    resolving.current = true;
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus('granted');
        try {
          localStorage.setItem(COORDS_KEY, JSON.stringify(c));
        } catch { /* ignore quota */ }

        try {
          const p = await reverseGeocode(c);
          setPlace(p);
          try { localStorage.setItem(PLACE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
        } catch { /* place is optional */ }

        setLoading(false);
        resolving.current = false;
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'idle');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied.'
            : 'Could not determine your location.'
        );
        setLoading(false);
        resolving.current = false;
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { coords, place, status, loading, error, requestLocation };
}
