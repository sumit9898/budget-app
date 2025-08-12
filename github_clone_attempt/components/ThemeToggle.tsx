"use client";

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 'light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (current) setTheme(current);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  return (
    <button
      aria-label="Toggle theme"
      className="btn btn-ghost"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
    >
      {theme === 'light' ? (
        <div className="flex items-center gap-2"><SunIcon className="w-5 h-5" /> Light</div>
      ) : (
        <div className="flex items-center gap-2"><MoonIcon className="w-5 h-5" /> Dark</div>
      )}
    </button>
  );
}

