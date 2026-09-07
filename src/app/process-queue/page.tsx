'use client';

import * as React from 'react';
import { BarChart3, ChevronRight, ListTodo, ShieldAlert, Sparkles, Upload } from 'lucide-react';

import ApplicantImportUploadQueue from '@/components/applicants/ApplicantImportUploadQueue';
import ProcessQueueAnalytics from '@/components/applicants/ProcessQueueAnalytics';
import BulkUploadCVsModal from '@/components/BulkUploadCVsModal';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { cn } from '@/lib/utils';
import ScreeningReviewQueue from '@/components/screening/ScreeningReviewQueue';

type QueueTab = 'queue' | 'analytics' | 'screening';

export default function ProcessQueuePage() {
  const [activeTab, setActiveTab] = React.useState<QueueTab>('queue');
  const [showUploadWorkspace, setShowUploadWorkspace] = React.useState(false);

  return (
    <div className="min-h-full bg-[linear-gradient(145deg,hsl(var(--muted)/.42),transparent_34rem)]">
      <header className="border-b border-border/70 bg-background/95 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] pb-6">
          <div className="mb-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>Hiring</span>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span>AI operations</span>
            {showUploadWorkspace ? (
              <>
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span className="text-foreground">Add resumes</span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                  {showUploadWorkspace ? 'Add resumes' : 'AI processing queue'}
                </h1>
                {!showUploadWorkspace ? (
                  <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                {showUploadWorkspace
                  ? 'Upload and assign resumes in one workspace. Processing starts after you confirm the batch.'
                  : 'Follow every resume from upload to a ready-to-review candidate profile.'}
              </p>
            </div>
            {activeTab === 'queue' && !showUploadWorkspace ? (
              <Button className="h-10 rounded-xl px-4 shadow-sm" onClick={() => setShowUploadWorkspace(true)}>
                <Upload className="mr-2 h-4 w-4" /> Add resumes
              </Button>
            ) : null}
          </div>
        </div>

        {!showUploadWorkspace ? (
          <nav className="mx-auto flex max-w-[1600px] gap-7 overflow-x-auto" aria-label="AI processing queue views">
            <QueueTabButton
              active={activeTab === 'queue'}
              icon={ListTodo}
              label="Processing"
              onClick={() => setActiveTab('queue')}
            />
            <QueueTabButton
              active={activeTab === 'analytics'}
              icon={BarChart3}
              label="Analytics"
              onClick={() => setActiveTab('analytics')}
            />
            <QueueTabButton
              active={activeTab === 'screening'}
              icon={ShieldAlert}
              label="Screening review"
              onClick={() => setActiveTab('screening')}
            />
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {showUploadWorkspace ? (
          <BulkUploadCVsModal
            isOpen
            presentation="page"
            onOpenChange={setShowUploadWorkspace}
            onUploadSuccess={() => setShowUploadWorkspace(false)}
          />
        ) : activeTab === 'queue' ? (
          <ApplicantImportUploadQueue />
        ) : activeTab === 'screening' ? (
          <ScreeningReviewQueue />
        ) : (
          <ErrorBoundary>
            <ProcessQueueAnalytics />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

function QueueTabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-12 shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground',
      )}
    >
      {active && label === 'Processing' ? <Sparkles className="h-4 w-4" /> : <Icon className="h-4 w-4" />} {label}
    </button>
  );
}
