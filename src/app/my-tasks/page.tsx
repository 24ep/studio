
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { Candidate } from '@/lib/types';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, ShieldAlert, ListTodo, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function MyTasksPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [assignedCandidates, setAssignedCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAssignedCandidates = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      return;
    }
    if (session.user.role !== 'Recruiter' && session.user.role !== 'Admin') {
        // Though sidebar link should prevent this, add extra check
        setFetchError("You do not have permission to view this page.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setFetchError(null);
    try {
      // Admins see all, Recruiters see 'me'
      const filterParam = session.user.role === 'Admin' ? '' : 'assignedRecruiterId=me';
      const response = await fetch(`/api/candidates?${filterParam}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        setFetchError(errorData.message || 'Failed to fetch assigned candidates');
        setAssignedCandidates([]);
        return;
      }
      const data: Candidate[] = await response.json();
      setAssignedCandidates(data);
    } catch (error) {
      const errorMessage = (error as Error).message || "Could not load assigned candidates.";
      if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setAssignedCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session, pathname, signIn]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      fetchAssignedCandidates();
    }
  }, [sessionStatus, fetchAssignedCandidates, pathname, signIn]);
  
  // Dummy handlers for CandidateTable props as actions might be limited on this view
  const handleUpdateCandidateOnTaskBoard = async (candidateId: string, status: Candidate['status']) => {
    // For the task board, updating status here might involve more complex logic
    // like moving cards in a Kanban view. For now, refresh.
    toast({ title: "Status Update", description: "To update status, please go to the main Candidates page or Candidate Detail page."});
    fetchAssignedCandidates(); // Refresh the list
  };

  const handleDeleteCandidateOnTaskBoard = async (candidateId: string) => {
    toast({ title: "Action Not Available", description: "To delete candidates, please use the main Candidates page."});
  };
  
  const handleOpenUploadModalOnTaskBoard = (candidate: Candidate) => {
     toast({ title: "Action Not Available", description: "To upload resumes, please use the main Candidates page or Candidate Detail page."});
  };


  if (sessionStatus === 'loading' || (isLoading && !fetchError)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (session?.user?.role !== 'Recruiter' && session?.user?.role !== 'Admin') {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }


  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Tasks</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={fetchAssignedCandidates} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  const pageTitle = session?.user?.role === 'Admin' ? "All Candidates Overview" : "My Assigned Candidates";
  const pageDescription = session?.user?.role === 'Admin' ? "Overview of all candidates in the system." : "Candidates assigned to you for processing.";


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListTodo className="mr-2 h-6 w-6 text-primary" /> {pageTitle}
          </CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedCandidates.length === 0 && !isLoading ? (
             <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {session?.user?.role === 'Admin' ? "No candidates found in the system." : "No candidates are currently assigned to you."}
              </p>
            </div>
          ) : (
            <CandidateTable
              candidates={assignedCandidates}
              onUpdateCandidate={handleUpdateCandidateOnTaskBoard}
              onDeleteCandidate={handleDeleteCandidateOnTaskBoard}
              onOpenUploadModal={handleOpenUploadModalOnTaskBoard}
              isLoading={isLoading}
              onRefreshCandidateData={fetchAssignedCandidates} // Simple refresh for this context
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
