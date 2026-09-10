"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import type { Applicant } from "@/lib/types";
import type { ApplicantAttachment } from "./applicant-attachment-utils";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function value(...values: unknown[]) {
  const found = values.find(
    (item) => item !== null && item !== undefined && item !== "",
  );
  return found === undefined ? "Not provided" : String(found);
}

function money(amount: number | null | undefined) {
  return amount
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount)
    : "Not provided";
}

export function ApplicantHiringBrief({
  applicant,
  hiringOperationsSummary,
  resumes,
  showHeader = true,
}: {
  applicant: Applicant;
  hiringOperationsSummary?: React.ReactNode;
  resumes: ApplicantAttachment[];
  showHeader?: boolean;
}) {
  const parsed = record(applicant.parsedData);
  const personal = record(parsed.personal_info || parsed.personalInfo);
  const custom = record(applicant.customFields);
  const position = applicant.position;
  const positionData = record(position);
  const documentCount = resumes.length || (applicant.resumePath ? 1 : 0);

  return (
    <div className="w-full px-4 py-5 sm:px-5">
      {showHeader && (
        <header className="border-b border-border pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Hiring details
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Offer considerations, ownership, documents, and consent records.
          </p>
        </header>
      )}

      <section className={showHeader ? "py-5" : "pb-5"} aria-labelledby="candidate-expectations-heading">
        <SectionHeading
          id="candidate-expectations-heading"
          title="Applicant expectations"
          description="Availability, location, and offer considerations"
        />
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
          <Fact icon={MapPinIcon} label="Location" text={value(personal.location, parsed.location)} />
          <Fact icon={CurrencyDollarIcon} label="Expected salary" text={money(applicant.expectedSalary)} />
          <Fact icon={ClockIcon} label="Notice period" text={value(custom.noticePeriod, parsed.notice_period, parsed.noticePeriod)} />
          <Fact icon={CalendarDaysIcon} label="Availability" text={value(custom.availability, parsed.availability)} />
          <Fact
            icon={ShieldCheckIcon}
            label="Work authorization"
            text={value(custom.workAuthorization, parsed.work_authorization)}
            className="col-span-2"
          />
        </div>
      </section>

      <section className="border-t border-border py-5" aria-labelledby="hiring-operations-heading">
        <SectionHeading
          id="hiring-operations-heading"
          title="Hiring operations"
          description="Ownership and application records"
        />
        {hiringOperationsSummary && (
          <div className="mt-3 border-b border-border/70 pb-3">
            {hiringOperationsSummary}
          </div>
        )}
        <dl className="mt-3 divide-y divide-border/70">
          <DetailRow icon={UserCircleIcon} label="Hiring manager" text={value(custom.hiringManager, positionData.hiringManager)} />
          <DetailRow icon={BriefcaseIcon} label="Department" text={value(positionData.department, custom.department)} />
          <DetailRow icon={DocumentTextIcon} label="Documents" text={`${documentCount} available`} />
          <DetailRow icon={DocumentTextIcon} label="Other applications" text={value(custom.otherApplications, "Check by email")} />
        </dl>
      </section>

      <section className="border-t border-border pt-5" aria-labelledby="compliance-heading">
        <SectionHeading
          id="compliance-heading"
          title="Consent & retention"
          description="Applicant data handling status"
        />
        <div className="mt-3 rounded-lg bg-muted/45 px-3.5">
          <DetailRow icon={CheckCircleIcon} label="Consent" text={value(custom.consentStatus, "Not recorded")} />
          <DetailRow icon={CalendarDaysIcon} label="Retention" text={value(custom.retentionDate, "Policy default")} />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-5 w-full justify-between">
          <Link href="/people/org-chart">
            View proposed placement
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 id={id} className="text-sm font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[18px_minmax(88px,0.8fr)_minmax(0,1.2fr)] items-center gap-2 py-3 text-xs">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-foreground">{text}</dd>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  text,
  className,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  text: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <p className="text-[11px] font-medium">{label}</p>
      </div>
      <p className="mt-1 break-words text-xs font-semibold leading-5 text-foreground">{text}</p>
    </div>
  );
}
