import { FileText } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { AutoCloseResult } from './AutoCloseTabTypes';
import {
  getAutoCloseActionBadge,
  getAutoCloseActionIcon,
} from './AutoCloseTabUtils';

import { AutoCloseSectionHeader } from './AutoCloseSectionHeader';

export function AutoCloseResultsSection({ results }: { results: AutoCloseResult[] }) {
  return (
    <AccordionItem value="results" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <AutoCloseSectionHeader
          icon={<FileText className="h-5 w-5 text-primary" />}
          title="Detailed Results"
          description="Detailed breakdown of each position processed"
        />
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        <div className="space-y-4">
          {results.map((result) => (
            <AutoCloseResultItem key={result.positionId} result={result} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AutoCloseResultItem({ result }: { result: AutoCloseResult }) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className="flex-shrink-0 mt-1">
        {getAutoCloseActionIcon(result.action)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium text-sm">{result.positionTitle}</h4>
          {getAutoCloseActionBadge(result.action)}
        </div>
        <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
        {result.headcountStatus && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Total: {result.headcountStatus.totalHeadcounts}</span>
            <span>Filled: {result.headcountStatus.filledHeadcounts}</span>
            <span>Vacant: {result.headcountStatus.vacantHeadcounts}</span>
          </div>
        )}
      </div>
    </div>
  );
}
