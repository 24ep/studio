"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { MessageSquareText } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/ui/wysiwyg-editors";
import { sanitizeRichHtml } from "@/lib/security";
import { cn } from "@/lib/utils";
import { BroadcastEmailComposer } from "./BroadcastEmailComposer";
import {
  audienceOptions,
  channelLabel,
  type BroadcastForm,
  type BroadcastView,
  validHexColor,
  viewCopy,
} from "./BroadcastPageModel";

export function BroadcastComposerDialog({
  open,
  onOpenChange,
  view,
  form,
  setForm,
  onSubmit,
  isSubmitting,
  submitLabel,
  onPreviewPopup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: BroadcastView;
  form: BroadcastForm;
  setForm: Dispatch<SetStateAction<BroadcastForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  submitLabel: string;
  onPreviewPopup: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[8px]",
        view === "email" ? "sm:max-w-5xl" : "sm:max-w-xl",
      )}>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              {viewCopy[view].title}
            </DialogTitle>
            <DialogDescription>
              Create a new {channelLabel(view)} message. It will appear in the history after submission.
            </DialogDescription>
          </DialogHeader>

          <div className="py-5">
            <BroadcastComposerFields
              view={view}
              form={form}
              setForm={setForm}
              onPreviewPopup={onPreviewPopup}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BroadcastComposerFields({
  view,
  form,
  setForm,
  onPreviewPopup,
}: {
  view: BroadcastView;
  form: BroadcastForm;
  setForm: Dispatch<SetStateAction<BroadcastForm>>;
  onPreviewPopup: () => void;
}) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium">
        Audience
        <select
          value={form.audience}
          onChange={(event) => setForm(current => ({ ...current, audience: event.target.value }))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
        >
          {audienceOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      {view !== "email" && (
        <label className="grid gap-1 text-sm font-medium">
          Title
          <Input value={form.title} onChange={(event) => setForm(current => ({ ...current, title: event.target.value }))} placeholder={view === "sms" ? "Office alert" : "Announcement title"} required />
        </label>
      )}

      {view === "banner" && (
        <label className="grid gap-1 text-sm font-medium">
          Placement
          <select
            value={form.placement}
            onChange={(event) => setForm(current => ({ ...current, placement: event.target.value }))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
          >
            <option value="top">Top banner</option>
            <option value="dashboard">Dashboard banner</option>
            <option value="ess">ESS banner</option>
          </select>
        </label>
      )}

      {view === "email" ? (
        <BroadcastEmailComposer form={form} setForm={setForm} />
      ) : view === "banner" ? (
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="banner-message-editor">Message</label>
          <TiptapEditor
            value={form.message}
            onChange={(message) => setForm(current => ({ ...current, message }))}
            placeholder="Write and format the banner announcement..."
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground">Use the toolbar to format emphasis, links, lists, and headings.</p>
        </div>
      ) : (
        <label className="grid gap-1 text-sm font-medium">
          Message
          <Textarea
            value={form.message}
            onChange={(event) => setForm(current => ({ ...current, message: event.target.value }))}
            placeholder="Write the announcement..."
            rows={view === "sms" ? 4 : 6}
            maxLength={view === "sms" ? 320 : undefined}
            required
          />
        </label>
      )}

      {view === "banner" && (
        <div className="grid gap-4 rounded-[8px] border border-border bg-muted/70 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              id="banner-background-color"
              label="Background color"
              value={form.backgroundColor}
              onChange={(backgroundColor) => setForm(current => ({ ...current, backgroundColor }))}
            />
            <ColorField
              id="banner-font-color"
              label="Font color"
              value={form.fontColor}
              onChange={(fontColor) => setForm(current => ({ ...current, fontColor }))}
            />
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Scroll animation
            <select
              value={form.scrollAnimation}
              onChange={(event) => setForm(current => ({ ...current, scrollAnimation: event.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
            >
              <option value="none">Off</option>
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </label>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Live preview</span>
            <BannerContent
              title={form.title || "Announcement"}
              message={form.message}
              backgroundColor={form.backgroundColor}
              fontColor={form.fontColor}
              scrollAnimation={form.scrollAnimation}
            />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {(view === "banner" || view === "popup") && (
          <label className="grid gap-1 text-sm font-medium">
            Publish date
            <Input type="date" value={form.scheduleDate} onChange={(event) => setForm(current => ({ ...current, scheduleDate: event.target.value }))} />
          </label>
        )}
        {(view === "banner" || view === "popup") && (
          <label className="grid gap-1 text-sm font-medium">
            Priority
            <select
              value={form.priority}
              onChange={(event) => setForm(current => ({ ...current, priority: event.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        )}
      </div>

      {(view === "banner" || view === "popup") && (
        <label className="grid gap-1 text-sm font-medium">
          Expiry date (optional)
          <Input type="date" value={form.expiresDate} onChange={(event) => setForm(current => ({ ...current, expiresDate: event.target.value }))} />
        </label>
      )}

      {view === "popup" && (
        <div className="rounded-[8px] border border-border bg-muted/70 p-3">
          <label className="grid gap-1 text-sm font-medium">
            CTA label
            <Input value={form.ctaLabel} onChange={(event) => setForm(current => ({ ...current, ctaLabel: event.target.value }))} placeholder="Open ESS" />
          </label>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onPreviewPopup}>Preview popup</Button>
        </div>
      )}
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium" htmlFor={id}>
      {label}
      <span className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
        <input
          id={id}
          type="color"
          value={validHexColor(value, "#000000")}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          aria-label={`${label} hex value`}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase outline-none"
        />
      </span>
    </label>
  );
}

function BannerContent({
  title,
  message,
  backgroundColor,
  fontColor,
  scrollAnimation,
}: {
  title: string;
  message: string;
  backgroundColor: string;
  fontColor: string;
  scrollAnimation: string;
}) {
  const animated = scrollAnimation !== "none";
  const content = (
    <div className="broadcast-banner-copy flex shrink-0 items-center gap-2 px-4">
      <span className="font-semibold">{title}</span>
      <div
        className="broadcast-banner-rich-text"
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(message || "<p>Your formatted announcement appears here.</p>") }}
      />
    </div>
  );

  return (
    <div
      className="broadcast-banner-surface overflow-hidden border-y py-2 text-sm"
      style={{ backgroundColor: validHexColor(backgroundColor, "#eef2ff"), color: validHexColor(fontColor, "#312e81") }}
    >
      <div className={cn("flex w-max min-w-full items-center", animated && "broadcast-banner-marquee")} data-speed={scrollAnimation}>
        {content}
        {animated && <div aria-hidden="true">{content}</div>}
      </div>
    </div>
  );
}

export function FirstSeePopupPreview({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BroadcastForm;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[8px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.title || "Welcome announcement"}</DialogTitle>
          <DialogDescription>{form.audience}</DialogDescription>
        </DialogHeader>
        <div className="rounded-[8px] border border-border bg-muted p-4 text-sm leading-6 text-foreground">
          {form.message || "A first-see popup will show once for each user when they open the app."}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
          <Button type="button" onClick={() => onOpenChange(false)}>{form.ctaLabel || "Got it"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
