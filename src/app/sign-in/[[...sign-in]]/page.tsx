import Image from 'next/image';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--t-bg, #050816)', display: 'flex' }}>
      {/* ── Left panel (desktop) ── */}
      <div
        style={{ display: 'none', position: 'relative', flex: '0 0 52%', overflow: 'hidden',
          background: 'linear-gradient(135deg, #020A14 0%, #041220 40%, #051A18 100%)' }}
        className="md:flex md:flex-col md:justify-between md:p-12"
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 80% 70% at 50% 60%, rgba(0,200,130,0.13) 0%, rgba(0,120,100,0.06) 45%, transparent 75%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 40px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '4/3' }}>
            <Image src="/xhunt-logo.png" alt="" fill
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 80px rgba(0,200,130,0.35))' }} priority />
            <div style={{ position: 'absolute', inset: '10%',
              background: 'radial-gradient(ellipse at 45% 40%, rgba(0,210,140,0.22) 0%, rgba(0,160,110,0.14) 35%, transparent 85%)',
              borderRadius: '50%', filter: 'blur(24px)' }} />
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto', paddingTop: 60 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#22FFAA', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            AI-Powered Experiences
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 900, color: '#F0F4FF', lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            Discover your<br />next mission.
          </h1>
          <p style={{ fontSize: 15, color: '#8B9CC0', lineHeight: 1.65, maxWidth: 340 }}>
            Personalised AI missions that guide you through real‑world challenges, adventures, and meaningful impact.
          </p>
        </div>
      </div>

      {/* ── Right panel — Clerk SignIn ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 64px) clamp(20px, 6vw, 72px)', position: 'relative', overflow: 'hidden' }}>
        <div className="md:hidden" style={{ position: 'absolute', top: '-20%', right: '-20%', width: '70vw', height: '70vw',
          background: 'radial-gradient(circle, rgba(0,200,130,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <Image src="/xhunt-logo.png" alt="X-hunt" width={100} height={100} style={{ objectFit: 'contain' }} priority />
          </div>

          <SignIn
            appearance={{
              variables: {
                colorPrimary: '#22FFAA',
                colorBackground: '#050816',
                colorInputBackground: 'rgba(10,18,38,0.8)',
                colorInputText: '#F0F4FF',
                colorText: '#F0F4FF',
                colorTextSecondary: '#8B9CC0',
                colorDanger: '#FF5C7A',
                borderRadius: '12px',
                fontFamily: 'var(--font-onest), system-ui, sans-serif',
              },
              elements: {
                card: { background: 'transparent', boxShadow: 'none', padding: 0 },
                headerTitle: { color: '#F0F4FF', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em' },
                headerSubtitle: { color: '#8B9CC0' },
                socialButtonsBlockButton: {
                  background: 'rgba(10,18,38,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F0F4FF',
                  borderRadius: '12px',
                },
                dividerLine: { background: 'rgba(255,255,255,0.08)' },
                dividerText: { color: '#4A5578' },
                formFieldLabel: { color: '#8B9CC0', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' },
                formFieldInput: {
                  background: 'rgba(10,18,38,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F0F4FF',
                  borderRadius: '12px',
                },
                formButtonPrimary: {
                  background: '#22FFAA',
                  color: '#050816',
                  fontWeight: '700',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(34,255,170,0.3)',
                },
                footerActionText: { color: '#4A5578' },
                footerActionLink: { color: '#22FFAA', fontWeight: '700' },
                identityPreviewText: { color: '#F0F4FF' },
                identityPreviewEditButtonIcon: { color: '#8B9CC0' },
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/home"
          />

          <p style={{ marginTop: 20, fontSize: 13, color: '#4A5578', textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" style={{ color: '#22FFAA', fontWeight: 700, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
