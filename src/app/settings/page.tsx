
"use client";
// This page is no longer the main settings hub.
// It can be removed or act as a simple redirect / overview page.
// For this change, we will effectively remove its content and assume redirection
// or that it's no longer directly linked from "General Settings".
// The "General Settings" link in SidebarNav will now point to /settings/preferences.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Corrected import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new preferences page as the default settings landing
    router.replace('/settings/preferences');
  }, [router]);

  // Show a loading/redirecting state while redirecting
  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Redirecting to preferences...</p>
          <Skeleton className="h-8 w-1/2 mt-4" />
          <Skeleton className="h-24 w-full mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

    