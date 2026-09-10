"use client";

import { AlertTriangle, Check, CheckCircle2, Info, Megaphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { normalizeSystemSettingsResponse } from "@/lib/system-settings-response";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { sanitizeRichHtml } from "@/lib/security";
import { useLocalization } from '@/contexts/LocalizationContext';

type BroadcastBannerId = "none" | "one" | "two" | "three";
type BroadcastBannerTone = "info" | "success" | "warning" | "critical";

interface BroadcastBannerState {
  id: string;
  campaignId?: string;
  title: string;
  message: string;
  tone: BroadcastBannerTone;
  backgroundColor?: string | null;
  fontColor?: string | null;
  scrollAnimation?: string;
}

interface ActiveAnnouncement {
  id: string;
  channel: "banner" | "popup";
  title: string;
  message: string;
  priority: string;
  ctaLabel: string | null;
  placement: string | null;
  backgroundColor: string | null;
  fontColor: string | null;
  scrollAnimation: string;
}

const BROADCAST_BANNER_KEYS = [
  "broadcastBannerActiveId",
  "broadcastBannerOneTitle",
  "broadcastBannerOneMessage",
  "broadcastBannerOneTone",
  "broadcastBannerTwoTitle",
  "broadcastBannerTwoMessage",
  "broadcastBannerTwoTone",
  "broadcastBannerThreeTitle",
  "broadcastBannerThreeMessage",
  "broadcastBannerThreeTone",
].join(",");

const toneClasses: Record<BroadcastBannerTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  critical: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
};

const toneIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: Megaphone,
};

export function BroadcastBanner() {
  const pathname = usePathname();
  const { t } = useLocalization();
  const [banner, setBanner] = useState<BroadcastBannerState | null>(null);
  const [popup, setPopup] = useState<ActiveAnnouncement | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchBanner() {
      try {
        const activeResponse = await fetch("/api/broadcast/active", { credentials: "include", cache: "no-store" });
        if (activeResponse.ok) {
          const payload = await activeResponse.json();
          const announcements = Array.isArray(payload.announcements) ? payload.announcements as ActiveAnnouncement[] : [];
          const campaignBanner = announcements.find(item => item.channel === "banner" && matchesPlacement(item.placement, pathname));
          const campaignPopup = announcements.find(item => item.channel === "popup");
          if (!cancelled && campaignBanner) {
            setBanner({
              id: campaignBanner.id,
              campaignId: campaignBanner.id,
              title: campaignBanner.title,
              message: campaignBanner.message,
              tone: toneFromPriority(campaignBanner.priority),
              backgroundColor: campaignBanner.backgroundColor,
              fontColor: campaignBanner.fontColor,
              scrollAnimation: campaignBanner.scrollAnimation,
            });
            void recordBannerEngagement(campaignBanner.id, "seen").catch(error => {
              console.error("[BroadcastBanner] Failed to record banner view:", error);
            });
          }
          if (!cancelled && campaignPopup && !window.localStorage.getItem(`broadcast-popup-seen:${campaignPopup.id}`)) {
            setPopup(campaignPopup);
            setPopupOpen(true);
          }
          if (campaignBanner) return;
        }
        const response = await fetch(`/api/settings/system-settings?keys=${BROADCAST_BANNER_KEYS}`, {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const settings = normalizeSystemSettingsResponse(await response.json());
        if (!cancelled) {
          setBanner(normalizeBroadcastBanner(settings, t));
        }
      } catch (error) {
        console.error("[BroadcastBanner] Failed to load broadcast banner settings:", error);
      }
    }

    fetchBanner();

    return () => {
      cancelled = true;
    };
  }, [pathname, t]);

  const Icon = useMemo(() => (banner ? toneIcons[banner.tone] : Info), [banner]);

  function closePopup() {
    if (popup) window.localStorage.setItem(`broadcast-popup-seen:${popup.id}`, new Date().toISOString());
    setPopupOpen(false);
  }

  async function acknowledgeBanner() {
    if (!banner?.campaignId || acknowledging) return;
    const acknowledgedBanner = banner;
    const campaignId = banner.campaignId;
    setAcknowledging(true);
    setBanner(null);
    try {
      const response = await recordBannerEngagement(campaignId, "acknowledge");
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(typeof payload.message === "string" ? payload.message : t("broadcast.unableAcknowledge", "Unable to acknowledge banner"));
      }
      toast.success(t("broadcast.announcementAcknowledged", "Announcement acknowledged"));
    } catch (error) {
      setBanner(acknowledgedBanner);
      toast.error(error instanceof Error ? error.message : t("broadcast.unableAcknowledge", "Unable to acknowledge banner"));
    } finally {
      setAcknowledging(false);
    }
  }

  return (
    <>
      {banner && <div
        className={cn(
          "broadcast-banner-surface shrink-0 overflow-hidden border-b py-2 text-sm",
          banner.campaignId && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current",
          !banner.backgroundColor && toneClasses[banner.tone],
        )}
        style={banner.backgroundColor ? { backgroundColor: banner.backgroundColor, color: banner.fontColor || undefined } : undefined}
        role={banner.campaignId ? "button" : "status"}
        tabIndex={banner.campaignId ? 0 : undefined}
        aria-label={banner.campaignId ? t("broadcast.acknowledgeAnnouncement", `Acknowledge announcement: ${banner.title}`) : undefined}
        onClick={banner.campaignId ? () => void acknowledgeBanner() : undefined}
        onKeyDown={banner.campaignId ? (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void acknowledgeBanner();
          }
        } : undefined}
      >
        <div
          className={cn("flex w-max min-w-full items-center", banner.scrollAnimation && banner.scrollAnimation !== "none" && "broadcast-banner-marquee")}
          data-speed={banner.scrollAnimation || "none"}
        >
          <BannerCopy banner={banner} Icon={Icon} t={t} />
          {banner.scrollAnimation && banner.scrollAnimation !== "none" && (
            <div aria-hidden="true"><BannerCopy banner={banner} Icon={Icon} t={t} /></div>
          )}
        </div>
      </div>}
      <Dialog open={popupOpen} onOpenChange={(open) => open ? setPopupOpen(true) : closePopup()}>
        <DialogContent className="rounded-[8px] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{popup?.title}</DialogTitle>
            <DialogDescription>{t("broadcast.companyAnnouncement", "Company announcement")}</DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap rounded-[8px] border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">{popup?.message}</div>
          <DialogFooter><Button type="button" onClick={closePopup}>{popup?.ctaLabel || t("broadcast.gotIt", "Got it")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BannerCopy({ 
  banner,
  Icon,
  t,
}: {
  banner: BroadcastBannerState;
  Icon: typeof Info;
  t: (key: string, fallback: string) => string;
}) {
  return (
    <div className="broadcast-banner-copy mx-auto flex min-h-6 max-w-screen-2xl shrink-0 items-center gap-2 px-4">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="font-semibold">{banner.title}</span>
      <div className="broadcast-banner-rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(banner.message) }} />
      {banner.campaignId && (
        <span className="ml-3 inline-flex shrink-0 items-center gap-1 border-l border-current/25 pl-3 text-xs font-semibold">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {t("broadcast.clickToAcknowledge", "Click to acknowledge")}
        </span>
      )}
    </div>
  );
}

function toneFromPriority(priority: string): BroadcastBannerTone {
  return priority === "urgent" ? "critical" : priority === "important" ? "warning" : "info";
}

function matchesPlacement(placement: string | null, pathname: string) {
  return !placement || placement === "top" || (placement === "dashboard" && pathname.startsWith("/dashboard")) || (placement === "ess" && pathname.startsWith("/ess"));
}

function normalizeBroadcastBanner(settings: Record<string, unknown>, t: (key: string, fallback: string) => string): BroadcastBannerState | null {
  const activeId = parseBannerId(getStringSetting(settings, "broadcastBannerActiveId", "none"));
  if (activeId === "none") {
    return null;
  }

  const prefix = activeId === "one" ? "One" : activeId === "two" ? "Two" : "Three";
  const message = getStringSetting(settings, `broadcastBanner${prefix}Message`, "").trim();
  if (!message) {
    return null;
  }

  return {
    id: activeId,
    title: getStringSetting(settings, `broadcastBanner${prefix}Title`, "Announcement").trim() || t("broadcast.defaultTitle", "Announcement"),
    message,
    tone: parseBannerTone(getStringSetting(settings, `broadcastBanner${prefix}Tone`, "info")),
  };
}

function getStringSetting(settings: Record<string, unknown>, key: string, fallback: string) {
  const value = settings[key];
  return typeof value === "string" ? value : fallback;
}

function parseBannerId(value: string): BroadcastBannerId {
  return value === "one" || value === "two" || value === "three" ? value : "none";
}

function parseBannerTone(value: string): BroadcastBannerTone {
  return value === "success" || value === "warning" || value === "critical" ? value : "info";
}

function recordBannerEngagement(campaignId: string, action: "seen" | "acknowledge") {
  return fetch(`/api/broadcast/${campaignId}/engagement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action }),
  });
}
