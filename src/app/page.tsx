
import { CandidatesPerPositionChart } from "@/components/dashboard/CandidatesPerPositionChart";
import { mockCandidates, mockPositions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CheckCircle2, Clock } from "lucide-react";

export default function DashboardPage() {
  // In a real app, data would be fetched
  const candidates = mockCandidates;
  const positions = mockPositions;

  const totalCandidates = candidates.length;
  const totalPositions = positions.filter(p => p.isOpen).length;
  const hiredCandidates = candidates.filter(c => c.status === 'Hired').length;
  const interviewsScheduled = candidates.filter(c => c.status === 'Interview Scheduled' || c.status === 'Interviewing').length;

  const stats = [
    { title: "Total Candidates", value: totalCandidates, icon: Users, color: "text-primary" },
    { title: "Open Positions", value: totalPositions, icon: Briefcase, color: "text-accent" },
    { title: "Hired This Month", value: hiredCandidates, icon: CheckCircle2, color: "text-green-500" }, // Example, real logic for "this month" needed
    { title: "Interviews Today", value: interviewsScheduled, icon: Clock, color: "text-orange-500" }, // Example, real logic for "today" needed
  ];

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
              {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <CandidatesPerPositionChart candidates={candidates} positions={positions} />
      </div>
      
      {/* Future sections:
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity feed will be shown here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">List of upcoming interviews.</p>
          </CardContent>
        </Card>
      </div>
      */}
    </div>
  );
}
