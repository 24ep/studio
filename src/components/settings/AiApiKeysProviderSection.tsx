"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiProvider } from "./ai-api-keys-utils";
import type { AiApiKeysAccordionProps } from "./AiApiKeysTabTypes";

const PROVIDERS: Array<{ label: string; value: AiProvider }> = [
  { label: "Google Gemini", value: "gemini" },
  { label: "OpenAI", value: "openai" },
  { label: "DeepSeek", value: "deepseek" },
];

export function AiApiKeysProviderSection({
  isLoading,
  isSaving,
  providerLabel,
  selectedProvider,
  actions,
}: AiApiKeysAccordionProps) {
  return (
    <section
      aria-labelledby="ai-provider-heading"
      className="grid gap-4 border-b pb-5 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end"
    >
      <div className="space-y-1">
        <h3 id="ai-provider-heading" className="font-semibold">Provider</h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Choose the AI provider to manage. Each provider keeps a separate set of API keys and its own priority order.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="managed-ai-provider">Active AI provider</Label>
        <Select
          value={selectedProvider}
          onValueChange={(value) => actions.updateProviderSelection(value as AiProvider)}
          disabled={isSaving || isLoading}
        >
          <SelectTrigger id="managed-ai-provider" aria-label="Active AI provider">
            <SelectValue placeholder={providerLabel} />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
