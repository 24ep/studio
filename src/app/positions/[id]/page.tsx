
// src/app/positions/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Position, Candidate } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, Building, CalendarDays, CheckCircle2, Info, ListFilter, Loader2, ServerCrash, ShieldAlert, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { CandidateTable } from '@/components/candidates/CandidateTable'; // Assuming CandidateTable can be reused or adapted

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const positionId = params.id as string;

  const [position, setPosition] = useState<Position | null>(null);
  const [associatedCandidates, setAssociatedCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();

  const fetchPositionAndCandidates = useCallback(async () => {
    if (!positionId || sessionStatus !== 'authenticated') return;
    setIsLoading(true);
    setFetchError(null);
    setAuthError(false);

    try {
      // Fetch position details
      const positionRes = await fetch(`/api/positions/${positionId}`);
      if (!positionRes.ok) {
        const errorData = await positionRes.json().catch(() => ({}));
        const errorMessage = errorData.message || `Failed to fetch position: ${positionRes.statusText || `Status ${positionRes.status}`}`;
        if (positionRes.status === 401) {
          setAuthError(true);
          signIn(undefined, { callbackUrl: `/positions/${positionId}` });
          return;
        }
        throw new Error(errorMessage);
      }
      const positionData: Position = await positionRes.json();
      setPosition(positionData);

      // Fetch candidates for this position
      const candidatesRes = await fetch(`/api/candidates?positionId=${positionId}`);
      if (!candidatesRes.ok) {
        // Non-critical error for candidates, position data might still be useful
        console.error(`Failed to fetch candidates for position ${positionId}: ${candidatesRes.statusText}`);
        setAssociatedCandidates([]); // Set to empty if fetch fails
      } else {
        const candidatesData: Candidate[] = await candidatesRes.json();
        // Sort candidates by fitScore descending
        const sortedCandidates = candidatesData.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
        setAssociatedCandidates(sortedCandidates);
      }

    } catch (error) {
      console.error("Error fetching position details or candidates:", error);
      setFetchError((error as Error).message || "Could not load data.");
      setPosition(null);
      setAssociatedCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [positionId, sessionStatus, toast]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: `/positions/${positionId}` });
      return;
    }
    if (positionId) {
      fetchPositionAndCandidates();
    }
  }, [positionId, sessionStatus, fetchPositionAndCandidates, signIn]);

  // Dummy handlers as CandidateTable might expect them, though not primary actions on this page
  const handleUpdateCandidateStatus = async (candidateId: string, status: Candidate['status']) => {
    toast({ title: "Action Not Available", description: "Candidate status updates should be done from the main Candidates page or Candidate Detail page.", variant: "default" });
  };
  const handleDeleteCandidate = async (candidateId: string) => {
     toast({ title: "Action Not Available", description: "Candidate deletion should be done from the main Candidates page.", variant: "default" });
  };
  const handleOpenUploadModal = (candidate: Candidate) => {
    toast({ title: "Action Not Available", description: "Resume uploads should be done from the main Candidates page or Candidate Detail page.", variant: "default" });
  };
   const refreshCandidateInList = async (candidateId: string) => {
    // Re-fetch all candidates for simplicity, or implement specific logic
    await fetchPositionAndCandidates();
  };


  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-6">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You need to be signed in to view position details.</p>
        <Button onClick={() => signIn(undefined, { callbackUrl: `/positions/${positionId}` })}>Sign In</Button>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-6">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Position</h2>
        <p className="text-muted-foreground mb-6">{fetchError}</p>
        <Button onClick={fetchPositionAndCandidates}>Try Again</Button>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center p-6">
        <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Position Not Found</h2>
        <p className="text-muted-foreground">The requested position could not be found.</p>
        <Button onClick={() => router.push('/positions')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Positions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/positions')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Positions
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl flex items-center">
                <Briefcase className="mr-3 h-8 w-8 text-primary" />
                {position.title}
              </CardTitle>
              <CardDescription className="mt-1 ml-11">
                {position.department} {position.position_level && ` - ${position.position_level}`}
              </CardDescription>
            </div>
            <Badge variant={position.isOpen ? "default" : "destructive"} className={position.isOpen ? "bg-green-500 text-primary-foreground" : ""}>
              {position.isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {position.description && (
            <div className="text-sm text-muted-foreground">
              <Info className="inline-block mr-2 h-4 w-4 relative -top-px" />
              {position.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground space-x-4">
            <span>
              <CalendarDays className="inline-block mr-1 h-3.5 w-3.5" />
              Created: {position.createdAt ? format(parseISO(position.createdAt), "PPP") : 'N/A'}
            </span>
            <span>
              Last Updated: {position.updatedAt ? format(parseISO(position.updatedAt), "PPP") : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Candidates for this Position ({associatedCandidates.length})
          </CardTitle>
          <CardDescription>
            List of candidates associated with "{position.title}", sorted by Fit Score (descending).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {associatedCandidates.length > 0 ? (
            <CandidateTable
              candidates={associatedCandidates}
              onUpdateCandidate={handleUpdateCandidateStatus}
              onDeleteCandidate={handleDeleteCandidate}
              onOpenUploadModal={handleOpenUploadModal}
              isLoading={isLoading && associatedCandidates.length === 0} // Only show table loading if candidates are expected but not yet loaded
              onRefreshCandidateData={refreshCandidateInList}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-2" />
              No candidates currently associated with this position.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
