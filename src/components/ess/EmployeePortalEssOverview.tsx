"use client";

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Banknote, BriefcaseBusiness, CalendarCheck, ChevronRight, Clock3, FileCheck2, GraduationCap, RefreshCw, Target, UserPlus, UserRoundX, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import BulkUploadCVsModal from '@/components/BulkUploadCVsModal';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { EssDashboard } from './ess-types';
import { hasAnyPermission } from '@/lib/permissions';

export function EmployeePortalEssOverview() {
  const { data: session } = useSession();
  const [data, setData] = React.useState<EssDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [referralUploadOpen, setReferralUploadOpen] = React.useState(false);

  const load = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ess/me', { credentials: 'include', cache: 'no-store', signal });
      const payload = await response.json().catch(() => ({})) as { data?: EssDashboard | null; message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to load My Workday.');
      if (!payload.data) throw new Error(payload.message || 'No employee record is linked to this account.');
      setData(payload.data);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setData(null);
      setError(caught instanceof Error ? caught.message : 'Unable to load My Workday.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) return <main className="mx-auto max-w-[1440px] px-4 py-6"><Skeleton className="h-36 rounded-lg" /></main>;
  if (!data) {
    return (
      <main className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8">
        <section
          role="alert"
          aria-labelledby="workday-error-title"
          className="w-full max-w-lg rounded-xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10"
        >
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-muted/60 text-muted-foreground" aria-hidden>
            <UserRoundX className="h-10 w-10" strokeWidth={1.75} />
          </div>
          <h1 id="workday-error-title" className="mt-5 text-xl font-semibold tracking-tight text-foreground">
            My Workday is unavailable
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {error || 'Unable to load your employee information.'}
          </p>
          <Button className="mt-6" size="sm" variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Try again
          </Button>
        </section>
      </main>
    );
  }

  const availableLeave = data.leaveBalances.reduce((total, item) => (
    total + Number(item.allocated || 0) + Number(item.accrued || 0) + Number(item.carry_forward || 0)
      - Number(item.used || 0) - Number(item.pending || 0) - Number(item.reserved || 0)
  ), 0);
  const today = new Date().toLocaleDateString('en-CA');
  const attendance = data.attendance.find(item => String(item.work_date || '').slice(0, 10) === today);
  const attendanceStatus = attendance?.clock_in && !attendance?.clock_out ? 'Checked in' : attendance?.clock_out ? 'Completed' : 'Not checked in';
  const performanceActions = data.performance.filter(item => ['not_started', 'in_progress', 'returned_for_revision', 'completed'].includes(String(item.status))).length;
  const acknowledgmentCount = data.documents.filter(item => item.requires_acknowledgment && !item.acknowledged_at).length;
  const requestActions = data.requests.filter(item => ['draft', 'returned_for_revision'].includes(String(item.status))).length;

  return (
    <main className="min-h-full bg-[hsl(var(--app-page-background,var(--background)))] px-4 py-6" aria-labelledby="ess-overview-title">
      <div className="mx-auto max-w-[1440px] rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">My workday</p>
            <h1 id="ess-overview-title" className="mt-1 text-lg font-semibold">Welcome back, {data.employee.preferredName || data.employee.name}</h1>
            <div className="mt-2 flex max-w-md items-center gap-3">
              <Progress value={data.employee.profileCompletion} className="h-1.5 flex-1" />
              <Link href="/ess/profile" className="text-xs font-medium text-primary">{data.employee.profileCompletion}% profile</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button asChild size="sm"><Link href="/ess/leave">Request leave</Link></Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setReferralUploadOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Friend referrals</Button>
            <Button asChild size="sm" variant="outline"><Link href="/ess/attendance">Attendance</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/ess/expenses">Submit expense</Link></Button>
          </div>
        </div>
        <div className="grid divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-6">
          <PortalMetric icon={CalendarCheck} label="Leave balance" value={`${availableLeave.toFixed(1)} days`} href="/ess/leave" />
          <PortalMetric icon={Clock3} label="Attendance" value={attendanceStatus} href="/ess/attendance" />
          <PortalMetric icon={FileCheck2} label="Acknowledgments" value={String(acknowledgmentCount)} href="/ess/documents" />
          <PortalMetric icon={Target} label="Performance actions" value={String(performanceActions)} href="/ess/performance" />
          <PortalMetric icon={GraduationCap} label="Assigned learning" value={String(data.metrics.activeLearning)} href="/ess/learning" />
          {data.metrics.directReports > 0
            ? <PortalMetric icon={Users} label="Manager approvals" value={String(data.metrics.directReports)} href="/ess/team" />
            : <PortalMetric icon={FileCheck2} label="Latest payroll" value={data.payslips.length ? 'Available' : 'Not published'} href="/ess/payslips" />}
        </div>
        <section className="border-t border-border/60 px-4 py-4 sm:px-5" aria-labelledby="employee-services-title">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div><h2 id="employee-services-title" className="text-sm font-semibold">Employee services</h2><p className="mt-0.5 text-xs text-muted-foreground">Complete employee-owned journeys without entering HR or finance workspaces.</p></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceLink icon={FileCheck2} label="My requests" description={requestActions ? `${requestActions} need your action` : 'Approvals and revisions'} href="/ess/requests" />
            <ServiceLink icon={UserPlus} label="My onboarding" description={`${data.metrics.latestOnboardingProgress}% complete`} href="/ess/onboarding" />
            <ServiceLink icon={FileCheck2} label="My benefits" description="Coverage and applications" href="/ess/benefits" />
            <ServiceLink icon={Banknote} label="Expenses" description="Claims and reimbursement" href="/ess/expenses" />
            <ServiceLink icon={FileCheck2} label="Payslips" description="Published payroll documents" href="/ess/payslips" />
            <ServiceLink icon={GraduationCap} label="Learning" description="Courses, paths, and credentials" href="/ess/learning" />
            <ServiceLink icon={Target} label="Surveys" description="Required and optional responses" href="/ess/surveys" />
          </div>
        </section>
        <RoleWorkspaceLinks user={session?.user} directReports={data.metrics.directReports} />
        <div className="border-t border-border/60 p-4 sm:p-5">
          <div className="relative isolate overflow-hidden rounded-lg border border-primary/15 bg-primary/5 px-5 py-5 text-foreground sm:flex sm:items-center sm:justify-between sm:px-6">
            <div aria-hidden className="absolute -right-10 -top-16 -z-10 h-40 w-40 rounded-full border-[28px] border-primary/10" />
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <UserPlus className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Grow the team</p>
                <h2 className="mt-1 text-base font-semibold">Know someone who would thrive here?</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Refer a friend for an open role and follow their progress through the hiring journey.</p>
              </div>
            </div>
            <Button type="button" onClick={() => setReferralUploadOpen(true)} className="mt-4 min-h-11 w-full sm:ml-6 sm:mt-0 sm:w-auto">
              Friend referrals<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <BulkUploadCVsModal
        isOpen={referralUploadOpen}
        onOpenChange={setReferralUploadOpen}
        initialSourceName="Employee Referral"
        lockSource
      />
    </main>
  );
}

function ServiceLink({ icon: Icon, label, description, href }: { icon: React.ElementType; label: string; description: string; href: string }) {
  return <Link href={href} className="group flex min-h-16 items-center gap-3 rounded-lg border border-border px-3 py-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block truncate text-xs text-muted-foreground">{description}</span></span><ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>;
}

function RoleWorkspaceLinks({ user, directReports }: { user?: Parameters<typeof hasAnyPermission>[0]; directReports: number }) {
  const links = [
    { label: 'Manager workspace', href: '/ess/team', icon: Users, show: directReports > 0 || user?.role === 'Hiring Manager' || hasAnyPermission(user, ['HR_WORKFORCE_VIEW', 'HR_WORKFORCE_MANAGE']) },
    { label: 'People operations', href: '/people', icon: Users, show: hasAnyPermission(user, ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE']) },
    { label: 'Recruitment workspace', href: '/applicants', icon: BriefcaseBusiness, show: hasAnyPermission(user, ['applicantS_VIEW', 'POSITIONS_VIEW']) },
    { label: 'Payroll workspace', href: '/payroll', icon: Banknote, show: hasAnyPermission(user, ['HR_PAYROLL_VIEW', 'HR_PAYROLL_MANAGE']) },
  ].filter(link => link.show);

  if (links.length === 0) return null;
  return (
    <section className="border-t border-border/60 px-4 py-4 sm:px-5" aria-labelledby="role-workspaces-title">
      <h2 id="role-workspaces-title" className="mb-3 text-sm font-semibold">Your role workspaces</h2>
      <div className="flex flex-wrap gap-2">
        {links.map(({ label, href, icon: Icon }) => <Button key={href} asChild variant="outline" className="min-h-11"><Link href={href}><Icon className="mr-2 h-4 w-4" />{label}</Link></Button>)}
      </div>
    </section>
  );
}

function PortalMetric({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string; href: string }) {
  return (
    <Link href={href} className="group flex min-h-24 items-center gap-3 px-4 py-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
