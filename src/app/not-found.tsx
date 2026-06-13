import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        background: '#070d0e',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-onest), system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e9eff0', marginBottom: '0.5rem' }}>
        Page not found
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#7d8b8e', marginBottom: '1.5rem', maxWidth: 320 }}>
        This mission doesn&apos;t exist or was removed. Explore what&apos;s available.
      </p>
      <Link
        href="/home"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0.75rem 1.5rem', borderRadius: '12px',
          background: '#27e07d', color: '#070d0e',
          fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
        }}
      >
        Back to Home
      </Link>
    </main>
  );
}
