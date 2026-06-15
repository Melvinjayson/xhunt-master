'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth';
import { auth, getGoogleProvider } from '@/lib/firebase/client';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_url') ?? '/home';

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function afterSignIn(cred: UserCredential) {
    const token = await cred.user.getIdToken();
    const res   = await fetch('/api/auth/session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error('Session creation failed');
    router.replace(redirectTo);
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await afterSignIn(cred);
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      if (msg === 'auth/invalid-credential' || msg === 'auth/user-not-found' || msg === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (msg === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, getGoogleProvider());
      await afterSignIn(cred);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(10,18,38,0.8)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', color: '#F0F4FF',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--t-bg, #050816)', display: 'flex' }}>

      {/* ── Left branding panel (desktop) ── */}
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

      {/* ── Right panel — form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 64px) clamp(20px, 6vw, 72px)', position: 'relative', overflow: 'hidden' }}>
        <div className="md:hidden" style={{ position: 'absolute', top: '-20%', right: '-20%', width: '70vw', height: '70vw',
          background: 'radial-gradient(circle, rgba(0,200,130,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <Image src="/xhunt-logo.png" alt="X-hunt" width={100} height={100} style={{ objectFit: 'contain' }} priority />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#F0F4FF', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: '#8B9CC0', margin: '0 0 28px' }}>Sign in to your X-hunt account</p>

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading || loading}
            style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', marginBottom: 20, padding: '12px', fontWeight: 600,
              opacity: googleLoading ? 0.7 : 1 }}>
            {googleLoading ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 12, color: '#4A5578', fontWeight: 600 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8B9CC0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8B9CC0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#4A5578', padding: 0, display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,92,122,0.08)',
                border: '1px solid rgba(255,92,122,0.2)', fontSize: 13, color: '#FF5C7A' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || googleLoading}
              style={{ height: 46, borderRadius: 12, background: '#22FFAA', color: '#050816',
                fontWeight: 700, fontSize: 14, fontFamily: 'inherit', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(34,255,170,0.3)', transition: 'all .2s' }}>
              {loading
                ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} />
                : <>Sign in <ArrowRight size={14} strokeWidth={2.5} /></>}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: '#4A5578', textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" style={{ color: '#22FFAA', fontWeight: 700, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
