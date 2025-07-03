// src/components/dashboard/DashboardPageClient.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Candidate, Position, CandidateStatus, UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Briefcase, CheckCircle2, UserPlus, FileWarning, UserRoundSearch, ServerCrash, Loader2, ListChecks, CalendarClock, Users2, BarChart3 } from "lucide-react";
import { isToday } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { CandidatesPerPositionChart } from '@/components/dashboard/CandidatesPerPositionChart';
import { useRouter } from 'next/navigation';
import { toast } from "react-hot-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
      const fetchOptions = { credentials: 'include' as const };
      const promises = [];
      if (userRole === 'Admin' || userRole === 'Hiring Manager') {
        promises.push(fetch('/api/candidates', fetchOptions));
        promises.push(fetch('/api/users', fetchOptions));
        promises.push(Promise.resolve(null));
      } else if (userRole === 'Recruiter') {
        promises.push(fetch(`/api/candidates?assignedRecruiterId=${userId}`, fetchOptions));
        promises.push(Promise.resolve(null));
        promises.push(fetch(`/api/candidates?assignedRecruiterId=${userId}`, fetchOptions));
      } else {
        promises.push(Promise.resolve(null)); promises.push(Promise.resolve(null)); promises.push(Promise.resolve(null));
      }
      promises.push(fetch('/api/positions', fetchOptions));

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
    // Show error as toast popup if present
    if (initialFetchError) {
      toast.error(initialFetchError);
    }
  }, [initialCandidates, initialPositions, initialUsers, initialFetchError, serverAuthError, serverPermissionError, sessionStatus, session?.user?.role, toast]);


  const totalActiveCandidates = useMemo(() => {
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    return safeAllCandidates.filter((c: Candidate) => !BACKLOG_EXCLUSION_STATUSES.includes(c.status)).length;
  }, [allCandidates]);
  const totalOpenPositions = useMemo(() => {
    const safeAllPositions = Array.isArray(allPositions) ? allPositions : [];
    return safeAllPositions.filter((p: Position) => p.isOpen).length;
  }, [allPositions]);
  const hiredThisMonthAdmin = useMemo(() => {
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    return safeAllCandidates.filter((c: Candidate) => {
      try {
        if (!c.applicationDate || typeof c.applicationDate !== 'string') return false;
        const appDate = parseISO(c.applicationDate);
        return c.status === 'Hired' && appDate.getFullYear() === new Date().getFullYear() && appDate.getMonth() === new Date().getMonth();
      } catch { return false; }
    }).length;
  }, [allCandidates]);
  const totalActiveRecruiters = useMemo(() => {
    const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];
    return safeAllUsers.filter((u: UserProfile) => u.role === 'Recruiter').length;
  }, [allUsers]);
  const newCandidatesTodayAdminList = useMemo(() => {
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    return safeAllCandidates.filter((c: Candidate) => {
      try {
        if (!c.applicationDate || typeof c.applicationDate !== 'string') return false;
        return isToday(parseISO(c.applicationDate));
      } catch { return false; }
    });
  }, [allCandidates]);
  const openPositionsWithNoCandidates = useMemo(() => {
    const safeAllPositions = Array.isArray(allPositions) ? allPositions : [];
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    return safeAllPositions.filter((position: Position) => {
      if (!position.isOpen) return false;
      return !safeAllCandidates.some(candidate => candidate.positionId === position.id);
    });
  }, [allPositions, allCandidates]);

  const myActiveCandidatesList = useMemo(() => {
    const safeMyAssignedCandidates = Array.isArray(myAssignedCandidates) ? myAssignedCandidates : [];
    return safeMyAssignedCandidates.filter((c: Candidate) => !BACKLOG_EXCLUSION_STATUSES.includes(c.status));
  }, [myAssignedCandidates]);
  const myCandidatesInInterviewCount = useMemo(() => {
    const safeMyActiveCandidatesList = Array.isArray(myActiveCandidatesList) ? myActiveCandidatesList : [];
    return safeMyActiveCandidatesList.filter((c: Candidate) => INTERVIEW_STATUSES.includes(c.status)).length;
  }, [myActiveCandidatesList]);
  const newCandidatesAssignedToMeTodayList = useMemo(() => {
    const safeMyActiveCandidatesList = Array.isArray(myActiveCandidatesList) ? myActiveCandidatesList : [];
    return safeMyActiveCandidatesList.filter((c: Candidate) => {
      try {
        if (!c.applicationDate || typeof c.applicationDate !== 'string') return false;
        return isToday(parseISO(c.applicationDate));
      } catch { return false; }
    });
  }, [myActiveCandidatesList]);
  const myActionItemsList = useMemo(() => {
    const safeMyBacklogCandidates = Array.isArray(myBacklogCandidates) ? myBacklogCandidates : [];
    return safeMyBacklogCandidates.filter((c: Candidate) => c.recruiterId === session?.user?.id);
  }, [myBacklogCandidates, session?.user?.id]);

  // Candidate scoring range metrics
  const candidateScoreRanges = useMemo(() => {
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    const ranges = [
      { label: '81-100', min: 81, max: 100 },
      { label: '61-80', min: 61, max: 80 },
      { label: '41-60', min: 41, max: 60 },
      { label: '21-40', min: 21, max: 40 },
      { label: '0-20', min: 0, max: 20 },
    ];
    return ranges.map(range => ({
      label: range.label,
      count: safeAllCandidates.filter(c => typeof c.fitScore === 'number' && c.fitScore >= range.min && c.fitScore <= range.max).length
    }));
  }, [allCandidates]);

  // Unassigned candidates metric
  const unassignedCandidatesCount = useMemo(() => {
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    return safeAllCandidates.filter((c: Candidate) => !BACKLOG_EXCLUSION_STATUSES.includes(c.status) && !c.recruiterId).length;
  }, [allCandidates]);

  // Unassigned candidates list
  const unassignedCandidatesList = useMemo(() => {
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    return safeAllCandidates.filter((c: Candidate) => !BACKLOG_EXCLUSION_STATUSES.includes(c.status) && !c.recruiterId);
  }, [allCandidates]);

  // Stage summary metrics
  const stageSummary = useMemo(() => {
    const safeAllCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    const stageCounts: { [key: string]: number } = {};
    
    safeAllCandidates.forEach((candidate: Candidate) => {
      if (!BACKLOG_EXCLUSION_STATUSES.includes(candidate.status)) {
        const status = candidate.status;
        stageCounts[status] = (stageCounts[status] || 0) + 1;
      }
    });
    
    return Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      count
    })).sort((a, b) => b.count - a.count); // Sort by count descending
  }, [allCandidates]);

  if (authError) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Authentication Error</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You need to be signed in to view the dashboard."}</p> <Button onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })} className="btn-hover-primary-gradient">Sign In</Button> </div> );
  if (permissionError) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Permission Denied</h2> <p className="text-muted-foreground mb-4 max-w-md">{fetchError || "You do not have permission to view this page."}</p> <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Home</Button> </div> );
  if (fetchError && !isLoading && initialFetchError) return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center"> <ServerCrash className="w-16 h-16 text-destructive mb-4" /> <h2 className="text-2xl font-semibold text-foreground mb-2">Data Loading Error</h2> <p className="text-muted-foreground mb-6 max-w-md"> Could not load dashboard data: {fetchError} </p> <Button onClick={fetchDataClientSide} className="btn-hover-primary-gradient">Try Again</Button> </div> );
  if (isLoading) return ( <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50"> <Loader2 className="h-16 w-16 animate-spin text-primary" /> </div> );

  // Unified Dashboard - Show all metrics to everyone
  return (
    <div className="space-y-8 p-6">
      {/* Section 1: Key Performance Indicators */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-1 bg-primary rounded-full"></div>
          <h2 className="text-xl font-semibold text-foreground">Key Performance Indicators</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { title: "Total Active Candidates", value: totalActiveCandidates, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
            { title: "Open Positions", value: totalOpenPositions, icon: Briefcase, color: "text-accent", bgColor: "bg-accent/10" },
            { title: "Hired This Month", value: hiredThisMonthAdmin, icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/10" },
            { title: "Active Recruiters", value: totalActiveRecruiters, icon: Users2, color: "text-purple-500", bgColor: "bg-purple-500/10"},
            { title: "Unassigned Candidates", value: unassignedCandidatesCount, icon: UserRoundSearch, color: "text-orange-500", bgColor: "bg-orange-500/10"}
        ].map(stat => (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
            </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
          </Card>
        ))}
        </div>
      </div>

      {/* Section 2: Recruiter Performance (if applicable) */}
      {session?.user?.role === 'Recruiter' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-1 bg-purple-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-foreground">My Performance</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Active Candidates</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-foreground">{myActiveCandidatesList.length}</div></CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Candidates in Interview</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <UserRoundSearch className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-foreground">{myCandidatesInInterviewCount}</div></CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Candidates Today (Assigned)</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <CalendarClock className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-foreground">{newCandidatesAssignedToMeTodayList.length}</div></CardContent>
        </Card>
          </div>
        </div>
      )}

      {/* Section 3: Candidate Scoring Analysis - Chart.js Horizontal Bar Chart */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-foreground">Candidate Scoring Analysis</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-2">This chart shows the distribution of candidates by their fit score, helping you quickly identify the quality mix in your pipeline.</p>
        {/* Sort score ranges by count descending */}
        {(() => {
          const sortedScoreRanges = [...candidateScoreRanges].sort((b, a) => b.count - a.count);
          return (
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="pt-6">
                <Bar
                  data={{
                    labels: sortedScoreRanges.map(r => r.label),
                    datasets: [
                      {
                        label: 'Candidates',
                        data: sortedScoreRanges.map(r => r.count),
                        backgroundColor: [
                          'rgba(239, 68, 68, 0.8)',    // red-500
                          'rgba(249, 115, 22, 0.8)',   // orange-500
                          'rgba(234, 179, 8, 0.8)',    // yellow-500
                          'rgba(59, 130, 246, 0.8)',   // blue-500
                          'rgba(34, 197, 94, 0.8)',    // green-500
                        ],
                        borderRadius: 8,
                        borderSkipped: false,
                        barPercentage: 0.7,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return ` ${context.parsed.x} candidates`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(100,116,139,0.1)' },
                        ticks: { color: '#64748b', font: { size: 13 } },
                      },
                      y: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 13 } },
                      },
                    },
                  }}
                  height={100}
                />
              </CardContent>
            </Card>
          );
        })()}
      </div>


      {/* Section 5: Unassigned Candidates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-1 bg-orange-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-foreground">Unassigned Candidates</h2>
          </div>
          <Link href="/candidates?recruiterId=unassigned" passHref>
            <Button variant="outline" size="sm">
              View All ({unassignedCandidatesCount})
            </Button>
          </Link>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            {unassignedCandidatesList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fit Score</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedCandidatesList.slice(0, 5).map(candidate => (
                    <TableRow key={candidate.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/candidates/${candidate.id}`} className="flex items-center space-x-3 hover:underline">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.avatarUrl || `https://placehold.co/32x32.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} />
                            <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{candidate.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>{candidate.position?.title || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{candidate.status}</Badge>
                      </TableCell>
                      <TableCell>{candidate.fitScore || 0}%</TableCell>
                      <TableCell>{candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground">All candidates have been assigned to recruiters!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 6: Recent Activity - Tables */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-1 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {/* New Candidates Today */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <UserPlus className="mr-2 h-5 w-5 text-orange-500" /> 
                New Candidates Today ({newCandidatesTodayAdminList.length})
              </CardTitle>
              <CardDescription>All candidates who applied today.</CardDescription>
            </CardHeader>
            <CardContent>
              {newCandidatesTodayAdminList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recruiter</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newCandidatesTodayAdminList.slice(0, 5).map(candidate => (
                      <TableRow key={candidate.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/candidates/${candidate.id}`} className="flex items-center space-x-3 hover:underline">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={candidate.avatarUrl || `https://placehold.co/32x32.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} />
                              <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{candidate.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell>{candidate.position?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{candidate.status}</Badge>
                        </TableCell>
                        <TableCell>{candidate.recruiter?.name || 'Unassigned'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserRoundSearch className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No new candidates today.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Positions Needing Applicants */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileWarning className="mr-2 h-5 w-5 text-amber-600" /> 
                Positions Needing Applicants ({openPositionsWithNoCandidates.length})
              </CardTitle>
              <CardDescription>Open positions with no candidates yet.</CardDescription>
            </CardHeader>
            <CardContent>
              {openPositionsWithNoCandidates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openPositionsWithNoCandidates.slice(0, 5).map(position => (
                      <TableRow key={position.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/positions/${position.id}`} className="font-medium hover:underline">
                            {position.title}
                          </Link>
                        </TableCell>
                        <TableCell>{position.department}</TableCell>
                        <TableCell>{position.position_level || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600 border-green-600">Open</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-sm text-muted-foreground">All open positions have applicants!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 7: Recruiter Action Items (if applicable) */}
      {session?.user?.role === 'Recruiter' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-1 bg-red-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-foreground">My Action Items</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-1">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <ListChecks className="mr-2 h-5 w-5 text-red-500" />
                  My Action Items ({myActionItemsList.length})
                </CardTitle>
                <CardDescription>Active candidates assigned to you requiring attention.</CardDescription>
              </CardHeader>
              <CardContent>
                {myActionItemsList.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fit Score</TableHead>
                        <TableHead>Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myActionItemsList.slice(0, 5).map(candidate => (
                        <TableRow key={candidate.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link href={`/candidates/${candidate.id}`} className="flex items-center space-x-3 hover:underline">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={candidate.avatarUrl || `https://placehold.co/32x32.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} />
                                <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{candidate.name}</span>
                            </Link>
                          </TableCell>
                          <TableCell>{candidate.position?.title || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{candidate.status}</Badge>
                          </TableCell>
                          <TableCell>{candidate.fitScore || 0}%</TableCell>
                          <TableCell>{candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-sm text-muted-foreground">Your backlog is clear!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {newCandidatesAssignedToMeTodayList.length > 0 && (
              <Card className="shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <UserPlus className="mr-2 h-5 w-5 text-red-500" /> 
                    New Candidates Assigned Today ({newCandidatesAssignedToMeTodayList.length})
                  </CardTitle>
                  <CardDescription>Candidates assigned to you that applied today.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fit Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newCandidatesAssignedToMeTodayList.slice(0, 5).map(candidate => (
                        <TableRow key={candidate.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link href={`/candidates/${candidate.id}`} className="flex items-center space-x-3 hover:underline">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={candidate.avatarUrl || `https://placehold.co/32x32.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} />
                                <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{candidate.name}</span>
                            </Link>
                          </TableCell>
                          <TableCell>{candidate.position?.title || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{candidate.status}</Badge>
                          </TableCell>
                          <TableCell>{candidate.fitScore || 0}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Section 8: Analytics Chart */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-foreground">Analytics Overview</h2>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <CandidatesPerPositionChart candidates={allCandidates} positions={allPositions.filter(p => p.isOpen)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
