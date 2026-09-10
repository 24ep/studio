"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
} from "@/components/ui/accordion";
import { AlertTriangle } from 'lucide-react';
import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonNumber,
  getJsonObject,
  getJsonString,
  isJsonObject,
  readJsonObject,
} from '../../lib/response-json';
import {
  AutoCloseInfoSection,
  AutoCloseManualSection,
  AutoCloseResultsSection,
  AutoCloseSummarySection,
} from './AutoCloseTabSections';
import type { AutoCloseResult, AutoCloseSummary } from './AutoCloseTabTypes';
import { canAccessAutoCloseTab, getAutoCloseErrorMessage } from './AutoCloseTabUtils';

function normalizeAutoCloseResults(value: unknown): AutoCloseResult[] {
  const results = Array.isArray(value) ? value : [];

  return results.flatMap((result) => {
    if (!isJsonObject(result)) return [];

    const positionId = getJsonString(result, 'positionId');
    const positionTitle = getJsonString(result, 'positionTitle');
    const message = getJsonString(result, 'message');
    const action = getJsonString(result, 'action');
    if (!positionId || !positionTitle || !message || (action !== 'closed' && action !== 'none' && action !== 'error')) {
      return [];
    }

    const headcountStatus = getJsonObject(result, 'headcountStatus');
    return [{
      positionId,
      positionTitle,
      success: result.success === true,
      message,
      action,
      headcountStatus: headcountStatus
        ? {
            totalHeadcounts: getJsonNumber(headcountStatus, 'totalHeadcounts') ?? 0,
            filledHeadcounts: getJsonNumber(headcountStatus, 'filledHeadcounts') ?? 0,
            vacantHeadcounts: getJsonNumber(headcountStatus, 'vacantHeadcounts') ?? 0,
          }
        : undefined,
    }];
  });
}

function normalizeAutoCloseSummary(value: unknown): AutoCloseSummary | null {
  if (!isJsonObject(value)) {
    return null;
  }

  return {
    totalProcessed: getJsonNumber(value, 'totalProcessed') ?? 0,
    closedCount: getJsonNumber(value, 'closedCount') ?? 0,
    errorCount: getJsonNumber(value, 'errorCount') ?? 0,
    noActionCount: getJsonNumber(value, 'noActionCount') ?? 0,
  };
}

export default function AutoCloseTab() {
  const { data: session } = useSession();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AutoCloseResult[]>([]);
  const [summary, setSummary] = useState<AutoCloseSummary | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const handleRunAutoClose = async () => {
    if (!session?.user) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      const response = await fetch('/api/positions/auto-close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await readJsonObject(response);
        console.error('Auto-close API error:', errorData);
        throw new Error(getJsonErrorMessage(errorData, `Failed to run auto-close check: ${response.status}`));
      }

      const data = await readJsonObject(response);
      const nextSummary = normalizeAutoCloseSummary(data.summary);
      const closedCount = nextSummary?.closedCount || 0;
      const totalProcessed = nextSummary?.totalProcessed || 0;

      setResults(normalizeAutoCloseResults(getJsonArray(data, 'results')));
      setSummary(nextSummary);
      setLastRun(new Date());

      toast.success(getAutoCloseSuccessMessage(totalProcessed, closedCount));
    } catch (error) {
      console.error('Error running auto-close:', error);
      toast.error(getAutoCloseErrorMessage(error));
    } finally {
      setIsRunning(false);
    }
  };

  if (!canAccessAutoCloseTab(session?.user)) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need administrator permissions or POSITIONS_EDIT_DETAILED permission to access this feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={['info', 'manual', 'summary', 'results']} className="w-full">
      <AutoCloseInfoSection />
      <AutoCloseManualSection
        isRunning={isRunning}
        lastRun={lastRun}
        onRunAutoClose={handleRunAutoClose}
      />
      {summary && <AutoCloseSummarySection summary={summary} />}
      {results.length > 0 && <AutoCloseResultsSection results={results} />}
    </Accordion>
  );
}

function getAutoCloseSuccessMessage(totalProcessed: number, closedCount: number) {
  if (closedCount > 0) {
    return `Auto-close completed! Processed ${totalProcessed} positions, closed ${closedCount} positions.`;
  }

  return `Auto-close completed! Processed ${totalProcessed} positions. No positions needed to be closed.`;
}
