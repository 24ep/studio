"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BarChart3, ClipboardList, FileUp, Megaphone, Settings2, Users, Wrench, MoreHorizontal, Copy, Eye, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurveyStudioTab } from "./SurveyStudioTab";
import { SurveyAudienceTab } from "./SurveyAudienceTab";
import { SurveyReportTab } from "./SurveyReportTab";
import { SurveyTransferTab } from "./SurveyTransferTab";
import { SurveyDistributionTab, SurveyResponsesTab, SurveySettingsTab } from "./SurveyOperationsTabs";
import type { SurveyDetail, SurveyOperations } from "./survey-workspace-types";

const tabs = [
  ["studio", "Studio", Wrench], ["audience", "Audience", Users], ["distribution", "Distribution", Megaphone],
  ["responses", "Responses", ClipboardList], ["reports", "Reports", BarChart3], ["transfer", "Import & Export", FileUp], ["settings", "Settings", Settings2],
] as const;

export function SurveyDetailWorkspace() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [survey, setSurvey] = React.useState<SurveyDetail | null>(null);
  const [operations, setOperations] = React.useState<SurveyOperations | null>(null);
  const [loading, setLoading] = React.useState(true);
  const activeTab = searchParams.get("tab") || "studio";

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [surveyResponse, operationsResponse] = await Promise.all([fetch(`/api/surveys/${surveyId}`, { cache: "no-store" }), fetch(`/api/surveys/${surveyId}/operations`, { cache: "no-store" })]);
      const surveyBody = await surveyResponse.json();
      const operationsBody = await operationsResponse.json();
      if (!surveyResponse.ok) throw new Error(surveyBody.message || "Unable to load survey.");
      setSurvey(surveyBody.survey);
      if (operationsResponse.ok) setOperations(operationsBody);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load survey."); }
    finally { setLoading(false); }
  }, [surveyId]);
  React.useEffect(() => { void load(); }, [load]);

  async function duplicate() {
    const response = await fetch(`/api/surveys/${surveyId}/duplicate`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Unable to duplicate survey.");
    toast.success("Survey duplicated"); router.push(`/workforce/engagement/${body.id}`);
  }

  if (loading) return <main className="grid min-h-[70vh] place-items-center"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Opening survey studio…</div></main>;
  if (!survey) return <main className="p-8"><p>Survey not found.</p></main>;

  return (
    <main className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-start justify-between gap-4">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2"><Link href="/workforce/engagement"><ArrowLeft className="mr-1.5 h-4 w-4" />All surveys</Link></Button>
            <div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-bold tracking-tight">{survey.title}</h1><Badge variant="outline" className="capitalize">{survey.status.replaceAll("_", " ")}</Badge><Badge variant="secondary" className="capitalize">{survey.privacyMode}</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">Version {survey.version} · {survey.questions.length} questions · Updated {new Date(survey.updatedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline"><Link href={`/survey/${survey.id}/respond`}><Eye className="mr-2 h-4 w-4" />Preview</Link></Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="More survey actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => void duplicate()}><Copy className="mr-2 h-4 w-4" />Duplicate survey</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </div>
        </div>
      </header>
      <Tabs value={activeTab} onValueChange={value => router.replace(`/workforce/engagement/${surveyId}?tab=${value}`)}>
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6"><TabsList className="mx-auto flex h-auto max-w-[1600px] justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0">{tabs.map(([value,label,Icon]) => <TabsTrigger key={value} value={value} className="min-h-12 shrink-0 rounded-none px-3 decoration-2 underline-offset-8 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:underline data-[state=active]:decoration-primary data-[state=active]:shadow-none"><Icon className="mr-2 h-4 w-4" />{label}</TabsTrigger>)}</TabsList></div>
        <div className={activeTab === "transfer" ? "w-full" : "mx-auto max-w-[1600px] p-4 sm:p-6"}>
          <TabsContent value="studio" className="mt-0"><SurveyStudioTab survey={survey} onSaved={load} /></TabsContent>
          <TabsContent value="audience" className="mt-0"><SurveyAudienceTab survey={survey} onSaved={load} /></TabsContent>
          <TabsContent value="distribution" className="mt-0"><SurveyDistributionTab survey={survey} operations={operations} onChanged={load} /></TabsContent>
          <TabsContent value="responses" className="mt-0"><SurveyResponsesTab survey={survey} operations={operations} /></TabsContent>
          <TabsContent value="reports" className="mt-0"><SurveyReportTab survey={survey} /></TabsContent>
          <TabsContent value="transfer" className="mt-0"><SurveyTransferTab survey={survey} onImported={load} /></TabsContent>
          <TabsContent value="settings" className="mt-0"><SurveySettingsTab survey={survey} operations={operations} onChanged={load} /></TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
