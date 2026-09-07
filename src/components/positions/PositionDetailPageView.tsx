"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  MapPinIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as SolidCheckCircleIcon } from "@heroicons/react/20/solid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Applicant, Position } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PositionDetailDrawerActivePanel } from "./PositionDetailDrawerContentParts";
import type { PositionDetailDrawerContentProps } from "./PositionDetailDrawerContentTypes";
import {
  EditField,
  EmptyOverviewValue,
  LifecycleStep,
  ListEditor,
  NumberedOutcome,
  OverviewSection,
  PositionReadinessSidebar,
  SectionEditButton,
  SkillGroup,
  formatDate,
  plainText,
} from "./PositionDetailPageParts";
import type { PositionDetailTabId } from "./PositionDetailTabsNav";
import type { PositionDetailDrawerController } from "./hooks/use-position-detail-drawer-controller";

interface PositionDetailPageViewProps {
  controller: PositionDetailDrawerController;
  contentProps: PositionDetailDrawerContentProps;
}

const pageTabs: Array<{ id: PositionDetailTabId; label: string }> = [
  { id: "details", label: "Overview" },
  { id: "job-description", label: "Job description" },
  { id: "criteria", label: "Match criteria" },
  { id: "Applicants", label: "Applicants" },
  { id: "hiring-managers", label: "Hiring team" },
  { id: "evaluation", label: "Evaluation" },
  { id: "headcount", label: "Headcount" },
];

function getDaysOpen(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86_400_000));
}

function getCustomText(position: Position, candidates: string[], fallback: string) {
  const values = position.customAttributes || position.custom_attributes || position.customFields || {};
  const entries = Object.entries(values);
  for (const candidate of candidates) {
    const entry = entries.find(([key]) => key.toLowerCase().replace(/[_\s-]/g, "") === candidate);
    if (entry && (typeof entry[1] === "string" || typeof entry[1] === "number")) {
      return String(entry[1]);
    }
  }
  return fallback;
}

function getCustomStringList(position: Position, key: string, fallback: string[]) {
  const values = position.customAttributes || position.custom_attributes || position.customFields || {};
  const value = values[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : fallback;
}

function getStageName(applicant: Applicant, stageNames: Record<string, string>) {
  return (applicant.recruitmentStage?.name || applicant.status || stageNames[applicant.statusId] || "").toLowerCase();
}

function countStage(applicants: Applicant[], stageNames: Record<string, string>, terms: string[]) {
  return applicants.filter((applicant) => {
    const name = getStageName(applicant, stageNames);
    return terms.some((term) => name.includes(term));
  }).length;
}

function PositionPageLoading() {
  return (
    <div className="h-full bg-background p-8" aria-label="Loading position details">
      <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      <div className="mt-5 h-8 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-10 h-px bg-border" />
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-5">
          <div className="h-32 animate-pulse rounded-md bg-muted" />
          <div className="h-48 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-80 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export function PositionDetailPageView({ controller, contentProps }: PositionDetailPageViewProps) {
  const router = useRouter();
  const { baseData, editActions } = controller;
  const position = baseData.position;

  if (!controller.hasMounted || baseData.isLoading) return <PositionPageLoading />;

  if (baseData.fetchError || !position) {
    return (
      <div className="grid h-full place-items-center bg-background p-8 text-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Position could not be loaded</h1>
          <p className="mt-2 text-sm text-muted-foreground">{baseData.fetchError || "The position is unavailable."}</p>
          <Button className="mt-5" onClick={() => router.push("/positions")}>Back to Job Openings</Button>
        </div>
      </div>
    );
  }

  const applicants = contentProps.appliedApplicants;
  const shortlisted = position.pipelineStats?.shortlisted ?? countStage(applicants, contentProps.stageNames, ["shortlist"]);
  const interviews = position.pipelineStats?.interviews ?? countStage(applicants, contentProps.stageNames, ["interview"]);
  const offers = position.pipelineStats?.offers ?? countStage(applicants, contentProps.stageNames, ["offer"]);
  const applicantTotal = position.pipelineStats?.total ?? contentProps.appliedApplicantsCount;
  const applicantTabTotal = contentProps.allApplicantsTotal;
  const roleText = plainText(position.description);
  const criteriaText = plainText(position.matchCriteria);
  const location = getCustomText(position, ["location", "worklocation", "office"], "Not provided");
  const employmentType = getCustomText(position, ["employmenttype", "jobtype", "positiontype"], "Not provided");
  const workModel = getCustomText(position, ["workmodel", "workingmodel"], "Not provided");
  const salary = getCustomText(position, ["salaryrange", "salary", "compensation"], "Not provided");
  const targetStart = getCustomText(position, ["targetstartdate", "startdate"], "Not set");
  const hiringManagerName = getCustomText(position, ["hiringmanagername", "hiringmanager"], "Not assigned");
  const readinessChecks = [roleText, criteriaText, position.recruiterId, baseData.headcountsTotal > 0].filter(Boolean).length;
  const readiness = Math.round((readinessChecks / 4) * 100);
  const readinessIssue = !roleText
    ? "Job description is incomplete"
    : !criteriaText
    ? "Match criteria is incomplete"
    : !position.recruiterId
      ? "Recruiter has not been assigned"
      : baseData.headcountsTotal === 0
        ? "Headcount plan is missing"
        : "Core position setup is complete";
  const summary = roleText || "No job description has been added to this position.";
  const successOutcomes = getCustomStringList(position, "successOutcomes", []);
  const coreResponsibilities = getCustomStringList(position, "coreResponsibilities", []);
  const criteriaPreview = getCustomStringList(position, "matchCriteriaPreview", []);
  const editableRequiredSkills = getCustomStringList(position, "requiredSkills", []);
  const editablePreferredSkills = getCustomStringList(position, "preferredSkills", []);
  const isEditingOverview = contentProps.activeTab === "details" && contentProps.isEditMode;
  const startEditingAll = () => {
    contentProps.onEdit();
    contentProps.form.setValue("location", location);
    contentProps.form.setValue("employmentType", employmentType);
    contentProps.form.setValue("workModel", workModel);
    contentProps.form.setValue("salaryRange", salary);
    contentProps.form.setValue("targetStartDate", targetStart);
    contentProps.form.setValue("hiringManagerName", hiringManagerName);
    contentProps.form.setValue("successOutcomes", successOutcomes);
    contentProps.form.setValue("coreResponsibilities", coreResponsibilities);
    contentProps.form.setValue("requiredSkills", editableRequiredSkills);
    contentProps.form.setValue("preferredSkills", editablePreferredSkills);
    contentProps.form.setValue("matchCriteriaPreview", criteriaPreview);
  };

  return (
    <div
      className="min-h-full bg-background font-[var(--font-dm-sans)] text-foreground lg:h-full lg:min-h-0 lg:overflow-hidden"
      data-testid="position-detail-page"
      data-theme="position-detail-page"
    >
      <div className="grid min-h-full lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_350px]">
        <div className="flex min-h-0 flex-col">
        <header className="shrink-0 border-b border-[#dfe5ee] px-5 pb-0 pt-4 sm:px-8">
          <button
            type="button"
            onClick={() => router.push("/positions")}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1769e8] hover:underline"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Job Openings
          </button>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              {isEditingOverview ? (
                <div className="grid max-w-[760px] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <EditField label="Position title" className="sm:col-span-2">
                    <Input {...contentProps.form.register("title")} className="h-9 bg-white text-sm font-semibold" />
                  </EditField>
                  <EditField label="Status">
                    <select {...contentProps.form.register("isOpen", { setValueAs: (value) => value === true || value === "true" })} className="h-9 w-full rounded-md border border-[#d8e0eb] bg-white px-3 text-sm">
                      <option value="true">Open</option>
                      <option value="false">Closed</option>
                    </select>
                  </EditField>
                  <EditField label="Department"><Input {...contentProps.form.register("department")} className="h-9 bg-white text-sm" /></EditField>
                  <EditField label="Location"><Input {...contentProps.form.register("location")} className="h-9 bg-white text-sm" /></EditField>
                  <EditField label="Employment type"><Input {...contentProps.form.register("employmentType")} className="h-9 bg-white text-sm" /></EditField>
                  <EditField label="Work model"><Input {...contentProps.form.register("workModel")} className="h-9 bg-white text-sm" /></EditField>
                  <EditField label="Position level"><Input {...contentProps.form.register("positionLevel")} className="h-9 bg-white text-sm" /></EditField>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[26px] font-bold leading-8 tracking-[-0.02em] text-[#12213d]">{position.title}</h1>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                      position.isOpen ? "bg-[#e5f8f4] text-[#008f83]" : "bg-slate-100 text-slate-600",
                    )}>
                      <SolidCheckCircleIcon className={cn("h-3.5 w-3.5", position.isOpen ? "text-[#10b5a5]" : "text-slate-400")} />
                      {position.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#52617a]">
                    <span className="inline-flex items-center gap-2"><BriefcaseIcon className="h-4 w-4" />{position.department || "Department not provided"}</span>
                    <span className="inline-flex items-center gap-2"><MapPinIcon className="h-4 w-4" />{location}</span>
                    <span className="inline-flex items-center gap-2"><ClockIcon className="h-4 w-4" />{employmentType}</span>
                    <span className="inline-flex items-center gap-2"><BuildingOffice2Icon className="h-4 w-4" />{workModel}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditingOverview && <Button variant="outline" className="h-9 bg-white px-4 text-[13px]" onClick={contentProps.onCancel}>Cancel</Button>}
              <Button
                className="h-9 bg-[#1769e8] px-5 text-[13px] font-semibold hover:bg-[#1058c7]"
                disabled={editActions.isSaving}
                onClick={isEditingOverview ? contentProps.form.handleSubmit(contentProps.onSave) : startEditingAll}
              >
                {editActions.isSaving ? "Saving..." : isEditingOverview ? "Save changes" : "Edit all sections"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 gap-2 border-[#d8e0eb] bg-white px-3 text-[13px] !text-[#12213d] hover:bg-[#f5f7fa]">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                    Actions
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white text-[#12213d]">
                  <DropdownMenuItem onSelect={startEditingAll}>
                    <PencilSquareIcon className="mr-2 h-4 w-4" />Edit position
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => contentProps.onTabChange("existing-employees")}>Existing employees</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/positions")}>Return to Job Openings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto border-y border-[#dfe5ed]">
            <div className="grid min-w-[760px] grid-cols-[1.18fr_1.22fr_1fr_0.65fr] py-[19px]">
              <LifecycleStep icon="complete" label="Draft complete" value={formatDate(position.createdAt)} connector />
              <LifecycleStep icon="complete" label="Approval approved" value={formatDate(position.updatedAt)} connector />
              <LifecycleStep icon="active" label="Recruiting" value={position.isOpen ? "Active" : "Closed"} connector />
              <LifecycleStep
                icon="date"
                label={`${getDaysOpen(position.createdAt)} days open`}
                value={`Since ${formatDate(position.createdAt)}`}
              />
            </div>
          </div>

          <nav aria-label="Position detail sections" className="flex min-w-0 gap-7 overflow-x-auto">
            {pageTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => contentProps.onTabChange(tab.id)}
                className={cn(
                  "relative h-12 shrink-0 text-[13px] font-medium text-[#52617a]",
                  contentProps.activeTab === tab.id && "font-semibold text-[#1769e8] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#1769e8]",
                )}
              >
                {tab.label}
                {tab.id === "Applicants" && <span className="ml-1.5 rounded-full bg-[#eef1f6] px-2 py-0.5 text-[11px] text-[#46536a]">{applicantTabTotal}</span>}
              </button>
            ))}
          </nav>
        </header>

        <div className="min-h-0 flex-1">
          {contentProps.activeTab === "details" ? (
              <main className="min-h-full min-w-0 px-5 py-5 sm:px-8 lg:h-full lg:min-h-0 lg:overflow-y-auto">
                <OverviewSection title="Role summary" action={!isEditingOverview ? <SectionEditButton onClick={startEditingAll} /> : undefined}>
                  {isEditingOverview ? (
                    <Textarea {...contentProps.form.register("description")} rows={5} className="max-w-[820px] resize-y bg-white text-[13px] leading-5" />
                  ) : <p className="max-w-[760px] text-[13px] leading-[1.55] text-[#33425c]">{summary}</p>}
                </OverviewSection>

                <OverviewSection title="What success looks like (first 90 days)" action={!isEditingOverview ? <SectionEditButton onClick={startEditingAll} /> : undefined}>
                  {isEditingOverview ? (
                    <ListEditor
                      label="One outcome per line — use Title: description"
                      value={contentProps.form.watch("successOutcomes")}
                      onChange={(items) => contentProps.form.setValue("successOutcomes", items, { shouldDirty: true })}
                    />
                  ) : successOutcomes.length > 0 ? successOutcomes.map((outcome, index) => {
                    const [title, ...text] = outcome.split(":");
                    return <NumberedOutcome key={`${outcome}-${index}`} number={String(index + 1)} title={title.trim()} text={text.join(":").trim()} />;
                  }) : <EmptyOverviewValue text="No success outcomes have been configured." />}
                </OverviewSection>

                <OverviewSection title="Core responsibilities" action={!isEditingOverview ? <SectionEditButton onClick={startEditingAll} /> : undefined}>
                  {isEditingOverview ? (
                    <ListEditor
                      label="One responsibility per line"
                      value={contentProps.form.watch("coreResponsibilities")}
                      onChange={(items) => contentProps.form.setValue("coreResponsibilities", items, { shouldDirty: true })}
                    />
                  ) : coreResponsibilities.length > 0
                    ? <ul className="space-y-1 pl-5 text-[13px] leading-5 text-[#33425c] marker:text-[#1769e8]">{coreResponsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
                    : <EmptyOverviewValue text="No core responsibilities have been configured." />}
                </OverviewSection>

                <div className="grid gap-8 border-t border-[#e4e9f0] py-5 md:grid-cols-2">
                  <SkillGroup
                    title="Required skills"
                    skills={isEditingOverview ? contentProps.form.watch("requiredSkills") : editableRequiredSkills}
                    isEditing={isEditingOverview}
                    onEdit={startEditingAll}
                    onChange={(items) => contentProps.form.setValue("requiredSkills", items, { shouldDirty: true })}
                  />
                  <SkillGroup
                    title="Preferred skills"
                    skills={isEditingOverview ? contentProps.form.watch("preferredSkills") : editablePreferredSkills}
                    isEditing={isEditingOverview}
                    onEdit={startEditingAll}
                    onChange={(items) => contentProps.form.setValue("preferredSkills", items, { shouldDirty: true })}
                  />
                </div>

                <OverviewSection title="Match criteria" action={!isEditingOverview ? <SectionEditButton onClick={startEditingAll} /> : undefined}>
                  {isEditingOverview ? (
                    <ListEditor
                      label="One criterion per line — use Criterion | Weight"
                      value={contentProps.form.watch("matchCriteriaPreview")}
                      onChange={(items) => contentProps.form.setValue("matchCriteriaPreview", items, { shouldDirty: true })}
                    />
                  ) : criteriaPreview.length > 0 ? <div className="max-w-[720px] text-[12px] text-[#33425c]">
                    {criteriaPreview.map((row, index) => {
                      const [criterion, weight = "0"] = row.split("|");
                      return (
                      <div key={`${criterion}-${index}`} className="grid grid-cols-[minmax(0,1fr)_64px] border-b border-[#e4e9f0] py-2 first:border-t">
                        <span>{criterion.trim()}</span><span className="text-right font-semibold">{weight.trim().replace(/%$/, "")}%</span>
                      </div>
                    )})}
                  </div> : <p className="max-w-[760px] whitespace-pre-wrap text-[13px] leading-[1.55] text-[#33425c]">{criteriaText || "No match criteria have been configured."}</p>}
                </OverviewSection>

                {isEditingOverview && (
                  <OverviewSection title="Hiring details">
                    <div className="grid max-w-[820px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <EditField label="Salary range"><Input {...contentProps.form.register("salaryRange")} className="h-9 bg-white text-sm" /></EditField>
                      <EditField label="Target start"><Input {...contentProps.form.register("targetStartDate")} className="h-9 bg-white text-sm" /></EditField>
                      <EditField label="Hiring manager"><Input {...contentProps.form.register("hiringManagerName")} className="h-9 bg-white text-sm" /></EditField>
                    </div>
                  </OverviewSection>
                )}
              </main>
          ) : (
            <div className="flex h-full min-h-[640px] flex-col overflow-hidden bg-white">
              <PositionDetailDrawerActivePanel {...contentProps} />
            </div>
          )}
        </div>
        </div>
        <PositionReadinessSidebar
          applicantTotal={applicantTotal}
          criteriaText={criteriaText}
          headcountsTotal={baseData.headcountsTotal}
          hiringManagerName={hiringManagerName}
          interviews={interviews}
          offers={offers}
          position={position}
          readiness={readiness}
          readinessIssue={readinessIssue}
          salary={salary}
          shortlisted={shortlisted}
          targetStart={targetStart}
          onTabChange={contentProps.onTabChange}
        />
      </div>
    </div>
  );
}
