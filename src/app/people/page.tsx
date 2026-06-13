'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Users, Zap, Trophy, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const T = {
  bg: '#050816', panel: '#07101F', card: '#0A1226', elev: '#0D1530',
  line: 'rgba(255,255,255,.07)', line2: 'rgba(255,255,255,.12)',
  txt: '#F0F4FF', dim: '#8B9CC0', faint: '#4A5578',
  accent: '#22FFAA', ai: '#6D5DFD', warn: '#FFB84D', err: '#FF5C7A',
} as const;

interface Person {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  xp_balance: number;
  followers_count: number;
  following_count: number;
  missions_completed: number;
  is_following: boolean;
}

const TABS = ['Discover', 'Following', 'Followers'] as const;
type Tab = typeof TABS[number];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function Avatar({ name, url, size = 48 }: { name: string; url: string | null; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: url ? undefined : 'linear-gradient(135deg,rgba(34,255,170,.2),rgba(109,93,253,.2))',
      border: '1.5px solid rgba(255,255,255,.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: T.accent, overflow: 'hidden',
    }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(name)
      }
    </div>
  );
}

function PersonCard({ person, onFollowChange }: {
  person: Person;
  onFollowChange: (id: string, following: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    setLoading(true);
    try {
      const method = person.is_following ? 'DELETE' : 'POST';
      const res = await fetch('/api/social/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: person.id }),
      });
      if (res.ok) onFollowChange(person.id, !person.is_following);
    } finally {
      setLoading(false);
    }
  }

  const handle = '@' + person.display_name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
        borderBottom: `1px solid ${T.line}`, borderRadius: 16, marginBottom: 8,
      }}
    >
      <Avatar name={person.display_name} url={person.avatar_url} size={46} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>{person.display_name}</span>
          <span style={{ fontSize: 12, color: T.faint }}>{handle}</span>
        </div>

        {person.bio && (
          <p style={{ margin: '0 0 8px', fontSize: 12.5, color: T.dim, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {person.bio}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.faint }}>
            <Users size={11} />
            <span><b style={{ color: T.dim }}>{person.followers_count}</b> followers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.faint }}>
            <Zap size={11} style={{ color: T.ai }} />
            <span><b style={{ color: T.dim }}>{person.xp_balance.toLocaleString()}</b> XP</span>
          </div>
          {person.missions_completed > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.faint }}>
              <Trophy size={11} style={{ color: T.warn }} />
              <span><b style={{ color: T.dim }}>{person.missions_completed}</b></span>
            </div>
          )}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={toggleFollow}
        disabled={loading}
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
          border: person.is_following ? `1px solid rgba(255,255,255,.12)` : `1px solid ${T.accent}40`,
          background: person.is_following ? 'rgba(255,255,255,.04)' : `${T.accent}14`,
          color: person.is_following ? T.dim : T.accent,
          transition: 'all .15s', fontFamily: 'inherit',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {person.is_following
          ? <><UserCheck size={13} /> Following</>
          : <><UserPlus size={13} /> Follow</>
        }
      </motion.button>
    </motion.div>
  );
}

export default function PeoplePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Discover');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchPeople = useCallback(async (t: Tab, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tab: t.toLowerCase(),
        ...(q ? { q } : {}),
      });
      const res = await fetch(`/api/social/people?${params}`);
      if (res.ok) {
        const d = await res.json() as { people: Person[] };
        setPeople(d.people ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPeople(tab, query); }, [fetchPeople, tab, query]);

  function handleFollowChange(id: string, following: boolean) {
    setPeople(prev => prev.map(p =>
      p.id === id
        ? {
            ...p,
            is_following: following,
            followers_count: p.followers_count + (following ? 1 : -1),
          }
        : p
    ));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput.trim());
  }

  return (
    <main className="consumer-app" style={{ background: T.bg, minHeight: '100dvh', paddingBottom: '5.5rem' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(5,8,22,.94)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.line}`,
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 4 }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, margin: 0, flex: 1 }}>People</h1>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
            <div className="liquid-glass" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: T.elev, border: `1px solid ${T.line2}`,
              borderRadius: 12, padding: '10px 14px',
            }}>
              <Search size={15} style={{ color: T.faint, flexShrink: 0 }} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by name…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: T.txt, fontSize: 14, fontFamily: 'inherit',
                }}
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setQuery(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.faint, padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Tabs */}
          <div style={{ display: 'flex' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px 0 10px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13.5, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? T.txt : T.dim,
                borderBottom: `2px solid ${tab === t ? T.accent : 'transparent'}`,
                transition: 'all .15s', fontFamily: 'inherit',
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '40px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px' }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.elev }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 14, width: '45%', borderRadius: 6, background: T.elev }} />
                    <div style={{ height: 11, width: '70%', borderRadius: 6, background: T.panel }} />
                    <div style={{ height: 10, width: '55%', borderRadius: 6, background: T.panel }} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : people.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${T.accent}0D`, border: `1px solid ${T.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={24} strokeWidth={1.5} style={{ color: T.accent }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: T.txt, margin: '0 0 6px' }}>
                {query ? 'No results found' : tab === 'Following' ? 'Not following anyone yet' : tab === 'Followers' ? 'No followers yet' : 'No people yet'}
              </p>
              <p style={{ fontSize: 13, color: T.faint, margin: '0 0 20px', lineHeight: 1.5 }}>
                {query ? `Try a different search term.` : tab === 'Discover' ? 'Be the first to join the community.' : 'Start connecting with other hunters.'}
              </p>
              {tab !== 'Discover' && (
                <button onClick={() => setTab('Discover')} style={{
                  padding: '10px 22px', borderRadius: 12, background: T.accent, color: '#050816',
                  fontWeight: 700, fontSize: 13.5, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Discover People
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key={tab + query} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {people.map((person, i) => (
                <motion.div key={person.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <PersonCard person={person} onFollowChange={handleFollowChange} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </main>
  );
}
