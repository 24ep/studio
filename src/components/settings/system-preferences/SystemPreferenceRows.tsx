import React from "react";

import { Label } from "@/components/ui/label";

export function SystemPreferenceSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    <section className="border-b border-border/60 py-5 last:border-b-0 sm:py-6">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function SystemPreferenceRow({
  children,
  description,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  label: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-12 md:gap-6">
      <div className="space-y-1 md:col-span-4">
        {typeof label === "string" ? (
          <Label htmlFor={htmlFor} className="text-sm font-medium leading-none">
            {label}
          </Label>
        ) : (
          label
        )}
        {description && (
          <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-w-0 md:col-span-8">{children}</div>
    </div>
  );
}
