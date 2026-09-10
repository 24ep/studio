import { CheckCircle, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { AutoCloseSummary } from './AutoCloseTabTypes';

import { AutoCloseSectionHeader } from './AutoCloseSectionHeader';

export function AutoCloseManualSection({
  isRunning,
  lastRun,
  onRunAutoClose,
}: {
  isRunning: boolean;
  lastRun: Date | null;
  onRunAutoClose: () => void;
}) {
  return (
    <AccordionItem value="manual" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <AutoCloseSectionHeader
          icon={<RefreshCw className="h-5 w-5 text-primary" />}
          title="Manual Auto-Close Check"
          description="Run a manual check to close all positions that have all headcounts filled."
        />
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        <div className="flex items-center gap-4">
          <Button
            onClick={onRunAutoClose}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Run Auto-Close Check
              </>
            )}
          </Button>
          {lastRun && (
            <span className="text-sm text-muted-foreground">
              Last run: {lastRun.toLocaleString()}
            </span>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function AutoCloseSummarySection({ summary }: { summary: AutoCloseSummary }) {
  return (
    <AccordionItem value="summary" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <AutoCloseSectionHeader
          icon={<CheckCircle className="h-5 w-5 text-primary" />}
          title="Results Summary"
        />
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AutoCloseSummaryMetric label="Total Processed" value={summary.totalProcessed} className="text-blue-600" />
          <AutoCloseSummaryMetric label="Positions Closed" value={summary.closedCount} className="text-green-600" />
          <AutoCloseSummaryMetric label="No Action Needed" value={summary.noActionCount} className="text-muted-foreground" />
          <AutoCloseSummaryMetric label="Errors" value={summary.errorCount} className="text-red-600" />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AutoCloseSummaryMetric({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
