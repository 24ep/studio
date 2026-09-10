"use client";

import { FlaskConical } from 'lucide-react';
import React from 'react';

export function DemoEnvironmentBanner() {
  const [isDemo, setIsDemo] = React.useState(false);
  React.useEffect(() => {
    void fetch('/api/settings/system-settings?keys=installationEnvironment', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((settings) => setIsDemo(settings?.installationEnvironment === 'demo'))
      .catch(() => undefined);
  }, []);
  if (!isDemo) return null;
  return (
    <div className="flex min-h-9 items-center justify-center gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-950 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100" role="status">
      <FlaskConical className="h-4 w-4 shrink-0" />
      Demo environment · All people and activity are synthetic. Email and webhook delivery are disabled.
    </div>
  );
}
