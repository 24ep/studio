
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { Candidate, UserProfile, CandidateStatus, Position, RecruitmentStage } from '@/lib/types';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateKanbanView } from '@/components/candidates/CandidateKanbanView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, ShieldAlert, ListTodo, Users, Filter, LayoutGrid, List, Search, FilterX } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';


const ALL_CANDIDATES_ADMIN_VALUE = "ALL_CANDIDATES_ADMIN";
const MY_ASSIGNED_VALUE = "me";
const ALL_POSITIONS_SELECT_VALUE = "__ALL_POSITIONS__"; 

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
  const [allRecruiters, setAllRecruiters] = useState<Pick<UserProfile, 'id' | 'name'>[]>([]); // Changed name for clarity
  const [selectedRecruiterFilter, setSelectedRecruiterFilter] = useState<string>(MY_ASSIGNED_VALUE);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  
  const [standardFilters, setStandardFilters] = useState<CandidateFilterValues>({
    minFitScore: 0, maxFitScore: 100, status: 'all', positionId: ALL_POSITIONS_SELECT_VALUE
  });
  const [aiSearchQuery, setAiSearchQuery] = useState<string>('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchReasoning, setAiSearchReasoning] = useState<string | null>(null);
  const [aiMatchedCandidateIds, setAiMatchedCandidateIds] = useState<string[] | null>(null);


  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>([]);

  const fetchInitialFilterData = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    try {
      const [posRes, stagesRes, recRes] = await Promise.all([
        fetch('/api/positions'),
        fetch('/api/settings/recruitment-stages'),
        session?.user?.role === 'Admin' ? fetch('/api/users?role=Recruiter') : Promise.resolve(null) 
      ]);
      if (posRes.ok) setAvailablePositions(await posRes.json());
      else console.error("Failed to fetch positions for filters");
      if (stagesRes.ok) setAvailableStages(await stagesRes.json());
      else console.error("Failed to fetch stages for filters");
      if (recRes && recRes.ok) setAllRecruiters(await recRes.json());
      else if (recRes) console.error("Failed to fetch recruiters for filters");
    } catch (error) {
      console.error("Error fetching initial data for filters:", error);
    }
  }, [sessionStatus, session?.user?.role]);


  const fetchTaskBoardCandidates = useCallback(async () => {
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
    setAiMatchedCandidateIds(null);
    
    const queryParams = new URLSearchParams();
    // Determine base recruiter filter for task board
    let effectiveRecruiterId = '';
    if (userRole === 'Admin') {
      if (selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE) {
        // No specific recruiterId, means ALL
      } else {
        effectiveRecruiterId = selectedRecruiterFilter === MY_ASSIGNED_VALUE ? session.user.id : selectedRecruiterFilter;
      }
    } else { // Recruiter
      effectiveRecruiterId = session.user.id;
    }
    if (effectiveRecruiterId) {
        queryParams.append('assignedRecruiterId', effectiveRecruiterId);
    }

    // Apply standard filters
    if (standardFilters.name) queryParams.append('name', standardFilters.name);
    if (standardFilters.positionId && standardFilters.positionId !== ALL_POSITIONS_SELECT_VALUE) queryParams.append('positionId', standardFilters.positionId);
    if (standardFilters.status !== 'all' && standardFilters.status) queryParams.append('status', standardFilters.status);
    if (standardFilters.education) queryParams.append('education', standardFilters.education);
    if (standardFilters.minFitScore !== undefined) queryParams.append('minFitScore', String(standardFilters.minFitScore));
    if (standardFilters.maxFitScore !== undefined) queryParams.append('maxFitScore', String(standardFilters.maxFitScore));
    // Date filters can be added if CandidateFilters supports them for this view
    
    try {
      const response = await fetch(`/api/candidates?${queryParams.toString()}`);
      
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
  }, [sessionStatus, session, pathname, signIn, selectedRecruiterFilter, standardFilters]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      fetchInitialFilterData();
      fetchTaskBoardCandidates();
    }
  }, [sessionStatus, session, fetchTaskBoardCandidates, fetchInitialFilterData, pathname, signIn]);
  
  const handleRecruiterFilterChange = (newFilter: string) => {
    setSelectedRecruiterFilter(newFilter);
  };
  
  const handleStandardFilterChange = (newFilters: CandidateFilterValues) => {
    setStandardFilters(newFilters);
    setAiSearchQuery(''); // Clear AI query when standard filters change
    setAiMatchedCandidateIds(null);
    setAiSearchReasoning(null);
    // fetchTaskBoardCandidates will be called due to standardFilters dependency change
  };

  const handleAiSearch = async (query: string) => {
    if (!query.trim()) {
      toast({ title: "Empty AI Query", description: "Please enter a search term.", variant: "default" });
      return;
    }
    setIsAiSearching(true);
    setFetchError(null);
    setAiSearchReasoning(null);
    setAiMatchedCandidateIds(null);

    try {
      const response = await fetch('/api/ai/search-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `AI search failed. Status: ${response.status}`);
      
      setAiMatchedCandidateIds(result.matchedCandidateIds || []);
      setAiSearchReasoning(result.aiReasoning || "AI search complete.");
      toast({ title: "AI Search Complete", description: result.aiReasoning || "AI processing finished."});

    } catch (error) {
      toast({ title: "AI Search Error", description: (error as Error).message, variant: "destructive" });
      setAiMatchedCandidateIds([]); // Show no candidates on error
    } finally {
      setIsAiSearching(false);
    }
  };

  const displayedCandidates = useMemo(() => {
    return aiMatchedCandidateIds !== null
      ? candidates.filter(c => aiMatchedCandidateIds.includes(c.id))
      : candidates;
  }, [candidates, aiMatchedCandidateIds]);


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
        <Button onClick={fetchTaskBoardCandidates} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  const pageTitle = session?.user?.role === 'Admin' 
    ? (selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "All Candidates Overview" : 
       selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "My Assigned Candidates (Admin)" :
       `Candidates for ${allRecruiters.find(r => r.id === selectedRecruiterFilter)?.name || 'Recruiter'}`)
    : "My Task Board";
  const pageDescription = session?.user?.role === 'Admin' 
    ? (selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "Overview of all candidates in the system." : 
       selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "Candidates assigned to you (Admin)." :
       `Candidates assigned to ${allRecruiters.find(r => r.id === selectedRecruiterFilter)?.name || 'the selected recruiter'}.`)
    : "Candidates assigned to you for processing.";

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
        <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 md:sticky md:top-0 md:h-screen">
           <ScrollArea className="h-full md:max-h-[calc(100vh-var(--header-height,4rem)-2rem)] md:pr-2">
                <div className="md:hidden mb-3"> {/* Recruiter filter for mobile, if admin */}
                    {session?.user?.role === 'Admin' && (
                        <div className="w-full">
                            <Label htmlFor="recruiter-filter-select-mobile" className="text-xs font-medium">View tasks for:</Label>
                            {/* Re-using logic from CandidateFilters for Recruiter selection or simplify to basic select */}
                            <Input value="Recruiter filter placeholder for mobile" readOnly className="mt-1"/>
                        </div>
                    )}
                </div>
                 <CandidateFilters
                    initialFilters={standardFilters}
                    onFilterChange={handleStandardFilterChange}
                    onAiSearch={handleAiSearch}
                    availablePositions={availablePositions}
                    availableStages={availableStages}
                    availableRecruiters={allRecruiters}
                    isLoading={isLoading || isAiSearching}
                    isAiSearching={isAiSearching}
                />
            </ScrollArea>
        </aside>

        <div className="flex-1 space-y-6 min-w-0">
            <Card>
                <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                    <CardTitle className="flex items-center">
                        <ListTodo className="mr-2 h-6 w-6 text-primary" /> {pageTitle}
                    </CardTitle>
                    <CardDescription>{pageDescription}</CardDescription>
                    </div>
                    <div className="flex gap-1 self-end sm:self-center">
                        <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('kanban')}><LayoutGrid className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                {/* Admin-specific recruiter filter for desktop */}
                {session?.user?.role === 'Admin' && (
                    <div className="mb-4 w-full md:max-w-xs">
                        <Label htmlFor="recruiter-filter-select-desktop" className="text-xs font-medium">View tasks for:</Label>
                        {/* This should use the searchable Popover pattern if many recruiters exist */}
                        <Input value="Recruiter filter placeholder for desktop" readOnly className="mt-1"/>
                    </div>
                )}

                {isLoading || isAiSearching ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                ) : displayedCandidates.length === 0 ? (
                    <div className="text-center py-10"><Users className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No candidates match the current filters.</p></div>
                ) : viewMode === 'list' ? (
                    <CandidateTable
                    candidates={displayedCandidates}
                    availablePositions={availablePositions}
                    availableStages={availableStages}
                    onUpdateCandidate={async (id, newStatus) => { /* Limited action from task board */ }}
                    onDeleteCandidate={async (id) => { /* Limited action */ }}
                    onOpenUploadModal={() => { /* Limited action */ }}
                    onEditPosition={() => { /* Limited action */ }}
                    isLoading={false} // Main page isLoading handles this
                    onRefreshCandidateData={async (id) => fetchTaskBoardCandidates()}
                    selectedCandidateIds={new Set()} // Bulk actions not primary on task board
                    onToggleSelectCandidate={() => {}}
                    onToggleSelectAllCandidates={() => {}}
                    isAllCandidatesSelected={false}
                    />
                ) : (
                    <CandidateKanbanView candidates={displayedCandidates} statuses={KANBAN_STATUS_ORDER} />
                )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
