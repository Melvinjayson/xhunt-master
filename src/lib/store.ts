import type { AppState, ImpactProfile } from './types';

const STORAGE_KEY = 'xhunt_v1';

export const initialState: AppState = {
  user: null,
  hunts: [],
  progress: {},
  completedHunts: [],
  streak: 0,
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

const PROFILE_KEY = 'xhunt_impact_v1';

export function loadProfile(): ImpactProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as ImpactProfile) : null;
  } catch { return null; }
}

export function saveProfile(p: ImpactProfile): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}
