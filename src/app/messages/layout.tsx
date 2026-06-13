'use client';

import { usePathname } from 'next/navigation';
import ConversationList from '@/components/chat/ConversationList';
import BottomNav from '@/components/BottomNav';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === '/messages';

  return (
    <div className="consumer-app" style={{
      height: '100dvh',
      display: 'flex',
      overflow: 'hidden',
      background: '#050816',
    }}>
      <BottomNav />

      {/* Conversation sidebar */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
          // Mobile: show only on root, hidden in chat
          display: isRoot ? 'flex' : 'none',
          flexDirection: 'column',
        }}
        className={`${isRoot ? 'flex' : 'hidden'} md:flex`}
      >
        <ConversationList />
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        className={`${!isRoot ? 'flex' : 'hidden'} md:flex`}
      >
        {children}
      </div>
    </div>
  );
}
