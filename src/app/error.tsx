'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <main
      style={{
        background: '#070d0e',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔥</div>
        <h2 style={{ color: '#e9eff0', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Something broke
        </h2>
        <p style={{ color: '#7d8b8e', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ background: '#27e07d', color: '#070d0e', border: 'none', borderRadius: '10px', padding: '0.625rem 1.25rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/home')}
            style={{ background: '#17262a', color: '#e9eff0', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', padding: '0.625rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Go home
          </button>
        </div>
      </div>
    </main>
  );
}
