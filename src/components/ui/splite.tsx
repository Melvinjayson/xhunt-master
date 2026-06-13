'use client';

import dynamic from 'next/dynamic';
import { Suspense, Component, type ReactNode } from 'react';

const Spline = dynamic(() => import('@splinetool/react-spline').catch(() => ({ default: () => null })), { ssr: false });

interface SplineSceneProps {
  scene: string;
  className?: string;
}

class SplineErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? (this.props.fallback ?? null) : this.props.children;
  }
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <SplineErrorBoundary>
      <Suspense fallback={null}>
        <Spline scene={scene} className={className} />
      </Suspense>
    </SplineErrorBoundary>
  );
}
