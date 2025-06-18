
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CandidateFilters, type CandidateFilterValues } from '@/components/candidates/CandidateFilters';


const ALL_CANDIDATES_ADMIN_VALUE = "ALL_CANDIDATES_ADMIN";
const MY_ASSIGNED_VALUE = "me";
const ALL_POSITIONS_SELECT_VALUE = "__ALL_POSITIONS__"; // Added

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
  
  // State for new filters
  const [nameFilter, setNameFilter] = useState('');
  const [positionIdFilter, setPositionIdFilter] = useState(ALL_POSITIONS_SELECT_VALUE);
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');
  const [educationFilter, setEducationFilter] = useState('');
  const [fitScoreRange, setFitScoreRange] = useState<[number, number]>([0, 100]);

  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>([]);

  const [positionSearchOpen, setPositionSearchOpen] = useState(false);
  const [positionSearchQuery, setPositionSearchQuery] = useState('');
  const [statusSearchOpen, setStatusSearchOpen] = useState(false);
  const [statusSearchQuery, setStatusSearchQuery] = useState('');


  const fetchInitialData = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;
    try {
      const [posRes, stagesRes] = await Promise.all([
        fetch('/api/positions'),
        fetch('/api/settings/recruitment-stages')
      ]);
      if (posRes.ok) setAvailablePositions(await posRes.json());
      else console.error("Failed to fetch positions for filters");
      if (stagesRes.ok) setAvailableStages(await stagesRes.json());
      else console.error("Failed to fetch stages for filters");
    } catch (error) {
      console.error("Error fetching initial data for filters:", error);
    }
  }, [sessionStatus]);


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
    
    const queryParams = new URLSearchParams();
    if (userRole === 'Admin') {
      if (selectedRecruiterFilter !== ALL_CANDIDATES_ADMIN_VALUE) {
        queryParams.append('assignedRecruiterId', selectedRecruiterFilter === MY_ASSIGNED_VALUE ? session.user.id : selectedRecruiterFilter);
      }
    } else { // Recruiter
      queryParams.append('assignedRecruiterId', session.user.id);
    }
    
    if (nameFilter) queryParams.append('name', nameFilter);
    if (positionIdFilter && positionIdFilter !== ALL_POSITIONS_SELECT_VALUE) queryParams.append('positionId', positionIdFilter);
    if (statusFilter !== 'all') queryParams.append('status', statusFilter);
    if (educationFilter) queryParams.append('education', educationFilter);
    queryParams.append('minFitScore', String(fitScoreRange[0]));
    queryParams.append('maxFitScore', String(fitScoreRange[1]));
    
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
  }, [sessionStatus, session, pathname, signIn, selectedRecruiterFilter, nameFilter, positionIdFilter, statusFilter, educationFilter, fitScoreRange]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      fetchInitialData();
      if (session.user.role === 'Admin') {
        fetchRecruitersForAdmin();
      }
      fetchTaskBoardCandidates();
    }
  }, [sessionStatus, session, fetchTaskBoardCandidates, fetchRecruitersForAdmin, pathname, signIn, fetchInitialData]);
  
  const handleRecruiterFilterChange = (newFilter: string) => {
    setSelectedRecruiterFilter(newFilter);
    // fetchTaskBoardCandidates will be called by its own useEffect dependency on selectedRecruiterFilter
  };

  const handleUpdateCandidateOnTaskBoard = async (candidateId: string, newStatus: Candidate['status']) => {
    toast({ title: "Action Recommendation", description: "To update status, please go to the main Candidates page or Candidate Detail page."});
    fetchTaskBoardCandidates(); // Refresh
  };

  const handleDeleteCandidateOnTaskBoard = async (candidateId: string) => {
    toast({ title: "Action Not Available", description: "To delete candidates, please use the main Candidates page."});
  };
  
  const handleOpenUploadModalOnTaskBoard = (candidate: Candidate) => {
     toast({ title: "Action Not Available", description: "To upload resumes, please use the main Candidates page or Candidate Detail page."});
  };

  const handleApplyFilters = () => {
    fetchTaskBoardCandidates();
  };

  const handleResetFilters = () => {
    setNameFilter('');
    setPositionIdFilter(ALL_POSITIONS_SELECT_VALUE);
    setPositionSearchQuery('');
    setStatusFilter('all');
    setStatusSearchQuery('');
    setEducationFilter('');
    setFitScoreRange([0, 100]);
    // Fetch will be triggered by useEffect on these state changes if they are dependencies
    // or call fetchTaskBoardCandidates directly if needed.
    // For simplicity, let's assume useEffect on selectedRecruiterFilter will handle the refetch if that's the primary driver,
    // otherwise, you might need to call fetchTaskBoardCandidates here.
  };

  const getCurrentPositionDisplayValue = () => {
    if (positionIdFilter === ALL_POSITIONS_SELECT_VALUE) return "All Positions";
    return availablePositions.find(p => p.id === positionIdFilter)?.title || "All Positions";
  };

  const getCurrentStatusDisplayValue = () => {
    if (statusFilter === 'all') return "All Statuses";
    return availableStages.find(s => s.name === statusFilter)?.name || "All Statuses";
  };

  const filteredPositions = positionSearchQuery
    ? availablePositions.filter(pos => pos.title.toLowerCase().includes(positionSearchQuery.toLowerCase()))
    : availablePositions;

  const filteredStages = statusSearchQuery
    ? availableStages.filter(stage => stage.name.toLowerCase().includes(statusSearchQuery.toLowerCase()))
    : availableStages;


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
            <div className="flex gap-1 self-end sm:self-center">
                <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('kanban')}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Filters */}
          <div className="mb-6 p-4 border rounded-lg bg-card shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                {session?.user?.role === 'Admin' && (
                    <div className="w-full">
                        <Label htmlFor="recruiter-filter-select" className="text-xs font-medium">View tasks for:</Label>
                        <Select value={selectedRecruiterFilter} onValueChange={handleRecruiterFilterChange}>
                            <SelectTrigger id="recruiter-filter-select" className="w-full mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_CANDIDATES_ADMIN_VALUE}>All Candidates (Admin)</SelectItem>
                                <SelectItem value={MY_ASSIGNED_VALUE}>My Assigned (Admin)</SelectItem>
                                {recruiters.map(rec => (<SelectItem key={rec.id} value={rec.id}>{rec.name}'s Candidates</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                 <div>
                    <Label htmlFor="name-filter-task">Name</Label>
                    <Input id="name-filter-task" placeholder="Search by name..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="mt-1" disabled={isLoading}/>
                </div>
                <div>
                    <Label htmlFor="position-filter-task">Position</Label>
                    <Popover open={positionSearchOpen} onOpenChange={setPositionSearchOpen}>
                        <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between mt-1"><span className="truncate">{getCurrentPositionDisplayValue()}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                        <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height"><div className="p-2"><Input placeholder="Search position..." value={positionSearchQuery} onChange={(e) => setPositionSearchQuery(e.target.value)} className="h-9"/></div>
                            <ScrollArea className="max-h-60">
                                <Button variant="ghost" className={cn("w-full justify-start", positionIdFilter === ALL_POSITIONS_SELECT_VALUE && "bg-accent text-accent-foreground")} onClick={() => {setPositionIdFilter(ALL_POSITIONS_SELECT_VALUE); setPositionSearchOpen(false); setPositionSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", positionIdFilter === ALL_POSITIONS_SELECT_VALUE ? "opacity-100" : "opacity-0")}/>All Positions</Button>
                                {filteredPositions.map(pos => (<Button key={pos.id} variant="ghost" className={cn("w-full justify-start", positionIdFilter === pos.id && "bg-accent text-accent-foreground")} onClick={() => {setPositionIdFilter(pos.id); setPositionSearchOpen(false); setPositionSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", positionIdFilter === pos.id ? "opacity-100" : "opacity-0")}/>{pos.title}</Button>))}
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </div>
                 <div>
                    <Label htmlFor="status-filter-task">Status</Label>
                     <Popover open={statusSearchOpen} onOpenChange={setStatusSearchOpen}>
                        <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between mt-1"><span className="truncate">{getCurrentStatusDisplayValue()}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                        <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height"><div className="p-2"><Input placeholder="Search status..." value={statusSearchQuery} onChange={(e) => setStatusSearchQuery(e.target.value)} className="h-9"/></div>
                            <ScrollArea className="max-h-60">
                                <Button variant="ghost" className={cn("w-full justify-start", statusFilter === 'all' && "bg-accent text-accent-foreground")} onClick={() => {setStatusFilter('all'); setStatusSearchOpen(false); setStatusSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", statusFilter === "all" ? "opacity-100" : "opacity-0")}/>All Statuses</Button>
                                {filteredStages.map(st => (<Button key={st.id} variant="ghost" className={cn("w-full justify-start", statusFilter === st.name && "bg-accent text-accent-foreground")} onClick={() => {setStatusFilter(st.name); setStatusSearchOpen(false); setStatusSearchQuery('');}}><Check className={cn("mr-2 h-4 w-4", statusFilter === st.name ? "opacity-100" : "opacity-0")}/>{st.name}</Button>))}
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="education-filter-task">Education</Label>
                    <Input id="education-filter-task" placeholder="Filter by education..." value={educationFilter} onChange={(e) => setEducationFilter(e.target.value)} className="mt-1" disabled={isLoading}/>
                </div>
                <div className="xl:col-span-full flex justify-end gap-2 mt-2"> {/* Fit score and buttons might need different layout */}
                    <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}><FilterX className="mr-2 h-4 w-4" /> Reset</Button>
                    <Button onClick={handleApplyFilters} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Apply</Button>
                </div>
            </div>
          </div>

          {isLoading ? (
             <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          ) : candidates.length === 0 ? (
             <div className="text-center py-10"><Users className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No candidates match the current filters.</p></div>
          ) : viewMode === 'list' ? (
            <CandidateTable
              candidates={candidates}
              availablePositions={availablePositions}
              availableStages={availableStages}
              onUpdateCandidate={handleUpdateCandidateOnTaskBoard}
              onDeleteCandidate={handleDeleteCandidateOnTaskBoard}
              onOpenUploadModal={handleOpenUploadModalOnTaskBoard}
              onEditPosition={() => toast({title: "Action Not Available", description: "Position editing from Task Board is not available."})}
              isLoading={isLoading}
              onRefreshCandidateData={fetchTaskBoardCandidates} 
            />
          ) : (
            <CandidateKanbanView candidates={candidates} statuses={KANBAN_STATUS_ORDER} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
