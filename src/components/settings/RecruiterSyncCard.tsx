import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonNumber,
  getJsonObject,
  getJsonString,
  isJsonObject,
  readJsonObject,
} from '../../lib/response-json';

interface RecruiterSyncResult {
  positionId: string;
  positionTitle: string;
  applicantsUpdated: number;
  applicantsSkipped: number;
  errors: string[];
}

interface SyncSummary {
  totalPositions: number;
  totalApplicantsUpdated: number;
  totalApplicantsSkipped: number;
  totalErrors: number;
  results: RecruiterSyncResult[];
}

function normalizeRecruiterSyncSummary(value: unknown): SyncSummary | null {
  if (!isJsonObject(value)) {
    return null;
  }

  return {
    totalPositions: getJsonNumber(value, 'totalPositions') ?? 0,
    totalApplicantsUpdated: getJsonNumber(value, 'totalApplicantsUpdated') ?? 0,
    totalApplicantsSkipped: getJsonNumber(value, 'totalApplicantsSkipped') ?? 0,
    totalErrors: getJsonNumber(value, 'totalErrors') ?? 0,
    results: (getJsonArray(value, 'results') ?? []).flatMap((result) => {
      if (!isJsonObject(result)) return [];

      const positionId = getJsonString(result, 'positionId');
      const positionTitle = getJsonString(result, 'positionTitle');
      if (!positionId || !positionTitle) return [];

      return [{
        positionId,
        positionTitle,
        applicantsUpdated: getJsonNumber(result, 'applicantsUpdated') ?? 0,
        applicantsSkipped: getJsonNumber(result, 'applicantsSkipped') ?? 0,
        errors: (getJsonArray(result, 'errors') ?? []).filter((error): error is string => typeof error === 'string'),
      }];
    }),
  };
}

export function RecruiterSyncCard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncSummary | null>(null);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/settings/recruiter-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAll: true }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(await readJsonObject(response), 'Failed to sync recruiters'));
      }

      const data = await readJsonObject(response);
      setLastSyncResult(normalizeRecruiterSyncSummary(getJsonObject(data, 'summary')));
      toast.success('Recruiter sync completed successfully');
    } catch (error) {
      console.error('Recruiter sync error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync recruiters');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Recruiter Assignment Sync
        </CardTitle>
                 <CardDescription>
           Automatically assign recruiters to Applicants who don't have one, using the recruiter from their applied position.
           Existing recruiter assignments are preserved and will not be changed.
         </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Bulk Sync</p>
                         <p className="text-xs text-muted-foreground">
               Assign recruiters to Applicants who don't have one, using their position's recruiter
             </p>
          </div>
          <Button 
            onClick={handleSyncAll} 
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>

        {lastSyncResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Last sync completed successfully</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {lastSyncResult.totalPositions} positions
                  </Badge>
                  <Badge variant="default">
                    {lastSyncResult.totalApplicantsUpdated} applicants updated
                  </Badge>
                  <Badge variant="outline">
                    {lastSyncResult.totalApplicantsSkipped} applicants skipped
                  </Badge>
                  {lastSyncResult.totalErrors > 0 && (
                    <Badge variant="destructive">
                      {lastSyncResult.totalErrors} errors
                    </Badge>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="font-medium text-sm mb-2">How it works:</h4>
                     <ul className="text-xs text-muted-foreground space-y-1">
             <li>- Only Applicants without a recruiter will be assigned one from their position</li>
             <li>- Existing recruiter assignments are preserved and will not be changed</li>
             <li>- When a Applicant is assigned to a position, they get the position's recruiter if they don't have one</li>
             <li>- All assignments are logged in the Applicant's transition history</li>
           </ul>
        </div>

        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                         <div className="text-xs text-blue-800">
               <p className="font-medium mb-1">Automatic Assignment</p>
               <p>
                 Recruiter are automatically assigned to Applicants without one when they are assigned to a position. 
                 This manual sync is only needed for bulk operations or to fix inconsistencies.
               </p>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
