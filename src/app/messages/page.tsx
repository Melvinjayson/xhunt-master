import { MessageSquare, Sparkles, Users, Zap, ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';

const CHANNELS = [
  {
    icon: Bot,
    label: 'Venus AI',
    desc: 'Your personal impact assistant',
    accent: '#6D5DFD',
    badge: 'AI',
    href: '/messages/venus',
  },
  {
    icon: MessageSquare,
    label: 'Direct Messages',
    desc: 'Chat with mission partners',
    accent: '#22FFAA',
    badge: null,
    href: '/messages',
  },
  {
    icon: Users,
    label: 'Mission Groups',
    desc: 'Collaborate with your team',
    accent: '#FFB84D',
    badge: null,
    href: '/messages',
  },
];

export default function MessagesIndexPage() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--t-bg)',
      padding: '40px 24px',
      gap: 0,
    }}>
      {/* Icon cluster */}
      <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,255,170,0.12) 0%, rgba(109,93,253,0.08) 60%, transparent 100%)',
          border: '1px solid rgba(34,255,170,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageSquare size={32} strokeWidth={1.5} style={{ color: '#22FFAA' }} />
        </div>
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 28, height: 28, borderRadius: '50%',
          background: '#6D5DFD',
          border: '2px solid var(--t-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={13} strokeWidth={2} style={{ color: '#fff' }} />
        </div>
      </div>

      {/* Heading */}
      <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--t-txt)', margin: '0 0 8px', letterSpacing: '-0.03em', textAlign: 'center' }}>
        XChat
      </h2>
      <p style={{ fontSize: 14, color: 'var(--t-dim)', margin: '0 0 32px', lineHeight: 1.6, textAlign: 'center', maxWidth: 300 }}>
        Select a conversation, or join a mission to start collaborating with your team.
      </p>

      {/* Channel cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
        {CHANNELS.map(({ icon: Icon, label, desc, accent, badge, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 18,
              background: `${accent}08`,
              border: `1px solid ${accent}18`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${accent}14`, border: `1px solid ${accent}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={1.8} style={{ color: accent }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-txt)' }}>{label}</span>
                  {badge && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: accent, background: `${accent}14`, border: `1px solid ${accent}24`, borderRadius: 999, padding: '1px 7px' }}>{badge}</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--t-dim)' }}>{desc}</p>
              </div>
              <ArrowRight size={14} strokeWidth={2} style={{ color: 'var(--t-faint)', flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Mission chat hint */}
      <div style={{
        marginTop: 24,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px',
        background: 'rgba(34,255,170,0.05)',
        border: '1px solid rgba(34,255,170,0.12)',
        borderRadius: 999,
      }}>
        <Zap size={13} style={{ color: '#22FFAA' }} />
        <span style={{ fontSize: 12, color: 'var(--t-dim)', fontWeight: 500 }}>
          Mission chats are created automatically when you join
        </span>
      </div>
    </div>
  );
}
