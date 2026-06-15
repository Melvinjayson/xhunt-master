'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

export interface MissionFeedItem {
  id: string;
  title: string;
  description: string;
  tenant_id: string;
  status: string;
  reward_amount: number | null;
  xp_reward: number | null;
  difficulty: string | null;
  spots_remaining: number | null;
  spots_total: number | null;
  category: string | null;
  location: unknown;
  expires_at: string | null;
  created_at: string;
}

interface UseMissionFeedOptions {
  tenantId?: string;
  limit?: number;
}

interface UseMissionFeedReturn {
  missions: MissionFeedItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMissionFeed(options: UseMissionFeedOptions = {}): UseMissionFeedReturn {
  const { tenantId, limit = 50 } = options;
  const [missions, setMissions] = useState<MissionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('missions')
        .select(`
          id, title, description, tenant_id, status,
          reward_amount, xp_reward, difficulty,
          spots_remaining, spots_total, category,
          location, expires_at, created_at
        `)
        .in('status', ['active', 'published'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setMissions(data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, limit]);

  useEffect(() => {
    fetchMissions();

    // Subscribe to Postgres Changes on missions table for live updates
    let channelName = 'mission-feed';
    if (tenantId) channelName += `:tenant=${tenantId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'missions',
          ...(tenantId ? { filter: `tenant_id=eq.${tenantId}` } : {}),
        },
        (payload) => {
          const newMission = payload.new as MissionFeedItem;
          if (newMission.status === 'active' || newMission.status === 'published') {
            setMissions((prev) => [newMission, ...prev].slice(0, limit));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'missions',
          ...(tenantId ? { filter: `tenant_id=eq.${tenantId}` } : {}),
        },
        (payload) => {
          const updated = payload.new as MissionFeedItem;
          setMissions((prev) => {
            // Remove if no longer active/published; update otherwise
            if (updated.status !== 'active' && updated.status !== 'published') {
              return prev.filter((m) => m.id !== updated.id);
            }
            const exists = prev.some((m) => m.id === updated.id);
            if (exists) return prev.map((m) => (m.id === updated.id ? updated : m));
            return [updated, ...prev].slice(0, limit);
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchMissions, tenantId, limit]);

  return { missions, loading, error, refresh: fetchMissions };
}
