"use client";

import { Accordion } from "@/components/ui/accordion";
import { AiApiKeysAddSection } from "./AiApiKeysAddSection";
import { AiApiKeysFooter, AiApiKeysLoadingState } from "./AiApiKeysFooterState";
import { AiApiKeysInfoSection } from "./AiApiKeysInfoSection";
import { AiApiKeysListSection } from "./AiApiKeysListSection";
import { AiApiKeysProviderSection } from "./AiApiKeysProviderSection";
import type { AiApiKeysAccordionProps } from "./AiApiKeysTabTypes";

export function AiApiKeysAccordion(props: AiApiKeysAccordionProps) {
  return (
    <div className="space-y-4">
      <AiApiKeysProviderSection {...props} />
      <AiApiKeysAddSection {...props} />
      <Accordion type="multiple" defaultValue={["list", "info"]} className="w-full">
        <AiApiKeysListSection {...props} />
        <AiApiKeysInfoSection providerLabel={props.providerLabel} />
      </Accordion>
    </div>
  );
}

export { AiApiKeysFooter, AiApiKeysLoadingState };
