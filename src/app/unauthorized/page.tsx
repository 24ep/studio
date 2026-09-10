'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-8 animate-pulse shadow-lg ring-4 ring-red-50 dark:ring-red-900/10">
        <ShieldAlert className="h-10 w-10" />
      </div>
      
      <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
        ACCESS <span className="text-red-600">DENIED</span>
      </h1>
      
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed">
        You don't have the necessary permissions to view this page. If you believe this is an error, please contact your system administrator.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          className="h-12 px-6 gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <Button asChild className="h-12 px-8 gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-xl transition-all font-bold">
          <Link href="/">
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </Button>
      </div>
      
      <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 w-full max-w-xs text-xs text-zinc-400 flex flex-col gap-2">
        <p>RECRUITMENT PLATFORM SECURITY</p>
        <p className="font-mono opacity-50">ERROR_CODE: 403_FORBIDDEN</p>
      </div>
    </div>
  );
}
