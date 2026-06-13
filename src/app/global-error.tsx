'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#070d0e', color: '#e9eff0', fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#7d8b8e', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            onClick={reset}
            style={{ background: '#27e07d', color: '#070d0e', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
