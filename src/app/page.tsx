
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Candidate, Position } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Briefcase, CheckCircle2, UserPlus, FileWarning, UserRoundSearch, AlertTriangle } from "lucide-react";
import { isToday, parseISO } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { signIn, useSession } from "next-auth/react";

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setAuthError(false);
    try {
      const [candidatesRes, positionsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/positions'),
      ]);

      if (!candidatesRes.ok) {
        const errorText = candidatesRes.statusText || `Status: ${candidatesRes.status}`;
        if (candidatesRes.status === 401) setAuthError(true);
        throw new Error(`Failed to fetch candidates: ${errorText}`);
      }
      if (!positionsRes.ok) {
        const errorText = positionsRes.statusText || `Status: ${positionsRes.status}`;
        if (positionsRes.status === 401) setAuthError(true); // Also check for positions if candidates fetch was ok
        throw new Error(`Failed to fetch positions: ${errorText}`);
      }

      const candidatesData: Candidate[] = await candidatesRes.json();
      const positionsData: Position[] = await positionsRes.json();
      
      setCandidates(candidatesData);
      setPositions(positionsData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Auth error is handled by state, toast for other errors
      if (!String((error as Error).message).includes("401")) {
        toast({
          title: "Error Fetching Dashboard Data",
          description: (error as Error).message || "Could not load data.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Fetch data only if session is loaded and user is authenticated, or if auth is not required by design (but it is here)
    if (sessionStatus === 'authenticated') {
      fetchData();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      setAuthError(true); // If session is unauthenticated, it's an auth error for this page
    }
    // If sessionStatus is 'loading', we wait.
  }, [sessionStatus, fetchData]);


  const totalCandidates = candidates.length;
  const totalOpenPositions = positions.filter(p => p.isOpen).length;
  
  const hiredCandidatesThisMonth = candidates.filter(c => {
    try {
      if (!c.applicationDate) return false;
      const appDate = parseISO(c.applicationDate); 
      return c.status === 'Hired' && appDate.getFullYear() === new Date().getFullYear() && appDate.getMonth() === new Date().getMonth();
    } catch { return false; }
  }).length;

  const newCandidatesTodayList = candidates.filter(c => {
    try {
      if (!c.applicationDate) return false;
      const appDate = parseISO(c.applicationDate);
      return isToday(appDate);
    } catch (error) {
      return false;
    }
  });
  const newCandidatesTodayCount = newCandidatesTodayList.length;

  const stats = [
    { title: "Total Candidates", value: totalCandidates, icon: Users, color: "text-primary" },
    { title: "Open Positions", value: totalOpenPositions, icon: Briefcase, color: "text-accent" },
    { title: "Hired This Month", value: hiredCandidatesThisMonth, icon: CheckCircle2, color: "text-green-500" },
  ];

  const openPositionsWithNoCandidates = positions.filter(position => {
    if (!position.isOpen) return false;
    const hasCandidates = candidates.some(candidate => candidate.positionId === position.id);
    return !hasCandidates;
  });

  if (sessionStatus === 'loading' || (isLoading && !authError) ) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardHeader><div className="h-6 w-1/2 bg-muted rounded"></div></CardHeader><CardContent><div className="h-8 w-1/4 bg-muted rounded mt-2"></div></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card><CardHeader><div className="h-7 w-3/4 bg-muted rounded"></div><div className="h-4 w-1/2 bg-muted rounded mt-1"></div></CardHeader><CardContent><div className="h-20 bg-muted rounded"></div></CardContent></Card>
          <Card><CardHeader><div className="h-7 w-3/4 bg-muted rounded"></div><div className="h-4 w-1/2 bg-muted rounded mt-1"></div></CardHeader><CardContent><div className="h-20 bg-muted rounded"></div></CardContent></Card>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to view the dashboard data.
        </p>
        <Button onClick={() => signIn('azure-ad')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <UserPlus className="mr-2 h-5 w-5 text-primary" />
              New Candidates Today ({newCandidatesTodayCount})
            </CardTitle>
            <CardDescription>Candidates who applied today.</CardDescription>
          </CardHeader>
          <CardContent>
            {newCandidatesTodayList.length > 0 ? (
              <ul className="space-y-3">
                {newCandidatesTodayList.slice(0, 5).map(candidate => (
                  <li key={candidate.id} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/>
                      <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.position?.title || 'N/A'}</p>
                    </div>
                  </li>
                ))}
                {newCandidatesTodayList.length > 5 && (
                   <Link href="/candidates" passHref>
                      <Button variant="link" className="text-sm p-0 h-auto">
                          View all {newCandidatesTodayList.length} new candidates...
                      </Button>
                  </Link>
                )}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                  <UserRoundSearch className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No new candidates today.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileWarning className="mr-2 h-5 w-5 text-amber-600" />
              Positions Needing Applicants
            </CardTitle>
            <CardDescription>Open positions with no candidates yet.</CardDescription>
          </CardHeader>
          <CardContent>
            {openPositionsWithNoCandidates.length > 0 ? (
              <ul className="space-y-2">
                {openPositionsWithNoCandidates.slice(0,5).map(position => (
                  <li key={position.id} className="p-2 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors">
                    <p className="text-sm font-medium text-foreground">{position.title}</p>
                    <p className="text-xs text-muted-foreground">{position.department}</p>
                  </li>
                ))}
                {openPositionsWithNoCandidates.length > 5 && (
                   <Link href="/positions" passHref>
                      <Button variant="link" className="text-sm p-0 h-auto">
                          View all {openPositionsWithNoCandidates.length} positions...
                      </Button>
                  </Link>
                )}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">All open positions have applicants!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
