"use client";

import { useEffect, useState } from 'react';

import {
  DEFAULT_SUPPORT_CATEGORIES,
  type ServiceDeskCategoryOption,
} from '@/lib/service-desk-contract';

export function useServiceDeskCategories() {
  const [categories, setCategories] = useState<ServiceDeskCategoryOption[]>(
    DEFAULT_SUPPORT_CATEGORIES.map(category => ({ ...category })),
  );

  useEffect(() => {
    let active = true;
    void fetch('/api/privacy-support/categories', { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json() as { categories?: ServiceDeskCategoryOption[] };
        if (response.ok && Array.isArray(payload.categories) && active) setCategories(payload.categories);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return categories;
}
