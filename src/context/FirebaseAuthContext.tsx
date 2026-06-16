'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export interface FirebaseAuthState {
  user:    User | null;
  loading: boolean;
}

const AuthContext = createContext<FirebaseAuthState>({ user: null, loading: true });

async function syncSession(user: User | null): Promise<void> {
  if (user) {
    const token = await user.getIdToken();
    await fetch('/api/auth/session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    }).catch(() => {});
  } else {
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
  }
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FirebaseAuthState>({ user: null, loading: true });

  useEffect(() => {
    if (!auth) {
      setState({ user: null, loading: false });
      return;
    }
    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChanged(auth, async (user) => {
        await syncSession(user);
        setState({ user, loading: false });
      });
    } catch {
      setState({ user: null, loading: false });
    }
    return () => unsub?.();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth(): FirebaseAuthState {
  return useContext(AuthContext);
}

export function useFirebaseSignOut() {
  return useCallback(async (redirectUrl = '/') => {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    window.location.href = redirectUrl;
  }, []);
}
