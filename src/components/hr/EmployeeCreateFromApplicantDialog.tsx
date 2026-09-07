"use client";

import * as React from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronUpDownIcon,
  DocumentTextIcon,
  UserIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { defaultDropdownOptions } from "@/lib/dropdown-option-catalog";
import { cn } from "@/lib/utils";
import { HrEmployeeSearchSelect } from "./HrEmployeeSearchSelect";
import { HrResourceSearchSelect } from "./HrResourceSearchSelect";
import {
  calculateDirectStepCompletion,
  directSteps,
  getApplicantInitials,
  hasRequiredDirectEmployeeDetails,
  HorizontalFieldRow,
  initialEmployeeDetails,
  structuredEmployeeFields,
  type CreationSource,
  type DirectStep,
} from "./employee-create-form-config";
import {
  createEmployeeDirect,
  createEmployeeFromSelectedApplicant,
  fetchEligibleEmployeeApplicants,
  type EligibleEmployeeApplicant,
} from "./employee-applicant-api";

interface EmployeeCreateFromApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
}

export function EmployeeCreateFromApplicantDialog({
  open,
  onOpenChange,
  onCreated,
}: EmployeeCreateFromApplicantDialogProps) {
  const employmentTypes = useDropdownOptions('employment_types', defaultDropdownOptions('employment_types'));
  const { error: toastError, success: toastSuccess } = useToast();
  const [creationSource, setCreationSource] = React.useState<CreationSource | null>(null);
  const [applicants, setApplicants] = React.useState<EligibleEmployeeApplicant[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = React.useState("");
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [activeDirectStep, setActiveDirectStep] = React.useState<DirectStep>("core");
  const [draftSavedAt, setDraftSavedAt] = React.useState<Date | null>(null);
  const [details, setDetails] = React.useState<Record<string, string>>(initialEmployeeDetails);
  const selectedApplicant = applicants.find(
    (applicant) => applicant.id === selectedApplicantId,
  );

  React.useEffect(() => {
    if (!open) return;
    setCreationSource(null);
    setSelectedApplicantId("");
    setDetails(initialEmployeeDetails());
    setLoadError(null);
    setApplicants([]);
    setActiveDirectStep("core");
    setDraftSavedAt(null);
  }, [open]);

  const completion = React.useMemo(
  () => calculateDirectStepCompletion(details),
  [details],
);
const directRequirementsMet = hasRequiredDirectEmployeeDetails(details);

  const chooseDirect = () => {
    setDetails({ ...initialEmployeeDetails(), employmentType: "", status: "" });
    setActiveDirectStep("core");
    setDraftSavedAt(null);
    setCreationSource("direct");
  };

  const goToNextDirectStep = () => {
    const index = directSteps.findIndex(step => step.id === activeDirectStep);
    if (index < directSteps.length - 1) setActiveDirectStep(directSteps[index + 1].id);
  };

  React.useEffect(() => {
    if (!open || creationSource !== "applicant") return;

    const controller = new AbortController();
    setLoadError(null);
    setIsLoading(true);

    void fetchEligibleEmployeeApplicants(controller.signal)
      .then(setApplicants)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setApplicants([]);
        setLoadError(
          error instanceof Error ? error.message : "Unable to load eligible applicants.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [creationSource, open]);

  const handleCreate = async () => {
    if (!creationSource || isCreating || (creationSource === "applicant" && !selectedApplicantId)) return;

    setIsCreating(true);
    try {
      const structuredValues = Object.fromEntries(structuredEmployeeFields.map(([key, label]) => {
        try {
          return [key, JSON.parse(details[key])];
        } catch {
          throw new Error(`${label} must contain valid JSON.`);
        }
      }));
      const emergencyContacts = details.emergencyName.trim() || details.emergencyPhone.trim()
        ? [{
            name: details.emergencyName.trim(),
            relationship: details.emergencyRelationship.trim(),
            phone: details.emergencyPhone.trim(),
          }]
        : [];
      const nullable = (key: string) => details[key]?.trim() || null;
      const optional = (key: string) => details[key]?.trim() || undefined;
      const employeeAttributes = {
        phone: nullable("phone"),
        jobTitle: nullable("jobTitle"),
        employmentType: details.employmentType,
        status: details.status,
        hireDate: nullable("hireDate"),
        location: nullable("location"),
        preferredName: nullable("preferredName"),
        departmentId: optional("departmentId"),
        managerId: optional("managerId"),
        positionId: optional("positionId"),
        companyId: optional("companyId"),
        clientId: details.employmentType === "subcontract" ? nullable("clientId") : null,
        endDate: nullable("endDate"),
        contractNoticeDays: Number(details.contractNoticeDays || 30),
        probationPeriodDays: details.probationPeriodDays === "" ? null : Number(details.probationPeriodDays),
        probationEvaluationFrequencyDays: details.probationEvaluationFrequencyDays === "" ? null : Number(details.probationEvaluationFrequencyDays),
        legalName: nullable("legalName"),
        businessUnit: nullable("businessUnit"),
        workPhone: nullable("workPhone"),
        profilePhotoUrl: nullable("profilePhotoUrl"),
        profileCompletion: Number(details.profileCompletion || 0),
        emergencyContacts,
        ...structuredValues,
      };
      const result = creationSource === "applicant"
        ? await createEmployeeFromSelectedApplicant(selectedApplicantId, employeeAttributes)
        : await createEmployeeDirect({
            employeeNumber: details.employeeNumber.trim(),
            firstName: details.firstName.trim(),
            lastName: details.lastName.trim(),
            email: details.email.trim(),
            ...employeeAttributes,
          });
      await onCreated();
      toastSuccess(
        result.created === false
          ? result.message || "Applicant is already linked to an employee"
          : result.employee?.employeeNumber
          ? result.account?.loginEmail
            ? `Employee ${result.employee.employeeNumber} created with login ${result.account.loginEmail}`
            : `Employee ${result.employee.employeeNumber} created`
          : result.message || "Employee created",
      );
      if (result.account?.setupEmail?.sent === false) {
        toastError(
          `Account created, but the password setup email was not sent: ${result.account.setupEmail.error || "email delivery failed"}`,
        );
      }
      onOpenChange(false);
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Unable to create employee.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex max-h-[90vh] flex-col overflow-hidden rounded-[8px]", creationSource ? "max-w-4xl" : "max-w-2xl")}>
        <DialogHeader>
          {creationSource === "applicant" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-1 h-8 w-fit gap-1.5 px-2 text-slate-600"
              onClick={() => {
                setCreationSource(null);
                setSelectedApplicantId("");
                setLoadError(null);
              }}
              disabled={isCreating}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Change creation method
            </Button>
          )}
          <DialogTitle>Create new employee</DialogTitle>
          <DialogDescription>
            {creationSource === "direct"
              ? "Add a standalone employee record. You can link a platform user afterward."
              : creationSource === "applicant"
                ? "Choose an applicant to carry their recruitment details into the employee record."
                : "Choose how you want to start this employee record."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {!creationSource && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={chooseDirect}
                className="group flex min-h-48 flex-col items-start rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                  <UserIcon className="h-5 w-5" />
                </span>
                <span className="mt-5 text-base font-semibold text-slate-950">Create directly</span>
                <span className="mt-1 text-sm leading-5 text-slate-600">
                  Add a new employee without an applicant or recruitment record.
                </span>
                <span className="mt-auto pt-5 text-sm font-medium text-blue-700">Start employee details →</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationSource("applicant")}
                className="group flex min-h-48 flex-col items-start rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
                  <DocumentTextIcon className="h-5 w-5" />
                </span>
                <span className="mt-5 text-base font-semibold text-slate-950">Choose from applicant</span>
                <span className="mt-1 text-sm leading-5 text-slate-600">
                  Start from a hired applicant and carry their recruitment details forward.
                </span>
                <span className="mt-auto pt-5 text-sm font-medium text-blue-700">Select an applicant →</span>
              </button>
            </div>
          )}

          {creationSource === "applicant" && <div className="space-y-2">
            <Label>
              Applicant relation <span className="text-red-600">*</span>
            </Label>
            <Popover open={selectorOpen} onOpenChange={setSelectorOpen} modal>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={selectorOpen}
                  className="h-10 w-full justify-between px-3 font-normal"
                  disabled={isLoading}
                >
                  <span className={cn("truncate", !selectedApplicant && "text-muted-foreground")}>
                    {isLoading
                      ? "Loading eligible applicants..."
                      : selectedApplicant?.name || "Select an applicant"}
                  </span>
                  <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Search name, email, or position..." />
                  <CommandList>
                    <CommandEmpty>No eligible applicants found.</CommandEmpty>
                    <CommandGroup>
                      {applicants.map((applicant) => (
                        <CommandItem
                          key={applicant.id}
                          value={`${applicant.name} ${applicant.email} ${applicant.positionTitle || ""}`}
                          onSelect={() => {
                            setSelectedApplicantId(applicant.id);
                            const nameParts = applicant.name.trim().split(/\s+/);
                            setDetails(current => ({
                              ...current,
                              firstName: nameParts[0] || current.firstName,
                              lastName: nameParts.slice(1).join(" ") || current.lastName,
                              email: applicant.email || current.email,
                              phone: applicant.phone || current.phone,
                              jobTitle: applicant.positionTitle || current.jobTitle,
                            }));
                            setSelectorOpen(false);
                          }}
                          className="gap-3 py-2.5"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                            {getApplicantInitials(applicant.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{applicant.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {applicant.email}
                              {applicant.positionTitle ? ` - ${applicant.positionTitle}` : ""}
                            </span>
                          </span>
                          <CheckIcon
                            className={cn(
                              "h-4 w-4 text-blue-600",
                              selectedApplicantId === applicant.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {loadError && <p className="text-xs text-red-600">{loadError}</p>}
          </div>}

          {creationSource === "applicant" && selectedApplicant && (
            <div className="rounded-[6px] border border-blue-100 bg-blue-50/60 p-3">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {getApplicantInitials(selectedApplicant.name)}
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-slate-900">{selectedApplicant.name}</p>
                  <p className="truncate text-xs text-slate-600">{selectedApplicant.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedApplicant.positionTitle || "No position assigned"} - {selectedApplicant.statusName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {creationSource === "direct" && (
            <div className="grid min-h-[510px] border-t border-slate-200 pt-5 md:grid-cols-[230px_minmax(0,1fr)]">
              <nav aria-label="Employee creation progress" className="border-b border-slate-200 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-5">
                <ol className="grid grid-cols-5 gap-2 md:block md:space-y-0">
                  {directSteps.map((step, index) => {
                    const percent = completion[step.id];
                    const active = activeDirectStep === step.id;
                    return (
                      <li key={step.id} className="relative md:min-h-[92px]">
                        {index < directSteps.length - 1 && <span aria-hidden className="absolute left-7 top-14 hidden h-[38px] w-px bg-slate-200 md:block" />}
                        <button type="button" onClick={() => setActiveDirectStep(step.id)} className="group flex w-full flex-col items-center gap-2 text-center md:flex-row md:items-start md:text-left">
                          <span
                            role="img"
                            aria-label={`${step.label} ${percent}% complete`}
                            className="grid h-14 w-14 shrink-0 place-items-center rounded-full p-[3px] transition-transform group-hover:scale-[1.03]"
                            style={{ background: `conic-gradient(${active ? "#2563eb" : "#64748b"} ${percent * 3.6}deg, #e2e8f0 0deg)` }}
                          >
                            <span className={cn("grid h-full w-full place-items-center rounded-full bg-white text-xs font-bold", active ? "text-blue-700" : "text-slate-700")}>{percent}%</span>
                          </span>
                          <span className="hidden pt-1 md:block">
                            <span className={cn("block text-sm font-semibold", active ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-slate-200")}>{step.label}</span>
                            <span className="mt-0.5 block text-xs leading-4 text-slate-500 dark:text-slate-400">{step.description}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <section className="pt-5 md:pl-7 md:pt-0" aria-labelledby="direct-step-heading">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 id="direct-step-heading" className="text-lg font-semibold text-slate-950 dark:text-slate-100">{directSteps.find(step => step.id === activeDirectStep)?.label}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{directSteps.find(step => step.id === activeDirectStep)?.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Step {directSteps.findIndex(step => step.id === activeDirectStep) + 1} of 5</span>
                </div>

                {activeDirectStep === "core" && <div className="space-y-4">
                  <HorizontalFieldRow label="Profile photo" htmlFor="new-employee-profilePhotoUrl" hint="Optional image URL"><Input id="new-employee-profilePhotoUrl" type="url" value={details.profilePhotoUrl} onChange={event => setDetails(current => ({ ...current, profilePhotoUrl: event.target.value }))} /></HorizontalFieldRow>
                  {[["employeeNumber", "Employee number", "text"], ["firstName", "First name", "text"], ["lastName", "Last name", "text"], ["email", "Work email", "email"]].map(([key, label, type]) => <HorizontalFieldRow key={key} label={label} htmlFor={`new-employee-${key}`} required><Input id={`new-employee-${key}`} type={type} required value={details[key]} onChange={event => setDetails(current => ({ ...current, [key]: event.target.value }))} /></HorizontalFieldRow>)}
                  <HorizontalFieldRow label="Employment type" htmlFor="new-employee-type" required><select id="new-employee-type" required value={details.employmentType} onChange={event => setDetails(current => ({ ...current, employmentType: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select employment type</option>{employmentTypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></HorizontalFieldRow>
                  <HorizontalFieldRow label="Status" htmlFor="new-employee-status" required><select id="new-employee-status" required value={details.status} onChange={event => setDetails(current => ({ ...current, status: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select starting status</option>{['onboarding', 'probation', 'active', 'inactive'].map(value => <option key={value} value={value}>{value}</option>)}</select></HorizontalFieldRow>
                  <p className="border-t border-slate-200 pt-3 text-right text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">{6 - ["employeeNumber", "firstName", "lastName", "email", "employmentType", "status"].filter(key => details[key]?.trim()).length} required fields remaining</p>
                </div>}

                {activeDirectStep === "work" && <div className="space-y-4">
                  <HorizontalFieldRow label="Job title" htmlFor="new-employee-jobTitle"><Input id="new-employee-jobTitle" value={details.jobTitle} onChange={event => setDetails(current => ({ ...current, jobTitle: event.target.value }))} /></HorizontalFieldRow>
                  <HorizontalFieldRow label="Department" htmlFor="new-employee-departmentId"><HrResourceSearchSelect id="new-employee-departmentId" value={details.departmentId} onValueChange={value => setDetails(current => ({ ...current, departmentId: value }))} apiPath="/api/hr/departments" labelKeys={['name', 'division']} placeholder="Search departments" disabled={isCreating} /></HorizontalFieldRow>
                  <HorizontalFieldRow label="Start date" htmlFor="new-employee-hireDate"><Input id="new-employee-hireDate" type="date" value={details.hireDate} onChange={event => setDetails(current => ({ ...current, hireDate: event.target.value }))} /></HorizontalFieldRow>
                  <HorizontalFieldRow label="Manager" htmlFor="new-employee-managerId"><HrEmployeeSearchSelect id="new-employee-managerId" value={details.managerId} onValueChange={value => setDetails(current => ({ ...current, managerId: value }))} disabled={isCreating} /></HorizontalFieldRow>
                  <HorizontalFieldRow label="Location" htmlFor="new-employee-location"><Input id="new-employee-location" value={details.location} onChange={event => setDetails(current => ({ ...current, location: event.target.value }))} /></HorizontalFieldRow>
                  <HorizontalFieldRow label="Position" htmlFor="new-employee-positionId"><HrResourceSearchSelect id="new-employee-positionId" value={details.positionId} onValueChange={value => setDetails(current => ({ ...current, positionId: value }))} apiPath="/api/positions?limit=200" labelKeys={['title', 'department']} placeholder="Search positions" disabled={isCreating} /></HorizontalFieldRow>
                  <HorizontalFieldRow label="Company" htmlFor="new-employee-companyId"><HrResourceSearchSelect id="new-employee-companyId" value={details.companyId} onValueChange={value => setDetails(current => ({ ...current, companyId: value }))} apiPath="/api/settings/company-references" labelKeys={['name', 'legalName']} placeholder="Search companies" disabled={isCreating} /></HorizontalFieldRow>
                  <HorizontalFieldRow label="Business unit" htmlFor="new-employee-businessUnit"><Input id="new-employee-businessUnit" value={details.businessUnit} onChange={event => setDetails(current => ({ ...current, businessUnit: event.target.value }))} /></HorizontalFieldRow>
                  {details.employmentType === "subcontract" && <HorizontalFieldRow label="Client" htmlFor="new-employee-client" required><HrResourceSearchSelect id="new-employee-client" value={details.clientId} onValueChange={value => setDetails(current => ({ ...current, clientId: value }))} apiPath="/api/hr/clients" labelKeys={['name', 'clientCode']} placeholder="Search clients" disabled={isCreating} /></HorizontalFieldRow>}
                </div>}

                {activeDirectStep === "personal" && <div className="space-y-4">
                  {[["phone", "Personal phone", "tel"], ["preferredName", "Preferred name", "text"], ["legalName", "Legal name", "text"], ["workPhone", "Work phone", "tel"], ["profilePhotoUrl", "Profile photo URL", "url"], ["emergencyName", "Emergency contact", "text"], ["emergencyRelationship", "Relationship", "text"], ["emergencyPhone", "Emergency phone", "tel"]].map(([key, label, type]) => <HorizontalFieldRow key={key} label={label} htmlFor={`new-employee-${key}`}><Input id={`new-employee-${key}`} type={type} value={details[key]} onChange={event => setDetails(current => ({ ...current, [key]: event.target.value }))} /></HorizontalFieldRow>)}
                </div>}

                {activeDirectStep === "compliance" && <div className="space-y-4">
                  {[["endDate", details.employmentType === "full_time" ? "End date" : "Contract end date", "date"], ["contractNoticeDays", "Contract notice (days)", "number"], ["probationPeriodDays", "Probation period (days)", "number"], ["probationEvaluationFrequencyDays", "Evaluation frequency", "number"], ["profileCompletion", "Profile completion (%)", "number"]].map(([key, label, type]) => <HorizontalFieldRow key={key} label={label} htmlFor={`new-employee-${key}`} required={key === "endDate" && details.employmentType !== "full_time"}><Input id={`new-employee-${key}`} type={type} value={details[key]} onChange={event => setDetails(current => ({ ...current, [key]: event.target.value }))} /></HorizontalFieldRow>)}
                  <div className="border-t border-slate-200 pt-5"><p className="mb-4 text-xs text-slate-500">Structured attributes use JSON objects or arrays.</p><div className="space-y-4">{structuredEmployeeFields.map(([key, label]) => <HorizontalFieldRow key={key} label={label} htmlFor={`new-${key}`}><Textarea id={`new-${key}`} className="min-h-20 font-mono text-xs" value={details[key]} onChange={event => setDetails(current => ({ ...current, [key]: event.target.value }))} /></HorizontalFieldRow>)}</div></div>
                </div>}

                {activeDirectStep === "review" && <div className="space-y-5">
                  <div className={cn("rounded-lg border p-4", directRequirementsMet ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40")}><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{directRequirementsMet ? "Ready to create" : "Required details are incomplete"}</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{directRequirementsMet ? "Review the summary, then create the employee record." : "Return to Core record and complete every required field."}</p></div>
                  <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">{[["Employee", `${details.firstName || "—"} ${details.lastName || ""}`.trim()], ["Employee number", details.employeeNumber || "—"], ["Work email", details.email || "—"], ["Employment", details.employmentType || "—"], ["Status", details.status || "—"], ["Job title", details.jobTitle || "—"], ["Start date", details.hireDate || "—"]].map(([label, value]) => <div key={label} className="grid grid-cols-[150px_1fr] gap-4 px-4 py-3 text-sm"><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className="font-medium text-slate-900 dark:text-slate-100">{value}</dd></div>)}</dl>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{directSteps.slice(0, 4).map(step => <button key={step.id} type="button" onClick={() => setActiveDirectStep(step.id)} className="rounded-lg border border-slate-200 p-3 text-left hover:border-blue-300 dark:border-slate-700"><span className="block text-xs text-slate-500 dark:text-slate-400">{step.label}</span><span className="mt-1 block text-lg font-semibold text-slate-900 dark:text-slate-100">{completion[step.id]}%</span></button>)}</div>
                </div>}
              </section>
            </div>
          )}

          {creationSource === "applicant" && selectedApplicant && (
            <div className="space-y-5 border-t border-slate-200 pt-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Employee details</h3>
                <p className="text-xs text-slate-500">Complete the employment record before creating the employee.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[["phone", "Phone", "text"], ["jobTitle", "Job title", "text"], ["hireDate", "Hire date", "date"], ["location", "Location", "text"]].map(([key, label, type]) => <div key={key} className="space-y-2"><Label htmlFor={`applicant-employee-${key}`}>{label}</Label><Input id={`applicant-employee-${key}`} type={type} value={details[key] || ""} onChange={event => setDetails(current => ({ ...current, [key]: event.target.value }))} /></div>)}
                <div className="space-y-2"><Label htmlFor="applicant-employee-departmentId">Department</Label><HrResourceSearchSelect id="applicant-employee-departmentId" value={details.departmentId} onValueChange={value => setDetails(current => ({ ...current, departmentId: value }))} apiPath="/api/hr/departments" labelKeys={['name', 'division']} placeholder="Search departments" disabled={isCreating} /></div>
                <div className="space-y-2"><Label htmlFor="applicant-employee-managerId">Manager</Label><HrEmployeeSearchSelect id="applicant-employee-managerId" value={details.managerId} onValueChange={value => setDetails(current => ({ ...current, managerId: value }))} disabled={isCreating} /></div>
                <div className="space-y-2"><Label htmlFor="applicant-employee-positionId">Position</Label><HrResourceSearchSelect id="applicant-employee-positionId" value={details.positionId} onValueChange={value => setDetails(current => ({ ...current, positionId: value }))} apiPath="/api/positions?limit=200" labelKeys={['title', 'department']} placeholder="Search positions" disabled={isCreating} /></div>
                <div className="space-y-2"><Label htmlFor="applicant-employee-companyId">Company</Label><HrResourceSearchSelect id="applicant-employee-companyId" value={details.companyId} onValueChange={value => setDetails(current => ({ ...current, companyId: value }))} apiPath="/api/settings/company-references" labelKeys={['name', 'legalName']} placeholder="Search companies" disabled={isCreating} /></div>
                <div className="space-y-2"><Label htmlFor="applicant-employee-type">Employment type</Label><select id="applicant-employee-type" value={details.employmentType} onChange={event => setDetails(current => ({ ...current, employmentType: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{employmentTypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="applicant-employee-status">Status</Label><select id="applicant-employee-status" value={details.status} onChange={event => setDetails(current => ({ ...current, status: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{['onboarding', 'probation', 'active', 'inactive'].map(value => <option key={value} value={value}>{value}</option>)}</select></div>
                {details.employmentType === "subcontract" && <div className="space-y-2"><Label htmlFor="applicant-employee-clientId">Client <span className="text-red-600">*</span></Label><HrResourceSearchSelect id="applicant-employee-clientId" value={details.clientId} onValueChange={value => setDetails(current => ({ ...current, clientId: value }))} apiPath="/api/hr/clients" labelKeys={['name', 'clientCode']} placeholder="Search clients" disabled={isCreating} /></div>}
              </div>
            </div>
          )}

          {creationSource === "applicant" && <div className="flex gap-3 rounded-[6px] bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <UserPlusIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p>
              The standalone person profile was initialized when this person entered recruitment
              and will be shared with the employee. The job application, attachments, and hiring
              history remain separate recruitment records.
            </p>
          </div>}
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 pt-4">
          {creationSource === "direct" ? <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" className="justify-start text-slate-600" onClick={() => { setCreationSource(null); setDetails(initialEmployeeDetails()); }} disabled={isCreating}>
              <ArrowLeftIcon className="mr-1.5 h-4 w-4" />Back to methods
            </Button>
            <div className="flex items-center justify-end gap-2">
              {draftSavedAt && <span className="hidden text-xs text-slate-500 lg:inline">Saved {draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              <Button type="button" variant="outline" onClick={() => { const savedAt = new Date(); setDraftSavedAt(savedAt); toastSuccess("Draft saved for this session."); }} disabled={isCreating}>Save draft</Button>
              {activeDirectStep === "review" ? <Button type="button" onClick={() => void handleCreate()} disabled={!directRequirementsMet || isCreating}><UserPlusIcon className="mr-1.5 h-4 w-4" />{isCreating ? "Creating..." : "Create employee"}</Button> : <Button type="button" onClick={goToNextDirectStep}>Continue</Button>}
            </div>
          </div> : <>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
            {creationSource === "applicant" && <Button type="button" onClick={() => void handleCreate()} disabled={!selectedApplicantId || isCreating || (details.employmentType === 'subcontract' && !details.clientId.trim()) || (details.employmentType !== 'full_time' && !details.endDate)}><UserPlusIcon className="mr-1.5 h-4 w-4" />{isCreating ? "Creating..." : "Create employee"}</Button>}
          </>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

