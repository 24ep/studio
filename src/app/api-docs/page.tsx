
// src/app/api-docs/page.tsx
// This page is now effectively part of the settings layout.
// Redirect to /settings/api-docs if accessed directly.
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ApiDocsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/api-docs');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to API Documentation...</p>
    </div>
  );
}
