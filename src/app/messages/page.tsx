import { MessageSquare, Zap } from 'lucide-react';

export default function MessagesIndexPage() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      background: '#050816',
      padding: 32,
    }}>
      {/* Only visible on desktop when no conversation is selected */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(34,255,170,0.08)',
        border: '1px solid rgba(34,255,170,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <MessageSquare size={30} style={{ color: '#22FFAA' }} />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 280 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F4FF', margin: '0 0 8px' }}>
          XChat
        </h2>
        <p style={{ fontSize: 14, color: '#8B9CC0', margin: '0 0 4px', lineHeight: 1.6 }}>
          Select a conversation from the left, or join a mission to start collaborating.
        </p>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px',
        background: 'rgba(34,255,170,0.06)',
        border: '1px solid rgba(34,255,170,0.12)',
        borderRadius: 20,
      }}>
        <Zap size={13} style={{ color: '#22FFAA' }} />
        <span style={{ fontSize: 12, color: '#22FFAA', fontWeight: 600 }}>
          Mission chats are created automatically when you join
        </span>
      </div>
    </div>
  );
}
