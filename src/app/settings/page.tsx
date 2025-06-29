// src/app/settings/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to preferences page as the default settings page
    router.replace('/settings/preferences');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to preferences...</p>
      </div>
    </div>
  );
}
