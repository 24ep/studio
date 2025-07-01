// src/app/users/page.tsx
// This page is now effectively part of the settings layout.
// Redirect to /settings/users if accessed directly.
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function UsersRedirectPage() {
  const router = useRouter();

  // useEffect(() => {
  //   router.replace('/settings/users');
  // }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Please use the sidebar to access user management.</p>
    </div>
  );
}
