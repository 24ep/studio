// src/components/tasks/MyTasksPageClient.tsx
"use client";

import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { Candidate, UserProfile, CandidateStatus, Position, RecruitmentStage } from '@/lib/types';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateKanbanView } from '@/components/candidates/CandidateKanbanView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, ShieldAlert, ListTodo, Users, Filter, LayoutGrid, List, Search, FilterX, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "react-hot-toast";

const ALL_CANDIDATES_ADMIN_VALUE = "ALL_CANDIDATES_ADMIN";
const MY_ASSIGNED_VALUE = "me";


interface MyTasksPageClientProps {
  initialCandidates: Candidate[];
  initialPositions: Position[];
  initialStages: RecruitmentStage[];
  initialRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  authError?: boolean;
  permissionError?: boolean;
  initialFetchError?: string;
}

export function MyTasksPageClient({
  initialCandidates,
  initialPositions,
  initialStages,
  initialRecruiters,
  authError: serverAuthError = false,
  permissionError: serverPermissionError = false,
  initialFetchError,
}: MyTasksPageClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates || []);
  const [allRecruitersForFilter, setAllRecruitersForFilter] = useState<Pick<UserProfile, 'id' | 'name'>[]>(initialRecruiters || []);
  const [selectedRecruiterFilter, setSelectedRecruiterFilter] = useState<string>(MY_ASSIGNED_VALUE); // Default to "My Assigned"
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  const [standardFilters, setStandardFilters] = useState<CandidateFilterValues>({
    minFitScore: 0, maxFitScore: 100, selectedStatuses: [], selectedPositionIds: []
  });
  const [aiSearchQuery, setAiSearchQuery] = useState<string>('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchReasoning, setAiSearchReasoning] = useState<string | null>(null);
  const [aiMatchedCandidateIds, setAiMatchedCandidateIds] = useState<string[] | null>(null);

  const [availablePositions, setAvailablePositions] = useState<Position[]>(initialPositions || []);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>(initialStages || []);
  
  const [isLoading, setIsLoading] = useState(initialCandidates.length === 0 && !initialFetchError);
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError || null);
  const [authError, setAuthError] = useState(serverAuthError);
  const [permissionError, setPermissionError] = useState(serverPermissionError);

  const [showFilters, setShowFilters] = useState(true);

  const fetchRecruitersForAdminFilter = useCallback(async () => {
    if (session?.user?.role === 'Admin' && allRecruitersForFilter.length <= 1) { // Only fetch if not already populated or just has self
      try {
        const response = await fetch('/api/users?role=Recruiter');
        if (!response.ok) throw new Error('Failed to fetch recruiters for admin filter');
        const data: UserProfile[] = await response.json();
        setAllRecruitersForFilter(data.map(r => ({ id: r.id, name: r.name })));
      } catch (error) {
        console.error("Error fetching recruiters for admin filter:", error);
        // Do not toast here as it might be redundant if initialRecruiters prop was fine
      }
    }
  }, [session?.user?.role, allRecruitersForFilter.length]);


  const fetchTaskBoardCandidates = useCallback(async (filtersToApply: CandidateFilterValues, currentRecruiterFilter: string) => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    setAiMatchedCandidateIds(null); // Clear AI results when standard filters change
    
    const queryParams = new URLSearchParams();
    let effectiveRecruiterIdForParam = '';

    if (session.user.role === 'Admin') {
      if (currentRecruiterFilter !== ALL_CANDIDATES_ADMIN_VALUE) { // If "All Candidates" is not selected
        effectiveRecruiterIdForParam = currentRecruiterFilter === MY_ASSIGNED_VALUE ? session.user.id : currentRecruiterFilter;
      }
      // If ALL_CANDIDATES_ADMIN_VALUE, don't append assignedRecruiterId, fetching all.
    } else { // Recruiter
      effectiveRecruiterIdForParam = session.user.id;
    }

    if (effectiveRecruiterIdForParam) {
        queryParams.append('assignedRecruiterId', effectiveRecruiterIdForParam); 
    }

    if (filtersToApply.name) queryParams.append('name', filtersToApply.name);
    if (filtersToApply.selectedPositionIds && filtersToApply.selectedPositionIds.length > 0) queryParams.append('positionId', filtersToApply.selectedPositionIds.join(','));
    if (filtersToApply.selectedStatuses && filtersToApply.selectedStatuses.length > 0) queryParams.append('status', filtersToApply.selectedStatuses.join(','));
    if (filtersToApply.education) queryParams.append('education', filtersToApply.education);
    if (filtersToApply.minFitScore !== undefined) queryParams.append('minFitScore', String(filtersToApply.minFitScore));
    if (filtersToApply.maxFitScore !== undefined) queryParams.append('maxFitScore', String(filtersToApply.maxFitScore));
    if (filtersToApply.applicationDateStart) queryParams.append('applicationDateStart', filtersToApply.applicationDateStart.toISOString());
    if (filtersToApply.applicationDateEnd) queryParams.append('applicationDateEnd', filtersToApply.applicationDateEnd.toISOString());
    
    try {
      const response = await fetch(`/api/candidates?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText || `Status: ${response.status}` }));
        if (response.status === 401) { signIn(undefined, { callbackUrl: pathname }); return; }
        if (response.status === 403) { setPermissionError(true); setFetchError(errorData.message || 'Forbidden'); setCandidates([]); return; }
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
  }, [sessionStatus, session, pathname]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated' && !serverAuthError && !serverPermissionError) {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      fetchRecruitersForAdminFilter(); // Fetch full recruiter list if Admin
      // Initial data is passed via props, so only fetch on filter changes handled by other effects/handlers.
      // If initialCandidates is empty and there's no error, it means the server fetched an empty list for the user.
       if (initialFetchError) setFetchError(initialFetchError);
       if (serverAuthError) setAuthError(true);
       if (serverPermissionError) setPermissionError(true);
       if (initialCandidates.length > 0 || initialFetchError) {
         setIsLoading(false); // Stop loading if we got data or an error
       } else {
         // If no initial data and no error, we should still stop loading after a reasonable time
         const timeout = setTimeout(() => {
           setIsLoading(false);
         }, 5000); // 5 second timeout
         
         return () => clearTimeout(timeout);
       }
    }
  }, [sessionStatus, serverAuthError, serverPermissionError, initialFetchError, initialCandidates.length, pathname]);
  
  const handleRecruiterFilterChange = (newFilter: string) => {
    setSelectedRecruiterFilter(newFilter);
    fetchTaskBoardCandidates(standardFilters, newFilter);
  };
  
  const handleStandardFilterChange = (newFilters: CandidateFilterValues) => {
    setStandardFilters(newFilters);
    setAiSearchQuery(''); 
    setAiMatchedCandidateIds(null);
    setAiSearchReasoning(null);
    fetchTaskBoardCandidates(newFilters, selectedRecruiterFilter);
  };

  const handleAiSearch = async (query: string) => {
    if (!query.trim()) {
      toast('Please enter a search term.');
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
      toast.success(result.aiReasoning || "AI processing finished.");

    } catch (error) {
      toast.error((error as Error).message);
      setAiMatchedCandidateIds([]); 
    } finally {
      setIsAiSearching(false);
    }
  };

  const displayedCandidates = useMemo(() => {
    // Ensure candidates is an array before calling filter
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    return aiMatchedCandidateIds !== null
      ? safeCandidates.filter(c => aiMatchedCandidateIds.includes(c.id))
      : safeCandidates;
  }, [candidates, aiMatchedCandidateIds]);

  useEffect(() => {
    // Show error as toast popup if present
    if (initialFetchError) {
      toast.error(initialFetchError);
    }
  }, [initialFetchError]);

  if (sessionStatus === 'loading' || (isLoading && !fetchError && !authError && !permissionError && !pathname.startsWith('/auth/signin'))) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (authError) {
     return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">You need to be signed in to view this page.</p> <Button onClick={() => signIn(undefined, { callbackUrl: pathname })} className="btn-primary-gradient">Sign In</Button> </div> );
  }
  if (permissionError) {
     return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">{typeof fetchError === 'object' ? JSON.stringify(fetchError) : fetchError}</p> <Button onClick={() => router.push('/')} className="btn-primary-gradient">Go to Dashboard</Button> </div> );
  }

  if (fetchError && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Tasks</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{typeof fetchError === 'object' ? JSON.stringify(fetchError) : fetchError}</p>
        <Button onClick={() => fetchTaskBoardCandidates(standardFilters, selectedRecruiterFilter)} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  const pageTitle = session?.user?.role === 'Admin' 
    ? (selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "All Candidates Overview" : 
       selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "My Assigned Candidates (Admin)" :
       `Tasks for ${allRecruitersForFilter.find(r => r.id === selectedRecruiterFilter)?.name || 'Recruiter'}`)
    : "My Task Board";
  const pageDescription = session?.user?.role === 'Admin' 
    ? (selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "Overview of all candidates in the system." : 
       selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "Candidates assigned to you (Admin)." :
       `Candidates assigned to ${allRecruitersForFilter.find(r => r.id === selectedRecruiterFilter)?.name || 'the selected recruiter'}.`)
    : "Candidates assigned to you for processing.";

  return (
    <div className="flex h-full relative">
      {/* Filter Sidebar */}
      {showFilters && (
        <aside className="w-80 min-w-[250px] border-r bg-white dark:bg-background transition-all flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <span className="font-bold text-lg">Filters</span>
            <button
              className="ml-2 p-1 rounded hover:bg-muted"
              onClick={() => setShowFilters(false)}
              aria-label="Hide filters"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <CandidateFilters
              initialFilters={standardFilters}
              onFilterChange={handleStandardFilterChange}
              onAiSearch={handleAiSearch}
              availablePositions={availablePositions}
              availableStages={availableStages}
              availableRecruiters={allRecruitersForFilter}
              isLoading={isLoading || isAiSearching}
              isAiSearching={isAiSearching}
            />
          </div>
        </aside>
      )}
      {/* Show button when sidebar is hidden */}
      {!showFilters && (
        <button
          className="absolute left-0 top-4 z-10 bg-white dark:bg-background border rounded-r p-1 shadow"
          onClick={() => setShowFilters(true)}
          aria-label="Show filters"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0 p-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center">
                  <ListTodo className="mr-2 h-6 w-6 text-primary" /> {typeof pageTitle === 'object' ? JSON.stringify(pageTitle) : pageTitle}
                </CardTitle>
                <CardDescription>{typeof pageDescription === 'object' ? JSON.stringify(pageDescription) : pageDescription}</CardDescription>
              </div>
              <div className="flex gap-1 self-end sm:self-center">
                <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('kanban')}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              </div>
            </div>
      
            {session?.user?.role === 'Admin' && (
              <div className="mb-4 w-full md:max-w-xs hidden md:block">
                <Label htmlFor="recruiter-filter-select-desktop" className="text-xs font-medium">View tasks for:</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between mt-1 text-xs">
                            <span className="truncate">
                                {selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "My Assigned (Admin)" :
                                selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "All Candidates (Admin)" :
                                allRecruitersForFilter.find(r => r.id === selectedRecruiterFilter)?.name || "My Assigned (Admin)"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                        <ScrollArea className="max-h-60">
                            <Button variant="ghost" className={cn("w-full justify-start px-2 py-1 text-xs font-normal h-auto", selectedRecruiterFilter === MY_ASSIGNED_VALUE && "bg-accent text-accent-foreground")} onClick={() => handleRecruiterFilterChange(MY_ASSIGNED_VALUE)}><Check className={cn("mr-2 h-4 w-4", selectedRecruiterFilter === MY_ASSIGNED_VALUE ? "opacity-100" : "opacity-0")}/>My Assigned (Admin)</Button>
                            <Button variant="ghost" className={cn("w-full justify-start px-2 py-1 text-xs font-normal h-auto", selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE && "bg-accent text-accent-foreground")} onClick={() => handleRecruiterFilterChange(ALL_CANDIDATES_ADMIN_VALUE)}><Check className={cn("mr-2 h-4 w-4", selectedRecruiterFilter === ALL_CANDIDATES_ADMIN_VALUE ? "opacity-100" : "opacity-0")}/>All Candidates (Admin)</Button>
                            {allRecruitersForFilter.map(rec => (<Button key={rec.id} variant="ghost" className={cn("w-full justify-start px-2 py-1 text-xs font-normal h-auto", selectedRecruiterFilter === rec.id && "bg-accent text-accent-foreground")} onClick={() => handleRecruiterFilterChange(rec.id)}><Check className={cn("mr-2 h-4 w-4", selectedRecruiterFilter === rec.id ? "opacity-100" : "opacity-0")}/>{rec.name}</Button>))}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
              </div>
            )}

            {aiSearchReasoning && (
              <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">AI Search Results</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  {typeof aiSearchReasoning === 'object' ? JSON.stringify(aiSearchReasoning) : aiSearchReasoning}
                  {aiMatchedCandidateIds && aiMatchedCandidateIds.length === 0 && " No strong matches found."}
                </AlertDescription>
              </Alert>
            )}

            {(isLoading || isAiSearching) && displayedCandidates.length === 0 ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : displayedCandidates.length === 0 ? (
                <div className="text-center py-10"><Users className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No candidates match the current filters.</p></div>
            ) : viewMode === 'list' ? (
                <CandidateTable
                candidates={displayedCandidates}
                availablePositions={availablePositions}
                availableStages={availableStages}
                availableRecruiters={allRecruitersForFilter}
                onAssignRecruiter={() => { /* Not allowed in My Tasks */ }}
                onUpdateCandidate={async (id, newStatus) => { /* Limited action */ }}
                onDeleteCandidate={async (id) => { /* Limited action */ }}
                onOpenUploadModal={() => { /* Limited action */ }}
                onEditPosition={() => { /* Limited action */ }}
                isLoading={(isLoading || isAiSearching) && displayedCandidates.length > 0}
                onRefreshCandidateData={async (id) => fetchTaskBoardCandidates(standardFilters, selectedRecruiterFilter)}
                selectedCandidateIds={new Set()} 
                onToggleSelectCandidate={() => {}}
                onToggleSelectAllCandidates={() => {}}
                isAllCandidatesSelected={false}
                />
            ) : (
                <CandidateKanbanView candidates={displayedCandidates} statuses={availableStages.map(s => s.name)} />
            )}
        
      </div>
    </div>
  );
}
