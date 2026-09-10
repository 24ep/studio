"use client";

import { useState, type FormEvent } from "react";
import { Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiProvider } from "./ai-api-keys-utils";
import type { AiApiKeysAccordionProps } from "./AiApiKeysTabTypes";

const PROVIDERS: Array<{ label: string; value: AiProvider }> = [
  { label: "Google Gemini", value: "gemini" },
  { label: "OpenAI", value: "openai" },
  { label: "DeepSeek", value: "deepseek" },
];

export function AiApiKeysAddSection({
  isLoading,
  isSaving,
  newApiKey,
  newPriority,
  providerLabel,
  selectedProvider,
  actions,
}: AiApiKeysAccordionProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const added = await actions.addApiKey();
    if (added) setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit"
        disabled={isLoading}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New API Key
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && !isLoading && setOpen(nextOpen)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              {`Add a key to the ${providerLabel} key set. Lower priority numbers are tried first.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-api-key-provider">Provider</Label>
                <Select
                  value={selectedProvider}
                  onValueChange={(value) => actions.updateProviderSelection(value as AiProvider)}
                  disabled={isSaving || isLoading}
                >
                  <SelectTrigger id="new-api-key-provider" aria-label="API key provider">
                    <SelectValue placeholder="Select a provider" />
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

              <div className="space-y-2">
                <Label htmlFor="new-api-key">API Key</Label>
                <Input
                  id="new-api-key"
                  type="password"
                  autoComplete="off"
                  placeholder={`Enter your ${providerLabel} API key`}
                  value={newApiKey}
                  onChange={(event) => actions.setNewApiKey(event.target.value)}
                  disabled={isSaving || isLoading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-priority">Priority</Label>
                <Input
                  id="new-priority"
                  type="number"
                  min="1"
                  value={newPriority}
                  onChange={(event) => actions.setNewPriority(parseInt(event.target.value, 10) || 1)}
                  disabled={isSaving || isLoading}
                />
                <p className="text-xs text-muted-foreground">Priority 1 is used before priority 2, and so on.</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving || isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newApiKey.trim() || isSaving || isLoading}>
                {isSaving || isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {isSaving ? "Adding..." : "Loading provider..."}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add API Key
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
