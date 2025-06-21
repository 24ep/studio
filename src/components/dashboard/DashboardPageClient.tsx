// src/components/dashboard/DashboardPageClient.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Candidate, Position, CandidateStatus, UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Briefcase, CheckCircle2, UserPlus, FileWarning, UserRoundSearch, ServerCrash, Loader2, ListChecks, CalendarClock, Users2 } from "lucide-react";
import { isToday, parseISO } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { CandidatesPerPositionChart } from '@/components/dashboard/CandidatesPerPositionChart';
import { useRouter } from 'next/navigation';

interface DashboardPageClientProps {
  initialCandidates: Candidate[];
  initialPositions: Position[];
  initialUsers: UserProfile[]; // Or a simplified version like Pick<UserProfile, 'id' | 'role'>
  initialFetchError?: string;
  authError?: boolean; // Added from server
  permissionError?: boolean; // Added from server
}

const BACKLOG_EXCLUSION_STATUSES: CandidateStatus[] = ['Hired', 'Rejected', 'Offer Accepted'];
const INTERVIEW_STATUSES: CandidateStatus[] = ['Interview Scheduled', 'Interviewing'];

export default function DashboardPageClient({
  initialCandidates,
  initialPositions,
  initialUsers,
  initialFetchError,
  authError: serverAuthError = false,
  permissionError: serverPermissionError = false,
}: DashboardPageClientProps) {
  const [allCandidates, setAllCandidates] = useState<Candidate[]>(initialCandidates || []);
  const [myAssignedCandidates, setMyAssignedCandidates] = useState<Candidate[]>(initialCandidates || []); // For Recruiter, initialCandidates *are* their assigned ones
  const [allPositions, setAllPositions] = useState<Position[]>(initialPositions || []);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(initialUsers || []);
  const [myBacklogCandidates, setMyBacklogCandidates] = useState<Candidate[]>([]);

  const [isLoading, setIsLoading] = useState(false); // Client-side loading for subsequent actions if any
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError || null);
  const [authError, setAuthError] = useState(serverAuthError);
  const [permissionError, setPermissionError] = useState(serverPermissionError);

  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Function to re-fetch data on client if needed (e.g., after an action or for a refresh button)
  const fetchDataClientSide = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    let accumulatedFetchError = "";
    const userRole = session.user.role;
    const userId = session.user.id;

    try {
      const promises = [];
      if (userRole === 'Admin' || userRole === 'Hiring Manager') {
        promises.push(fetch('/api/candidates'));
        promises.push(fetch('/api/users'));
        promises.push(Promise.resolve(null));
      } else if (userRole === 'Recruiter') {
        promises.push(fetch(`/api/candidates?assignedRecruiterId=${userId}`));
        promises.push(Promise.resolve(null));
        promises.push(fetch(`/api/candidates?assignedRecruiterId=${userId}`));
      } else {
        promises.push(Promise.resolve(null)); promises.push(Promise.resolve(null)); promises.push(Promise.resolve(null));
      }
      promises.push(fetch('/api/positions'));

      const [candidatesResOrNull, usersResOrNull, myBacklogCandidatesResOrNull, positionsRes] = await Promise.all(promises);

      if (candidatesResOrNull && !candidatesResOrNull.ok) {
        const errorText = candidatesResOrNull.statusText || `Status: ${candidatesResOrNull.status}`;
        accumulatedFetchError += `Failed to fetch candidates: ${errorText}. `;
        if (userRole === 'Admin' || userRole === 'Hiring Manager') setAllCandidates([]); else setMyAssignedCandidates([]);
      } else if (candidatesResOrNull) {
        const candidatesData: Candidate[] = await candidatesResOrNull.json();
        if (userRole === 'Admin' || userRole === 'Hiring Manager') setAllCandidates(candidatesData); else setMyAssignedCandidates(candidatesData);
      }

      if (usersResOrNull && !usersResOrNull.ok) { /* ... error handling ... */ setAllUsers([]); }
      else if (usersResOrNull) { setAllUsers(await usersResOrNull.json()); }

      if (myBacklogCandidatesResOrNull && !myBacklogCandidatesResOrNull.ok) { /* ... error handling ... */ setMyBacklogCandidates([]); }
      else if (myBacklogCandidatesResOrNull) {
        const backlogData: Candidate[] = await myBacklogCandidatesResOrNull.json();
        setMyBacklogCandidates(backlogData.filter(c => !BACKLOG_EXCLUSION_STATUSES.includes(c.status)));
      }

      if (!positionsRes || !positionsRes.ok) { /* ... error handling ... */ setAllPositions([]); }
      else { setAllPositions(await positionsRes.json()); }

      if (accumulatedFetchError) setFetchError(accumulatedFetchError.trim());

    } catch (error) {
      const genericMessage = (error as Error).message || "An unexpected error occurred.";
      setFetchError(genericMessage);
      setAllCandidates([]); setMyAssignedCandidates([]); setAllPositions([]); setAllUsers([]); setMyBacklogCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session?.user?.id, session?.user?.role]);

  useEffect(() => {
    // Handle initial state passed from server component
    setAllCandidates(initialCandidates || []);
    if (session?.user?.role === 'Recruiter') {
      setMyAssignedCandidates(initialCandidates || []); // For recruiter, initial IS their assigned
      setMyBacklogCandidates((initialCandidates || []).filter(c => !BACKLOG_EXCLUSION_STATUSES.includes(c.status)));
    }
    setAllPositions(initialPositions || []);
    setAllUsers(initialUsers || []);
    setFetchError(initialFetchError || null);
    setAuthError(serverAuthError);
    setPermissionError(serverPermissionError);

    if (sessionStatus === 'unauthenticated' && !serverAuthError) {
        signIn(undefined, { callbackUrl: window.location.pathname });
    }
    // We no longer need to call fetchDataClientSide on initial mount if server provides data
    // setIsLoading(false); // Handled by server component or if initial props exist
  }, [initialCandidates, initialPositions, initialUsers, initialFetchError, serverAuthError, serverPermissionError, sessionStatus, session?.user?.role]);


  const totalActiveCandidates = useMemo(() => allCandidates.filter(c => !BACKLOG_EXCLUSION_STATUSES.includes(c.status)).length, [allCandidates]);
  const totalOpenPositions = useMemo(() => allPositions.filter(p => p.isOpen).length, [allPositions]);
  const hiredThisMonthAdmin = useMemo(() => allCandidates.filter(c => {
    try {
      if (!c.applicationDate || typeof c.applicationDate !== 'string') return false;
      const appDate = parseISO(c.applicationDate);
      return c.status === 'Hired' && appDate.getFullYear() === new Date().getFullYear() && appDate.getMonth() === new Date().getMonth();
    } catch { return false; }
  }).length, [allCandidates]);
  const totalActiveRecruiters = useMemo(() => allUsers.filter(u => u.role === 'Recruiter').length, [allUsers]);
  const newCandidatesTodayAdminList = useMemo(() => allCandidates.filter(c => {
    try {
      if (!c.applicationDate || typeof c.applicationDate !== 'string') return false;
      return isToday(parseISO(c.applicationDate));
    } catch { return false; }
  }), [allCandidates]);
  const openPositionsWithNoCandidates = useMemo(() => allPositions.filter(position => {
    if (!position.isOpen) return false;
    return !allCandidates.some(candidate => candidate.positionId === position.id);
  }), [allPositions, allCandidates]);

  const myActiveCandidatesList = useMemo(() => myAssignedCandidates.filter(c => !BACKLOG_EXCLUSION_STATUSES.includes(c.status)), [myAssignedCandidates]);
  const myCandidatesInInterviewCount = useMemo(() => myActiveCandidatesList.filter(c => INTERVIEW_STATUSES.includes(c.status)).length, [myActiveCandidatesList]);
  const newCandidatesAssignedToMeTodayList = useMemo(() => myActiveCandidatesList.filter(c => {
      try {
        if (!c.applicationDate || typeof c.applicationDate !== 'string') return false;
        return isToday(parseISO(c.applicationDate));
      } catch { return false; }
  }), [myActiveCandidatesList]);
  const myActionItemsList = useMemo(() => myBacklogCandidates.filter(c => c.recruiterId === session?.user?.id), [myBacklogCandidates, session?.user?.id]);

  if (authError) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Authentication Error</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You need to be signed in to view the dashboard."}</p> <Button onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })} className="btn-hover-primary-gradient">Sign In</Button> </div> );
  if (permissionError) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You do not have permission to view this page."}</p> <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Home</Button> </div> );
  if (fetchError && !isLoading) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Data Loading Error</h2> <p className="text-muted-foreground mb-6 max-w-md"> Could not load dashboard data: {fetchError} </p> <Button onClick={fetchDataClientSide} className="btn-hover-primary-gradient">Try Again</Button> </div> );
  if (isLoading) return ( <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50"> <Loader2 className="h-16 w-16 animate-spin text-primary" /> </div> );

  const AdminManagerDashboard = () => ( /* ... existing JSX ... */ <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Active Candidates", value: totalActiveCandidates, icon: Users, color: "text-primary" },
          { title: "Open Positions", value: totalOpenPositions, icon: Briefcase, color: "text-accent" },
          { title: "Hired This Month", value: hiredThisMonthAdmin, icon: CheckCircle2, color: "text-green-500" },
          { title: "Active Recruiters", value: totalActiveRecruiters, icon: Users2, color: "text-purple-500"}
        ].map(stat => (
          <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-foreground">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center text-lg"><UserPlus className="mr-2 h-5 w-5 text-primary" /> New Candidates Today ({newCandidatesTodayAdminList.length})</CardTitle><CardDescription>All candidates who applied today.</CardDescription></CardHeader>
          <CardContent>
            {newCandidatesTodayAdminList.length > 0 ? (
              <ul className="space-y-3 max-h-72 overflow-y-auto">{newCandidatesTodayAdminList.slice(0, 7).map(candidate => (
                <li key={candidate.id} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors">
                  <Avatar className="h-9 w-9"><AvatarImage src={candidate.avatarUrl || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/><AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><Link href={`/candidates/${candidate.id}`} passHref><span className="text-sm font-medium text-foreground hover:underline cursor-pointer truncate block">{candidate.name}</span></Link><p className="text-xs text-muted-foreground truncate" title={candidate.position?.title || 'N/A'}>{candidate.position?.title || 'N/A'}</p></div>
                </li>))}
                {newCandidatesTodayAdminList.length > 7 && (<Link href="/candidates" passHref><Button variant="link" className="text-sm p-0 h-auto mt-2">View all {newCandidatesTodayAdminList.length} new candidates...</Button></Link>)}
              </ul>
            ) : (<div className="flex flex-col items-center justify-center py-6 text-center"><UserRoundSearch className="h-10 w-10 text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">No new candidates today.</p></div>)}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center text-lg"><FileWarning className="mr-2 h-5 w-5 text-amber-600" /> Positions Needing Applicants</CardTitle><CardDescription>Open positions with no candidates yet.</CardDescription></CardHeader>
          <CardContent>
            {openPositionsWithNoCandidates.length > 0 ? (
              <ul className="space-y-2 max-h-72 overflow-y-auto">{openPositionsWithNoCandidates.slice(0,7).map(position => (
                <li key={position.id} className="p-2 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors">
                  <Link href={`/positions/${position.id}`} passHref><span className="text-sm font-medium text-foreground hover:underline cursor-pointer block truncate">{position.title}</span></Link><p className="text-xs text-muted-foreground truncate">{position.department}</p>
                </li>))}
                {openPositionsWithNoCandidates.length > 7 && (<Link href="/positions" passHref><Button variant="link" className="text-sm p-0 h-auto mt-2">View all {openPositionsWithNoCandidates.length} positions...</Button></Link>)}
              </ul>
            ) : (<div className="flex flex-col items-center justify-center py-6 text-center"><CheckCircle2 className="h-10 w-10 text-green-500 mb-2" /><p className="text-sm text-muted-foreground">All open positions have applicants!</p></div>)}
          </CardContent>
        </Card>
      </div>
      <CandidatesPerPositionChart candidates={allCandidates} positions={allPositions.filter(p => p.isOpen)} />
    </div>);
  const RecruiterDashboard = () => ( /* ... existing JSX ... */ <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">My Active Candidates</CardTitle><Users className="h-5 w-5 text-primary" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{myActiveCandidatesList.length}</div></CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">My Candidates in Interview</CardTitle><UserRoundSearch className="h-5 w-5 text-purple-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{myCandidatesInInterviewCount}</div></CardContent>
        </Card>
         <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">New Candidates Today (Assigned)</CardTitle><CalendarClock className="h-5 w-5 text-orange-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{newCandidatesAssignedToMeTodayList.length}</div></CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader><CardTitle className="flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5 text-primary" />My Action Items ({myActionItemsList.length})</CardTitle><CardDescription>Active candidates assigned to you requiring attention.</CardDescription></CardHeader>
          <CardContent>
            {myActionItemsList.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">{myActionItemsList.slice(0, 5).map(candidate => (
                <li key={candidate.id} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors">
                  <Avatar className="h-9 w-9"><AvatarImage src={candidate.avatarUrl || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/><AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><Link href={`/candidates/${candidate.id}`} passHref><span className="text-sm font-medium text-foreground hover:underline cursor-pointer truncate block">{candidate.name}</span></Link><p className="text-xs text-muted-foreground truncate" title={candidate.position?.title || 'N/A'}>{candidate.position?.title || 'N/A'} - <span className="capitalize">{candidate.status}</span></p></div>
                </li>))}
                {myActionItemsList.length > 5 && (<Link href="/my-tasks" passHref><Button variant="link" className="text-sm p-0 h-auto mt-2">View all {myActionItemsList.length} action items...</Button></Link>)}
              </ul>
            ) : (<div className="flex flex-col items-center justify-center py-6 text-center"><CheckCircle2 className="h-10 w-10 text-green-500 mb-2" /><p className="text-sm text-muted-foreground">Your backlog is clear!</p></div>)}
          </CardContent>
        </Card>
        {newCandidatesAssignedToMeTodayList.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center text-lg"><UserPlus className="mr-2 h-5 w-5 text-primary" /> New Candidates Assigned Today ({newCandidatesAssignedToMeTodayList.length})</CardTitle><CardDescription>Candidates assigned to you that applied today.</CardDescription></CardHeader>
            <CardContent>
              <ul className="space-y-3 max-h-72 overflow-y-auto">{newCandidatesAssignedToMeTodayList.slice(0,5).map(candidate => (
                <li key={candidate.id} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors">
                  <Avatar className="h-9 w-9"><AvatarImage src={candidate.avatarUrl || `https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/><AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><Link href={`/candidates/${candidate.id}`} passHref><span className="text-sm font-medium text-foreground hover:underline cursor-pointer truncate block">{candidate.name}</span></Link><p className="text-xs text-muted-foreground truncate" title={candidate.position?.title || 'N/A'}>{candidate.position?.title || 'N/A'}</p></div>
                </li>))}
                {newCandidatesAssignedToMeTodayList.length > 5 && (<Link href="/my-tasks?filter=newToday" passHref><Button variant="link" className="text-sm p-0 h-auto mt-2">View all new assigned candidates...</Button></Link>)}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>);

  if (session?.user?.role === 'Recruiter') {
    return <RecruiterDashboard />;
  } else if (session?.user?.role === 'Admin' || session?.user?.role === 'Hiring Manager') {
    return <AdminManagerDashboard />;
  }
  return <div className="p-4 text-center"><p className="text-muted-foreground">Dashboard view not available for your role.</p></div>;
}
