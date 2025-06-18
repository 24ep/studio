
// src/app/logs/page.tsx
// This page is now effectively part of the settings layout.
// Redirect to /settings/logs if accessed directly.
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/logs');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to Application Logs...</p>
    </div>
  );
}
