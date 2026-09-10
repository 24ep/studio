"use client";

import { AlertCircle } from "lucide-react";

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function AiApiKeysInfoSection({ providerLabel }: { providerLabel: string }) {
  return (
    <AccordionItem value="info" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <div className="text-left">
            <div className="font-semibold text-blue-900">How Fallback Works</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        <div className="space-y-2">
          <ul className="text-sm text-blue-800 space-y-1">
            <li>{`${providerLabel} keys use their own priority order (1 = highest priority)`}</li>
            <li>If a key fails, the system automatically tries the next key</li>
            <li>Error counts and last error messages are tracked for each key</li>
            <li>All attempts and failures are logged for monitoring</li>
            <li>Drag and drop to reorder priorities, or click edit to modify keys</li>
          </ul>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
