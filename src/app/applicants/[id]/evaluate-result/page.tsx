"use client";

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { EvaluateResultPageContent } from './EvaluateResultPageContent';

function EvaluateResultPageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function EvaluateResultPage() {
  return (
    <Suspense fallback={<EvaluateResultPageFallback />}>
      <EvaluateResultPageContent />
    </Suspense>
  );
}
