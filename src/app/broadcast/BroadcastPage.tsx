"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Megaphone, MessageSquareText } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { BannerEngagementReportDialog, type BannerReportCampaign } from "./BannerEngagementReportDialog";
import { BroadcastComposerDialog, FirstSeePopupPreview } from "./BroadcastComposerParts";
import { BroadcastHistoryTable } from "./BroadcastHistoryTable";
import {
  type BroadcastHistoryItem,
  type BroadcastView,
  initialBroadcastForm,
  toHistoryItem,
  viewCopy,
} from "./BroadcastPageModel";

export type { BroadcastView } from "./BroadcastPageModel";

export function BroadcastPage({ view }: { view: BroadcastView }) {
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [form, setForm] = useState(initialBroadcastForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [reportCampaign, setReportCampaign] = useState<BannerReportCampaign | null>(null);
  const copy = viewCopy[view];

  useEffect(() => {
    let active = true;
    setIsLoadingHistory(true);
    fetch(`/api/broadcast?channel=${view}`, { credentials: "include" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Unable to load broadcasts");
        if (active) setHistory((data.campaigns || []).map(toHistoryItem));
      })
      .catch(error => { if (active) toast.error(error instanceof Error ? error.message : "Unable to load broadcasts"); })
      .finally(() => { if (active) setIsLoadingHistory(false); });
    return () => { active = false; };
  }, [view]);

  const visibleHistory = history.filter(item => item.channel === view);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (view === "email" || view === "sms") {
      setIsSubmitting(true);
      const toastId = toast.loading(`Sending ${view.toUpperCase()} broadcast...`);
      try {
        const response = await fetch(`/api/broadcast/${view}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            audience: form.audience,
            message: form.message,
            ...(view === "sms" ? { title: form.title } : {}),
            ...(view === "email" ? { subject: form.subject, templateCode: form.templateCode } : {}),
          }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof data.message === "string" ? data.message : "Broadcast failed");
        }

        if (data.campaign) setHistory(current => [toHistoryItem(data.campaign), ...current]);
        setForm(initialBroadcastForm);
        setComposerOpen(false);
        toast.success(`${data.sent || 0} ${view.toUpperCase()} message${data.sent === 1 ? "" : "s"} sent`, { id: toastId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Broadcast failed", { id: toastId });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(form.scheduleDate ? "Scheduling broadcast..." : "Publishing broadcast...");
    try {
      const response = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channel: view,
          title: form.title,
          message: form.message,
          audience: form.audience,
          priority: form.priority,
          placement: view === "banner" ? form.placement : undefined,
          backgroundColor: view === "banner" ? form.backgroundColor : undefined,
          fontColor: view === "banner" ? form.fontColor : undefined,
          scrollAnimation: view === "banner" ? form.scrollAnimation : undefined,
          ctaLabel: view === "popup" ? form.ctaLabel : undefined,
          scheduledAt: form.scheduleDate ? new Date(`${form.scheduleDate}T00:00:00`).toISOString() : null,
          expiresAt: form.expiresDate ? new Date(`${form.expiresDate}T23:59:59`).toISOString() : null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Broadcast failed");
      setHistory(current => [toHistoryItem(data.campaign), ...current]);
      setForm(initialBroadcastForm);
      setComposerOpen(false);
      toast.success(data.message || "Broadcast published", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Broadcast failed", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel = view === "email" || view === "sms"
    ? "Send broadcast"
    : view === "banner"
      ? "Publish banner"
      : "Publish popup";

  async function handleDeactivateBanner(campaignId: string) {
    const current = history.find(item => item.campaignId === campaignId);
    if (!current || (current.status !== "active" && current.status !== "scheduled")) return;

    setDeactivatingId(campaignId);
    setHistory(items => items.map(item => item.campaignId === campaignId ? { ...item, status: "inactive" } : item));
    try {
      const response = await fetch(`/api/broadcast/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "deactivate" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Unable to deactivate banner");
      toast.success("Banner deactivated");
    } catch (error) {
      setHistory(items => items.map(item => item.campaignId === campaignId ? { ...item, status: current.status } : item));
      toast.error(error instanceof Error ? error.message : "Unable to deactivate banner");
    } finally {
      setDeactivatingId(null);
    }
  }

  return (
    <div className="min-h-screen w-full px-6 py-6 text-foreground">
      <div className="flex w-full flex-col gap-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Megaphone className="h-4 w-4" />
              Broadcast
            </div>
            <h1 className="text-2xl font-semibold tracking-normal">{copy.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
          </div>
          <Button type="button" className="gap-2" onClick={() => setComposerOpen(true)}>
            <MessageSquareText className="h-4 w-4" />
            {submitLabel}
          </Button>
        </header>

        <BroadcastHistoryTable
          title={view === "banner" ? "Banner history" : "Broadcast history"}
          history={visibleHistory}
          isLoading={isLoadingHistory}
          allowDeactivate={view === "banner"}
          deactivatingId={deactivatingId}
          onDeactivate={handleDeactivateBanner}
          onReport={(campaign) => setReportCampaign(campaign)}
        />

        <BroadcastComposerDialog
          open={composerOpen}
          onOpenChange={setComposerOpen}
          view={view}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          onPreviewPopup={() => setPopupOpen(true)}
        />

        <FirstSeePopupPreview open={popupOpen} onOpenChange={setPopupOpen} form={form} />
        <BannerEngagementReportDialog campaign={reportCampaign} onOpenChange={(open) => !open && setReportCampaign(null)} />
      </div>
    </div>
  );
}
