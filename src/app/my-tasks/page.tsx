
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { Candidate, UserProfile, CandidateStatus } from '@/lib/types';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateKanbanView } from '@/components/candidates/CandidateKanbanView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, ShieldAlert, ListTodo, Users, Filter, LayoutGrid, List } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ALL_CANDIDATES_ADMIN_VALUE = "ALL_CANDIDATES_ADMIN";
const MY_ASSIGNED_VALUE = "me";

const KANBAN_STATUS_ORDER: CandidateStatus[] = [
  'Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'
];

export default function MyTasksPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [recruiters, setRecruiters] = useState<Pick<UserProfile, 'id' | 'name'>[]>([]);
  const [selectedRecruiterFilter, setSelectedRecruiterFilter] = useState<string>(MY_ASSIGNED_VALUE);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');

  const fetchRecruitersForAdmin = useCallback(async () => {
    if (session?.user?.role !== 'Admin') return;
    try {
      const response = await fetch('/api/users?role=Recruiter');
      if (!response.ok) throw new Error('Failed to fetch recruiters');
      const data: UserProfile[] = await response.json();
      setRecruiters(data);
    } catch (error) {
      console.error("Error fetching recruiters:", error);
      toast({ title: "Error", description: "Could not load recruiters list.", variant: "destructive" });
    }
  }, [session, toast]);

  const fetchTaskBoardCandidates = useCallback(async (filterRecruiterId: string) => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const userRole = session.user.role;
    if (userRole !== 'Recruiter' && userRole !== 'Admin') {
        setFetchError("You do not have permission to view this page.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setFetchError(null);
    let recruiterQueryParam = '';

    if (userRole === 'Admin') {
      if (filterRecruiterId === ALL_CANDIDATES_ADMIN_VALUE) {
        recruiterQueryParam = 'assignedRecruiterId=ALL_CANDIDATES_ADMIN';
      } else if (filterRecruiterId === MY_ASSIGNED_VALUE) {
        recruiterQueryParam = `assignedRecruiterId=me`;
      } else {
        recruiterQueryParam = `assignedRecruiterId=${filterRecruiterId}`;
      }
    } else {
      recruiterQueryParam = `assignedRecruiterId=me`;
    }
    
    try {
      const response = await fetch(`/api/candidates?${recruiterQueryParam}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        if (response.status === 401 || response.status === 403) {
          signIn(undefined, { callbackUrl: pathname });
          return;
        }
        setFetchError(errorData.message || 'Failed to fetch assigned candidates');
        setCandidates([]);
        return;
      }
      const data: Candidate[] = await response.json();
      setCandidates(data);
    } catch (error) {
      const errorMessage = (error as Error).message || "Could not load assigned candidates.";
      if (!(errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("forbidden"))) {
        setFetchError(errorMessage);
      }
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session, pathname, signIn]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role === 'Admin') {
        fetchRecruitersForAdmin();
         fetchTaskBoardCandidates(selectedRecruiterFilter);
      } else {
        fetchTaskBoardCandidates(MY_ASSIGNED_VALUE);
      }
    }
  }, [sessionStatus, session, fetchTaskBoardCandidates, fetchRecruitersForAdmin, pathname, signIn, selectedRecruiterFilter]);
  
  const handleRecruiterFilterChange = (newFilter: string) => {
    setSelectedRecruiterFilter(newFilter);
  };

  const handleUpdateCandidateOnTaskBoard = async (candidateId: string, status: Candidate['status']) => {
    toast({ title: "Action Recommendation", description: "To update status, please go to the main Candidates page or Candidate Detail page."});
    refreshCurrentView();
  };

  const handleDeleteCandidateOnTaskBoard = async (candidateId: string) => {
    toast({ title: "Action Not Available", description: "To delete candidates, please use the main Candidates page."});
  };
  
  const handleOpenUploadModalOnTaskBoard = (candidate: Candidate) => {
     toast({ title: "Action Not Available", description: "To upload resumes, please use the main Candidates page or Candidate Detail page."});
  };

  const refreshCurrentView = () => {
    if (session?.user?.role === 'Admin') {
      fetchTaskBoardCandidates(selectedRecruiterFilter);
    } else {
      fetchTaskBoardCandidates(MY_ASSIGNED_VALUE);
    }
  }

  const filteredCandidates = statusFilter === 'all' 
    ? candidates 
    : candidates.filter(c => c.status === statusFilter);

  if (sessionStatus === 'loading' || (isLoading && !fetchError && !pathname.startsWith('/auth/signin'))) {
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
        <Button onClick={refreshCurrentView} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  const pageTitle = session?.user?.role === 'Admin' 
    ? (selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "All Candidates Overview" : 
       selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "My Assigned Candidates (Admin)" :
       `Candidates for ${recruiters.find(r => r.id === selectedRecruiterFilter)?.name || 'Recruiter'}`)
    : "My Task Board";
  const pageDescription = session?.user?.role === 'Admin' 
    ? (selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "Overview of all candidates in the system." : 
       selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "Candidates assigned to you (Admin)." :
       `Candidates assigned to ${recruiters.find(r => r.id === selectedRecruiterFilter)?.name || 'the selected recruiter'}.`)
    : "Candidates assigned to you for processing.";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center">
                <ListTodo className="mr-2 h-6 w-6 text-primary" /> {pageTitle}
              </CardTitle>
              <CardDescription>{pageDescription}</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
              {session?.user?.role === 'Admin' && (
                <div className="w-full sm:w-auto">
                  <Label htmlFor="recruiter-filter-select" className="text-xs font-medium text-muted-foreground">View tasks for:</Label>
                  <Select value={selectedRecruiterFilter} onValueChange={handleRecruiterFilterChange}>
                    <SelectTrigger id="recruiter-filter-select" className="w-full sm:w-[280px] mt-1">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CANDIDATES_ADMIN_VALUE}>All Candidates (Admin Overview)</SelectItem>
                      <SelectItem value={MY_ASSIGNED_VALUE}>My Assigned Candidates (Admin)</SelectItem>
                      {recruiters.map(recruiter => (
                        <SelectItem key={recruiter.id} value={recruiter.id}>
                          {recruiter.name}'s Candidates
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="w-full sm:w-auto">
                 <Label htmlFor="status-filter-select" className="text-xs font-medium text-muted-foreground">Filter by Status:</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CandidateStatus | 'all')}>
                  <SelectTrigger id="status-filter-select" className="w-full sm:w-[200px] mt-1">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {KANBAN_STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1 mt-4 sm:mt-0 self-end sm:self-center">
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('kanban')}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : filteredCandidates.length === 0 ? (
             <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No candidates match the current filters.</p>
            </div>
          ) : viewMode === 'list' ? (
            <CandidateTable
              candidates={filteredCandidates}
              onUpdateCandidate={handleUpdateCandidateOnTaskBoard}
              onDeleteCandidate={handleDeleteCandidateOnTaskBoard}
              onOpenUploadModal={handleOpenUploadModalOnTaskBoard}
              isLoading={isLoading}
              onRefreshCandidateData={refreshCurrentView} 
            />
          ) : (
            <CandidateKanbanView candidates={filteredCandidates} statuses={KANBAN_STATUS_ORDER} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
