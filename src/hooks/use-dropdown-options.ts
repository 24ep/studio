'use client';

import { useEffect, useRef, useState } from 'react';
import type { DropdownOption } from '@/lib/dropdown-option-catalog';

const cache = new Map<string, DropdownOption[]>();

export function useDropdownOptions(key: string, fallback: DropdownOption[]) {
  const fallbackRef = useRef(fallback);
  const [options, setOptions] = useState<DropdownOption[]>(() => cache.get(key) || fallback);
  useEffect(() => {
    let active = true;
    fetch(`/api/settings/dropdown-options?key=${encodeURIComponent(key)}`)
      .then(response => response.ok ? response.json() : fallbackRef.current)
      .then(value => {
        const next = Array.isArray(value) && value.length ? value : fallbackRef.current;
        cache.set(key, next);
        if (active) setOptions(next);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [key]);
  return options.filter(option => option.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}
