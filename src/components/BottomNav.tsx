'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabaseUser, useSupabaseSignOut } from '@/hooks/useSupabaseUser';
import {
  Home, Compass, Target, MessageSquare, User,
  LogOut, Sun, Moon,
} from 'lucide-react';
import { useTotalUnread } from '@/hooks/useMessages';
import { useState, useEffect } from 'react';

const PRIMARY_NAV = [
  { href: '/home',     icon: Home,          label: 'Home'     },
  { href: '/explore',  icon: Compass,       label: 'Explore'  },
  { href: '/missions', icon: Target,        label: 'Missions', accent: true },
  { href: '/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { href: '/profile',  icon: User,          label: 'Profile'  },
];

function ThemeToggleBtn() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(localStorage.getItem('xhunt-theme') === 'light');
  }, []);
  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.setAttribute('data-theme', next ? 'light' : 'dark');
    localStorage.setItem('xhunt-theme', next ? 'light' : 'dark');
  }
  return (
    <button
      onClick={toggle}
      title={light ? 'Dark mode' : 'Light mode'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 8, borderRadius: 10, color: 'var(--t-faint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.15s',
      }}>
      {light ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useSupabaseUser();
  const signOut = useSupabaseSignOut();
  const totalUnread = useTotalUnread(user?.id ?? null);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Explorer';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* ─── Mobile bottom bar ─── */}
      <nav className="md:hidden liquid-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        borderTop: '1px solid var(--line)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{
          maxWidth: 520, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '8px 8px 10px',
        }}>
          {PRIMARY_NAV.map(({ href, icon: Icon, label, accent, badge }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const unread = badge && totalUnread > 0 ? totalUnread : 0;

            if (accent) return (
              <Link key={href} href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: active ? 'var(--t-accent)' : 'var(--t-card)',
                  border: active ? 'none' : '1px solid rgba(34,255,170,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 0 28px rgba(34,255,170,0.55)' : '0 0 14px rgba(34,255,170,0.12)',
                  marginTop: -18, transition: 'all 0.2s',
                }}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? '#050816' : 'var(--t-accent)' }} />
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? 'var(--t-accent)' : 'var(--t-faint)', letterSpacing: '0.02em' }}>{label}</span>
              </Link>
            );

            return (
              <Link key={href} href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '2px 10px', position: 'relative' }}>
                {active && (
                  <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 22, height: 2.5, borderRadius: 2, background: 'var(--t-accent)', boxShadow: '0 0 10px rgba(34,255,170,0.7)' }} />
                )}
                <div style={{ position: 'relative' }}>
                  <Icon size={21} strokeWidth={active ? 2.3 : 1.7} style={{ color: active ? 'var(--t-accent)' : 'var(--t-faint)', transition: 'color 0.15s' }} />
                  {unread > 0 && (
                    <div style={{ position: 'absolute', top: -5, right: -6, width: 16, height: 16, borderRadius: '50%', background: 'var(--t-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#050816', border: '2px solid var(--t-bg)' }}>
                      {unread > 9 ? '9+' : unread}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? 'var(--t-accent)' : 'var(--t-faint)', letterSpacing: '0.02em' }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ─── Desktop sidebar (260px) ─── */}
      <aside className="hidden md:flex liquid-nav" style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
        width: 260, flexDirection: 'column',
        borderRight: '1px solid var(--line)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.25)',
      }}>

        {/* Logo */}
        <Link href="/home" style={{
          display: 'flex', alignItems: 'center', gap: 11,
          height: 64, padding: '0 20px',
          borderBottom: '1px solid var(--line)',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--t-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(34,255,170,0.25)' }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--t-accent)', letterSpacing: '-0.05em' }}>X</span>
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--t-txt)', letterSpacing: '-0.02em' }}>X-Hunt</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--t-accent)', boxShadow: '0 0 6px rgba(34,255,170,0.7)' }} />
              <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--t-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Impact Platform</span>
            </div>
          </div>
        </Link>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px 10px' }}>Navigation</p>

          {PRIMARY_NAV.map(({ href, icon: Icon, label, accent, badge }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const unread = badge && totalUnread > 0 ? totalUnread : 0;
            return (
              <Link key={href} href={href} style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 14, marginBottom: 3,
                background: active ? (accent ? 'rgba(34,255,170,0.12)' : 'rgba(34,255,170,0.09)') : 'transparent',
                border: active ? '1px solid rgba(34,255,170,0.22)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Icon
                    size={18} strokeWidth={active ? 2.3 : 1.7}
                    style={{ color: active ? 'var(--t-accent)' : 'var(--t-faint)', transition: 'color 0.15s', display: 'block' }} />
                  {unread > 0 && (
                    <div style={{ position: 'absolute', top: -4, right: -6, minWidth: 15, height: 15, borderRadius: 8, background: 'var(--t-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 800, color: '#050816', padding: '0 2px', border: '1.5px solid var(--t-bg)' }}>
                      {unread > 9 ? '9+' : unread}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--t-txt)' : 'var(--t-dim)', transition: 'color 0.15s', flex: 1 }}>{label}</span>
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--t-accent)', boxShadow: '0 0 8px rgba(34,255,170,0.7)', flexShrink: 0 }} />}
              </Link>
            );
          })}
        </div>

        {/* User + controls */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {user.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(34,255,170,0.16)', border: '1px solid rgba(34,255,170,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-accent)' }}>{initials}</span>
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-txt)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Explorer'}
                </p>
                <p style={{ fontSize: 10.5, color: 'var(--t-faint)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email ?? ''}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <ThemeToggleBtn />
            <button
              onClick={() => signOut('/')}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10, color: 'var(--t-faint)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}>
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
