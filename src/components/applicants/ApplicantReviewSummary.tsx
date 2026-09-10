import {
  BriefcaseIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

import type { Applicant } from "@/lib/types";

function fitGrade(score: number) {
  if (score >= 81) return "A";
  if (score >= 61) return "B";
  if (score >= 41) return "C";
  if (score >= 21) return "D";
  return "E";
}

export function ApplicantReviewSummary({ applicant }: { applicant: Applicant }) {
  const appliedDate = applicant.applicationDate
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
        .format(new Date(applicant.applicationDate))
    : "Not provided";

  return (
    <dl className="grid min-h-[70px] grid-cols-1 divide-y divide-[#e2e7ef] border-b border-[#e2e7ef] bg-white px-[32px] text-[#12213d] sm:grid-cols-[0.65fr_1.2fr_1fr] sm:divide-x sm:divide-y-0">
      <div className="flex items-center py-2 pr-5">
        <div>
          <dt className="text-xs font-medium !normal-case text-[#68758e]">Fit score</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-[26px] font-bold tracking-[-0.03em] text-[#08aeb0]">{applicant.fitScore}</span>
            <span className="text-xs font-bold text-[#08aeb0]">{fitGrade(applicant.fitScore)}</span>
          </dd>
        </div>
      </div>
      <SummaryItem
        icon={BriefcaseIcon}
        label="Applied for"
        value={applicant.position?.title || "Position not assigned"}
      />
      <SummaryItem icon={CalendarDaysIcon} label="Applied on" value={appliedDate} />
    </dl>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-5 py-2 first:pl-0">
      <Icon className="h-[18px] w-[18px] shrink-0 text-[#61708b]" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-medium !normal-case text-[#68758e]">{label}</dt>
        <dd className="mt-1 truncate text-[13px] font-semibold text-[#12213d]">{value}</dd>
      </div>
    </div>
  );
}
