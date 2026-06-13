'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  compact?: boolean;
  className?: string;
  onChange?: (theme: 'dark' | 'light') => void;
}

export default function ThemeToggle({ compact = false, className, onChange }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('xhunt-theme') as 'dark' | 'light' | null;
    const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    setTheme(saved ?? current ?? 'dark');
  }, []);

  function toggle() {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('xhunt-theme', next);
    onChange?.(next);
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
          'text-[#8B9CC0] hover:text-[#F0F4FF] hover:bg-[#0A1226]',
          className
        )}
      >
        {theme === 'dark'
          ? <Sun size={14} strokeWidth={1.8} />
          : <Moon size={14} strokeWidth={1.8} />}
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2">
        {theme === 'dark'
          ? <Moon size={13} className="text-[#6D5DFD]" strokeWidth={1.8} />
          : <Sun size={13} className="text-[#FFB84D]" strokeWidth={1.8} />}
        <span className="text-[12px] font-medium text-[#8B9CC0]">
          {theme === 'dark' ? 'Dark' : 'Light'} mode
        </span>
      </div>
      <button
        onClick={toggle}
        className={cn(
          'relative w-10 h-6 rounded-full transition-all flex-shrink-0',
          theme === 'light' ? 'bg-accent' : 'bg-[#0D1530] border border-[#162440]'
        )}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className={cn(
          'absolute top-1 w-4 h-4 rounded-full transition-all',
          theme === 'light' ? 'right-1 bg-[#060a0e]' : 'left-1 bg-[#4A5578]'
        )} />
      </button>
    </div>
  );
}
