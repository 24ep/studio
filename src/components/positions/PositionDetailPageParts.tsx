"use client";

import type { ReactNode } from "react";
import {
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as SolidCheckCircleIcon } from "@heroicons/react/20/solid";
import { CircleDot } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { Position } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PositionDetailTabId } from "./PositionDetailTabsNav";

export function plainText(value?: string | null) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export function LifecycleStep({
  icon,
  label,
  value,
  connector = false,
}: {
  icon: "complete" | "active" | "date";
  label: string;
  value: string;
  connector?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center pl-1 first:pl-0">
      {icon === "complete" ? (
        <SolidCheckCircleIcon className="h-6 w-6 shrink-0 text-[#13b5ad]" aria-hidden />
      ) : icon === "active" ? (
        <CircleDot className="h-6 w-6 shrink-0 stroke-[2.5] text-[#1479f5]" aria-hidden />
      ) : (
        <CalendarDaysIcon className="h-[22px] w-[22px] shrink-0 text-[#60708b]" aria-hidden />
      )}
      <div className="ml-2.5 min-w-[104px]">
        <div className="truncate text-[12px] font-medium leading-[18px] text-[#34425b]">{label}</div>
        <div className="truncate text-[11px] leading-4 text-[#63718a]">{value}</div>
      </div>
      {connector && <span aria-hidden className="mx-5 h-px min-w-8 flex-1 bg-[#98a4b7]" />}
    </div>
  );
}

export function OverviewSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="border-t border-[#e4e9f0] py-5 first:border-t-0 first:pt-0"><div className="mb-2.5 flex items-center justify-between"><h2 className="text-sm font-bold text-[#12213d]">{title}</h2>{action}</div>{children}</section>;
}

export function SectionEditButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769e8] hover:underline"><PencilSquareIcon className="h-4 w-4" />Edit</button>;
}

export function EditField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <label className={cn("block", className)}><span className="mb-1 block text-[11px] font-semibold text-[#52617a]">{label}</span>{children}</label>;
}

export function ListEditor({ label, value, onChange }: { label: string; value: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="max-w-[820px]">
      <p className="mb-2 text-[11px] text-[#68758e]">{label}</p>
      <Textarea
        value={value.join("\n")}
        onChange={(event) => onChange(event.target.value.split("\n"))}
        rows={Math.max(3, Math.min(7, value.length + 1))}
        className="resize-y bg-white text-[13px] leading-5"
      />
    </div>
  );
}

export function EmptyOverviewValue({ text }: { text: string }) {
  return <p className="text-[13px] text-[#68758e]">{text}</p>;
}

export function NumberedOutcome({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="mb-2 flex gap-2.5 text-[13px] leading-5 text-[#33425c]"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#16b8c7] text-[11px] font-bold text-[#0aa4b5]">{number}</span><p><strong className="font-semibold">{title}:</strong> {text}</p></div>;
}

export function SkillGroup({ title, skills, isEditing, onEdit, onChange }: { title: string; skills: string[]; isEditing: boolean; onEdit: () => void; onChange: (items: string[]) => void }) {
  return <section><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-[#12213d]">{title}</h2>{!isEditing && <SectionEditButton onClick={onEdit} />}</div>{isEditing ? <div className="mt-3"><ListEditor label="One skill per line" value={skills} onChange={onChange} /></div> : skills.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-full bg-[#f0f2f6] px-3 py-1 text-[11px] font-semibold text-[#33425c]">{skill}</span>)}</div> : <div className="mt-3"><EmptyOverviewValue text="Not configured" /></div>}</section>;
}

export function PositionReadinessSidebar({
  applicantTotal,
  criteriaText,
  headcountsTotal,
  hiringManagerName,
  interviews,
  offers,
  position,
  readiness,
  readinessIssue,
  salary,
  shortlisted,
  targetStart,
  onTabChange,
}: {
  applicantTotal: number;
  criteriaText: string;
  headcountsTotal: number;
  hiringManagerName: string;
  interviews: number;
  offers: number;
  position: Position;
  readiness: number;
  readinessIssue: string;
  salary: string;
  shortlisted: number;
  targetStart: string;
  onTabChange: (tab: PositionDetailTabId) => void;
}) {
  return (
    <aside className="border-t border-[#dfe5ee] bg-white px-6 py-5 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
      <h2 className="text-sm font-bold text-[#12213d]">Hiring readiness</h2>
      <div className="mt-4 flex items-center gap-4">
        <CheckCircleIcon className="h-12 w-12 text-[#10aa9e]" />
        <div>
          <div className="flex items-baseline gap-2"><span className="text-xl font-bold">{readiness}%</span><span className="text-sm font-bold text-[#00a99b]">{readiness === 100 ? "Ready" : "Configured"}</span></div>
          <p className="mt-0.5 text-xs text-[#68758e]">Based on saved position data</p>
        </div>
      </div>
      <Progress value={readiness} className="mt-3 h-1.5 bg-[#e9edf3] [&>div]:bg-[#10aa9e]" />

      <div className="mt-5 space-y-3 border-t border-[#e4e9f0] pt-4">
        <ReadinessRow icon={BriefcaseIcon} label="Position" value={position.isOpen ? "Open" : "Closed"} accent />
        <ReadinessRow icon={UsersIcon} label="Headcount" value={headcountsTotal > 0 ? `${headcountsTotal} planned` : "Not set"} />
        <ReadinessRow icon={CalendarDaysIcon} label="Target start" value={targetStart} />
        <ReadinessRow icon={BanknotesIcon} label="Salary range" value={salary} />
      </div>

      <div className="mt-5 space-y-3 border-t border-[#e4e9f0] pt-4">
        <ReadinessRow icon={UserCircleIcon} label="Recruiter" value={position.recruiterName || "Not assigned"} />
        <ReadinessRow icon={BriefcaseIcon} label="Hiring manager" value={hiringManagerName} />
        <ReadinessRow icon={UsersIcon} label="Hiring team" value={`${position.hiringTeamCount || 0} members`} />
      </div>

      {readiness < 100 && <div className="mt-5 rounded-md border border-[#f3bd54] bg-[#fffaf0] p-4 text-[#8b5a00]">
        <div className="flex gap-2.5"><ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#e5a21a]" /><div><h3 className="text-[13px] font-semibold">{readinessIssue}</h3><p className="mt-1 text-xs leading-5 text-[#6c5a38]">Complete this item to strengthen position readiness.</p><button type="button" onClick={() => onTabChange(!plainText(position.description) ? "job-description" : !criteriaText ? "criteria" : headcountsTotal === 0 ? "headcount" : "details")} className="mt-3 text-xs font-semibold text-[#1769e8]">Fix readiness issue</button></div></div>
      </div>}

      <div className="mt-5 border-t border-[#e4e9f0] pt-4">
        <h3 className="text-[13px] font-bold">Pipeline summary</h3>
        <div className="mt-3 space-y-3">
          <ReadinessRow icon={UsersIcon} label="Applicants" value={String(applicantTotal)} />
          <ReadinessRow icon={CheckCircleIcon} label="Shortlisted" value={String(shortlisted)} />
          <ReadinessRow icon={UserCircleIcon} label="Interviews" value={String(interviews)} />
          <ReadinessRow icon={BriefcaseIcon} label="Offers" value={String(offers)} />
        </div>
        <button type="button" onClick={() => onTabChange("Applicants")} className="mt-4 text-xs font-semibold text-[#1769e8]">View pipeline details</button>
      </div>

      <div className="mt-5 border-t border-[#e4e9f0] pt-4">
        <h3 className="text-[13px] font-bold">Recent position changes</h3>
        <div className="mt-3 space-y-4 text-xs text-[#33425c]">
          <ChangeRow label="Last updated" date={formatDate(position.updatedAt)} />
          <ChangeRow label="Created" date={formatDate(position.createdAt)} />
        </div>
      </div>
    </aside>
  );
}

function ReadinessRow({ icon: Icon, label, value, accent = false }: { icon: typeof BriefcaseIcon; label: string; value: string; accent?: boolean }) {
  return <div className="grid grid-cols-[18px_105px_minmax(0,1fr)] items-start gap-2 text-xs"><Icon className="h-4 w-4 text-[#68758e]" /><span className="text-[#52617a]">{label}</span><span className={cn("text-right font-semibold text-[#25344f]", accent && "text-[#00a99b]")}>{value}</span></div>;
}

function ChangeRow({ label, date }: { label: string; date: string }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_95px] gap-3"><span className="font-medium">{label}</span><span className="text-right text-[#68758e]">{date}</span></div>;
}
