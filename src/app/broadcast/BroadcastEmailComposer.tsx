"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { AlertCircle, Code2, Eye, FileText, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EmailForm = {
  subject: string;
  message: string;
  templateCode: string;
};

type EmailTemplate = {
  name: string;
  code: string;
  subject: string;
  html: string;
  description: string;
  category: string;
  variables: string[];
};

export function BroadcastEmailComposer<T extends EmailForm>({
  form,
  setForm,
}: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
}) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetch("/api/broadcast/email/templates", { credentials: "include" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof payload.message === "string" ? payload.message : "Unable to load templates");
        return Array.isArray(payload.templates) ? payload.templates as EmailTemplate[] : [];
      })
      .then((loaded) => {
        if (!active) return;
        setTemplates(loaded);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setTemplates([]);
        setLoadError(error instanceof Error ? error.message : "Unable to load templates");
      })
      .finally(() => active && setIsLoading(false));

    return () => { active = false; };
  }, []);

  const selectedTemplate = templates.find((template) => template.code === form.templateCode);

  function selectTemplate(code: string) {
    const template = templates.find((item) => item.code === code);
    if (!template) return;
    setForm((current) => ({
      ...current,
      templateCode: template.code,
      subject: template.subject,
      message: template.html,
    }));
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Email template
        <div className="relative">
          <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <select
            value={form.templateCode}
            onChange={(event) => selectTemplate(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted"
            disabled={isLoading || templates.length === 0}
            required
          >
            <option value="">{isLoading ? "Loading templates…" : "Select a template"}</option>
            {templates.map((template) => (
              <option key={template.code} value={template.code}>{template.name} · {template.category}</option>
            ))}
          </select>
          {isLoading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </label>

      {loadError && <TemplateNotice>{loadError}</TemplateNotice>}
      {!isLoading && !loadError && templates.length === 0 && (
        <TemplateNotice>No active email templates are available. Add or import one in Admin Center → Email Templates.</TemplateNotice>
      )}
      {selectedTemplate?.description && (
        <p className="-mt-1 text-xs leading-5 text-muted-foreground">{selectedTemplate.description}</p>
      )}

      <label className="grid gap-1.5 text-sm font-medium">
        Subject
        <Input
          value={form.subject}
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
          placeholder="Select a template to load its subject"
          disabled={!form.templateCode}
          required
        />
      </label>

      <div className="grid gap-1.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Email body</div>
            <p className="text-xs text-muted-foreground">Review the rendered email, then adjust its HTML as needed.</p>
          </div>
          {selectedTemplate && <span className="text-xs text-muted-foreground">Template: {selectedTemplate.name}</span>}
        </div>

        <Tabs defaultValue="preview" className="rounded-md border border-border bg-muted/60 p-2">
          <TabsList variant="subnav">
            <TabsTrigger value="preview" className="gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</TabsTrigger>
            <TabsTrigger value="html" className="gap-1.5"><Code2 className="h-3.5 w-3.5" />Edit HTML</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-2">
            <iframe
              title="Email announcement preview"
              srcDoc={form.message || previewPlaceholder}
              sandbox=""
              className="h-[360px] w-full rounded border border-border bg-white"
            />
          </TabsContent>
          <TabsContent value="html" className="mt-2">
            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Select a template to edit its HTML"
              disabled={!form.templateCode}
              required
              spellCheck={false}
              className="min-h-[360px] w-full resize-y rounded border border-input bg-background p-3 font-mono text-xs leading-5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:bg-muted"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TemplateNotice({ children }: { children: string }) {
  return (
    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

const previewPlaceholder = `<!doctype html><html><body style="margin:0;padding:48px;font-family:'DM Sans',sans-serif;color:#71717a;text-align:center">Select an email template to preview it here.</body></html>`;
