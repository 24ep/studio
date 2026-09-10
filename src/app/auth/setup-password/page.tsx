import { Suspense } from 'react';

import SetupPasswordClient from './SetupPasswordClient';

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<SetupPasswordPageLoading />}>
      <SetupPasswordClient />
    </Suspense>
  );
}

function SetupPasswordPageLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="h-72 w-full max-w-md animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900" />
    </main>
  );
}
