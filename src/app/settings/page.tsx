
// src/app/settings/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; 

export default function SettingsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the preferences page as the default settings landing
    router.replace('/settings/preferences');
  }, [router]);

  // Optionally, show a loading state while redirecting, though it might be too quick to notice
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Loading settings...</p>
    </div>
  );
}
