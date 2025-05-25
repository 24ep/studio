
import { CandidatesPerPositionChart } from "@/components/dashboard/CandidatesPerPositionChart";
import { mockCandidates, mockPositions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, CheckCircle2, UserPlus, FileWarning, UserRoundSearch } from "lucide-react";
import { format, isToday, parseISO } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const candidates = mockCandidates;
  const positions = mockPositions;

  const totalCandidates = candidates.length;
  const totalOpenPositions = positions.filter(p => p.isOpen).length;
  const hiredCandidatesThisMonth = candidates.filter(c => {
    // Basic "this month" check - for real app, use more robust date logic
    const appDate = parseISO(c.applicationDate);
    return c.status === 'Hired' && appDate.getFullYear() === new Date().getFullYear() && appDate.getMonth() === new Date().getMonth();
  }).length;

  const newCandidatesTodayList = candidates.filter(c => {
    try {
      const appDate = parseISO(c.applicationDate);
      return isToday(appDate);
    } catch (error) {
      console.error("Error parsing applicationDate for candidate:", c.id, error);
      return false;
    }
  });
  const newCandidatesTodayCount = newCandidatesTodayList.length;

  const stats = [
    { title: "Total Candidates", value: totalCandidates, icon: Users, color: "text-primary" },
    { title: "Open Positions", value: totalOpenPositions, icon: Briefcase, color: "text-accent" },
    { title: "New Today", value: newCandidatesTodayCount, icon: UserPlus, color: "text-blue-500" },
    { title: "Hired This Month", value: hiredCandidatesThisMonth, icon: CheckCircle2, color: "text-green-500" },
  ];

  const openPositionsWithNoCandidates = positions.filter(position => {
    if (!position.isOpen) return false;
    const hasCandidates = candidates.some(candidate => candidate.positionId === position.id);
    return !hasCandidates;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <CandidatesPerPositionChart candidates={candidates} positions={positions} />
        </div>
        <div className="space-y-6">
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
                  {newCandidatesTodayList.slice(0, 5).map(candidate => ( // Show max 5 for brevity
                    <li key={candidate.id} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md hover:bg-muted/80 transition-colors">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${candidate.name.charAt(0)}`} alt={candidate.name} data-ai-hint="person avatar"/>
                        <AvatarFallback>{candidate.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.positionTitle}</p>
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
                  {openPositionsWithNoCandidates.slice(0,5).map(position => ( // Show max 5
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
    </div>
  );
}
