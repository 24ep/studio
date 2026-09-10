"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ApplicantMobileFilterSectionProps {
  value: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
  contentClassName?: string;
}

export function ApplicantMobileFilterSection({
  value,
  title,
  icon: Icon,
  children,
  contentClassName = "pt-4",
}: ApplicantMobileFilterSectionProps) {
  return (
    <AccordionItem value={value} className="border-b">
      <AccordionTrigger className="text-sm font-medium">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </div>
      </AccordionTrigger>
      <AccordionContent className={contentClassName}>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
