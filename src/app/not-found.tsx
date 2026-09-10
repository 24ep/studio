'use client';

import Link from 'next/link';
import {
  ArrowLeftIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign('/');
  }

  function openSearch() {
    window.dispatchEvent(new Event('header-search:open'));
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-7rem)] w-full items-center justify-center overflow-hidden bg-background px-6 py-20">
      <nav aria-label="Breadcrumb" className="absolute left-6 top-6 flex items-center gap-2 text-xs text-muted-foreground sm:left-8">
        <Link href="/" className="font-medium text-[#5b8dff] hover:underline">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Page not found</span>
      </nav>

      <main className="flex w-full max-w-[620px] -translate-y-8 flex-col items-center text-center sm:-translate-y-16">
        <div className="relative grid h-[96px] w-[96px] place-items-center rounded-full border border-[#3478ff] text-foreground shadow-[0_0_38px_rgba(52,120,255,0.16)] sm:h-[120px] sm:w-[120px]">
          <MapPinIcon className="h-12 w-12 sm:h-[60px] sm:w-[60px]" aria-hidden="true" />
          <span className="absolute bottom-[19px] right-[18px] grid h-8 w-8 place-items-center rounded-full bg-background sm:bottom-[25px] sm:right-[24px] sm:h-9 sm:w-9">
            <MagnifyingGlassIcon className="h-6 w-6 sm:h-[30px] sm:w-[30px]" aria-hidden="true" />
          </span>
        </div>

        <p className="mt-7 text-[13px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">Page not found</p>
        <p aria-hidden="true" className="mt-3 text-[56px] font-light leading-none tracking-[-0.04em] text-muted-foreground/45 sm:text-[68px]">404</p>
        <h1 className="mt-5 text-[30px] font-semibold tracking-[-0.025em] text-foreground sm:mt-6 sm:text-[36px]">We couldn’t find that page</h1>
        <p className="mt-3 max-w-[540px] text-[15px] leading-6 text-muted-foreground sm:text-[16px] sm:leading-7">
          The link may be outdated, or the page may have moved.
        </p>

        <Button asChild size="lg" className="mt-6 h-12 min-w-[220px] px-6 text-[15px] font-semibold sm:mt-7 sm:h-[52px] sm:min-w-[228px]">
          <Link href="/">
            <HomeIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Go to home
          </Link>
        </Button>

        <div className="mt-5 flex items-center justify-center gap-5 text-[14px] font-medium text-[#5b8dff] sm:mt-6 sm:text-[15px]">
          <button type="button" className="inline-flex items-center gap-1.5 hover:underline" onClick={goBack}>
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Go back
          </button>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <button type="button" className="inline-flex items-center gap-1.5 hover:underline" onClick={openSearch}>
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
            Search hrive
          </button>
        </div>

        <div className="mt-7 w-full max-w-[430px] border-t border-border pt-5 text-[12px] text-muted-foreground sm:mt-9 sm:pt-7 sm:text-[13px]">
          Error code: <span className="font-medium">404</span>
        </div>
      </main>
    </div>
  );
}
