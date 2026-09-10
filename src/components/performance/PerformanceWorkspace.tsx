"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Award,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Users,
  WifiOff,
} from "lucide-react";

import { HrisWorkspaceHeader } from "@/components/hris/HrisWorkspacePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PerformanceWorkspaceData } from "@/lib/performance/performance-contracts";
import {
  PerformanceActionSheet,
  type PerformanceComposerMode,
} from "./PerformanceActionSheet";
import { PerformanceOverview } from "./PerformanceOverview";
import { PerformanceTeamMemberSidebar } from "./PerformanceTeamMemberSidebar";
import {
  CheckInsView,
  CompetenciesView,
  DevelopmentView,
  FeedbackView,
  InsightsView,
  TeamPerformanceView,
} from "./PerformanceViews";
import { PerformanceLoadingState, WorkspaceError } from "./performance-ui";

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "check-ins", label: "Check-ins", icon: CalendarClock },
  { value: "feedback", label: "Feedback", icon: MessageSquareText },
  { value: "competencies", label: "Competencies", icon: ClipboardCheck },
  { value: "development", label: "Development Plan", icon: BookOpenCheck },
  { value: "team", label: "Team Performance", icon: Users },
  { value: "insights", label: "Insights", icon: BarChart3 },
] as const;

async function readMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;
  return payload?.message || fallback;
}

export function PerformanceWorkspace() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedEmployeeId = searchParams.get("employeeId");
  const [data, setData] = React.useState<PerformanceWorkspaceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [backgroundLoading, setBackgroundLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState(
    requestedTab && tabs.some((tab) => tab.value === requestedTab)
      ? requestedTab
      : "overview",
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<
    string | null
  >(null);
  const [composerMode, setComposerMode] =
    React.useState<PerformanceComposerMode | null>(null);
  const [composerRecord, setComposerRecord] = React.useState<Record<
    string,
    unknown
  > | null>(null);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const load = React.useCallback(
    async (employeeId?: string | null, background = false) => {
      background ? setBackgroundLoading(true) : setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (employeeId) params.set("employeeId", employeeId);
        const response = await fetch(
          `/api/performance${params.size ? `?${params}` : ""}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );
        if (!response.ok)
          throw new Error(
            await readMessage(response, "Unable to load Performance."),
          );
        const payload = (await response.json()) as {
          data: PerformanceWorkspaceData;
        };
        setData(payload.data);
        setSelectedEmployeeId(payload.data.selectedEmployee?.id || null);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to load Performance.";
        setError(message);
        if (!background) setData(null);
      } finally {
        setLoading(false);
        setBackgroundLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void load(requestedEmployeeId);
  }, [load, requestedEmployeeId]);

  React.useEffect(() => {
    if (data && !data.permissions.canViewTeam && activeTab === "team") {
      setActiveTab("overview");
    }
  }, [activeTab, data]);

  const selectEmployee = React.useCallback(
    (employeeId: string) => {
      setSelectedEmployeeId(employeeId);
      void load(employeeId, true);
    },
    [load],
  );

  const submitAction = React.useCallback(
    async (body: Record<string, unknown>, successMessage: string) => {
      if (saving || offline) return false;
      setSaving(true);
      setError(null);
      try {
        const response = await fetch("/api/performance", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok)
          throw new Error(
            await readMessage(
              response,
              "Unable to save the performance action.",
            ),
          );
        toast.success(successMessage);
        await load(selectedEmployeeId, true);
        return true;
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to save the performance action.";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load, offline, saving, selectedEmployeeId],
  );

  const openComposer = (
    mode: PerformanceComposerMode,
    record?: Record<string, unknown>,
  ) => {
    setComposerRecord(record || null);
    setComposerMode(mode);
  };

  if (loading) return <PerformanceLoadingState />;
  if (!data) {
    return (
      <main className="min-h-full bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl">
          <WorkspaceError
            message={error || "Performance is currently unavailable."}
            onRetry={() => void load(null)}
          />
        </div>
      </main>
    );
  }

  const viewData = data;
  const visibleTabs = viewData.permissions.canViewTeam
    ? tabs
    : tabs.filter((tab) => tab.value !== "team");

  return (
    <main className="min-h-full w-full bg-background text-foreground">
      <div className="w-full">
        {offline ? (
          <div
            role="status"
            className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <WifiOff className="h-4 w-4" aria-hidden />
            You are offline. Existing data remains visible, but performance
            actions are paused.
          </div>
        ) : null}
        {error ? (
          <WorkspaceError
            message={error}
            onRetry={() => void load(selectedEmployeeId, true)}
          />
        ) : null}
        {viewData.meta.partial ? (
          <div
            role="status"
            className="border-b border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200"
          >
            Some sources are not available yet:{" "}
            {viewData.meta.unavailableSources.join(", ")}. Available records are
            shown without fabricated substitutes.
          </div>
        ) : null}

        <div className="grid min-h-full items-stretch border-y border-border lg:grid-cols-[280px_minmax(0,1fr)]">
          <PerformanceTeamMemberSidebar
            employees={viewData.employees}
            selectedEmployeeId={selectedEmployeeId}
            loading={backgroundLoading}
            onSelectEmployee={selectEmployee}
          />

          <div className="min-w-0 lg:border-l lg:border-border">
            <div className="relative overflow-hidden border-b border-border bg-background">
              <div className="px-5 pb-2 pt-5 sm:px-6">
                <HrisWorkspaceHeader
                  eyebrow="Workforce · Performance"
                  title="Team & Performance Management"
                  description="Manage employee performance, continuous conversations, development, and team insights in one place."
                  action={
                    <>
                      <Badge
                        variant="outline"
                        className="min-h-7 rounded-full capitalize"
                      >
                        {viewData.permissions.role}
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => openComposer("feedback")}
                      >
                        <MessageSquareText className="mr-2 h-4 w-4" />
                        Feedback
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => openComposer("recognition")}
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Recognize
                      </Button>
                      <Button
                        type="button"
                        className="min-h-11 bg-[#263f73] text-white hover:bg-[#1f345f]"
                        onClick={() => openComposer("check-in")}
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Schedule check-in
                      </Button>
                    </>
                  }
                />
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-0"
            >
              <nav
                aria-label="Performance sections"
                className="-mt-px overflow-x-auto border-b border-border bg-background px-5"
              >
                <TabsList className="h-auto min-w-max justify-start gap-5 bg-transparent p-0">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="group relative min-h-12 gap-2 rounded-none px-1 text-xs font-semibold text-slate-500 shadow-none transition-colors hover:text-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-[#263f73] data-[state=active]:shadow-none dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-blue-200"
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        <span>{tab.label}</span>
                        {tab.value === "overview" && viewData.alerts.length ? (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-100 px-1 text-[10px] font-bold text-amber-800">
                            {viewData.alerts.length}
                          </span>
                        ) : null}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </nav>

              <TabsContent value="overview" className="mt-0">
                <PerformanceOverview
                  data={viewData}
                  onAction={(mode) => openComposer(mode)}
                  onTabChange={setActiveTab}
                />
              </TabsContent>
              <TabsContent value="check-ins" className="mt-0">
                <CheckInsView
                  data={viewData}
                  onAction={(mode) => openComposer(mode)}
                  onComplete={(row) => openComposer("complete-check-in", row)}
                />
              </TabsContent>
              <TabsContent value="feedback" className="mt-0">
                <FeedbackView
                  data={viewData}
                  onAction={(mode) => openComposer(mode)}
                />
              </TabsContent>
              <TabsContent value="competencies" className="mt-0">
                <CompetenciesView
                  data={viewData}
                  onAction={(mode) => openComposer(mode)}
                />
              </TabsContent>
              <TabsContent value="development" className="mt-0">
                <DevelopmentView
                  data={viewData}
                  onAction={(mode) => openComposer(mode)}
                  onUpdate={(row) => openComposer("update-development", row)}
                />
              </TabsContent>
              <TabsContent value="team" className="mt-0">
                <TeamPerformanceView
                  data={viewData}
                  onSelectEmployee={selectEmployee}
                />
              </TabsContent>
              <TabsContent value="insights" className="mt-0">
                <InsightsView data={viewData} />
              </TabsContent>
            </Tabs>

            <footer className="flex flex-col gap-2 border-t border-border px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Access follows company, hierarchy, record, field, and
                review-stage permissions.
              </p>
              <p>
                Updated{" "}
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(viewData.meta.generatedAt))}
              </p>
            </footer>
          </div>
        </div>
      </div>

      <PerformanceActionSheet
        mode={composerMode}
        record={composerRecord}
        data={viewData}
        saving={saving}
        onClose={() => {
          setComposerMode(null);
          setComposerRecord(null);
        }}
        onSubmit={submitAction}
      />
    </main>
  );
}
