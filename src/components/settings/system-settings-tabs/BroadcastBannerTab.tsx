"use client";

import { Eye, EyeOff, Loader2, Mail, Megaphone, Smartphone } from "lucide-react";
import { useState, type ComponentType } from "react";
import { toast } from "react-hot-toast";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BroadcastBannerId, BroadcastBannerTone } from "@/features/settings/system-settings-types";
import type { BroadcastSmsProvider } from "@/features/settings/system-settings-types";
import { cn } from "@/lib/utils";

type BannerSlotId = Exclude<BroadcastBannerId, "none">;

interface BroadcastBannerTabProps {
  activeId: BroadcastBannerId;
  broadcastEmailEnabled: boolean;
  broadcastSmsEnabled: boolean;
  broadcastSmsProvider: BroadcastSmsProvider;
  broadcastSmsWebhookUrl: string;
  broadcastSmsWebhookToken: string;
  broadcastSmsTwilioAccountSid: string;
  broadcastSmsTwilioAuthToken: string;
  broadcastSmsTwilioFromNumber: string;
  isSaving: boolean;
  setActiveId: (value: BroadcastBannerId) => void;
  setBroadcastEmailEnabled: (value: boolean) => void;
  setBroadcastSmsEnabled: (value: boolean) => void;
  setBroadcastSmsProvider: (value: BroadcastSmsProvider) => void;
  setBroadcastSmsWebhookUrl: (value: string) => void;
  setBroadcastSmsWebhookToken: (value: string) => void;
  setBroadcastSmsTwilioAccountSid: (value: string) => void;
  setBroadcastSmsTwilioAuthToken: (value: string) => void;
  setBroadcastSmsTwilioFromNumber: (value: string) => void;
  banners: Array<{
    id: BannerSlotId;
    label: string;
    title: string;
    message: string;
    tone: BroadcastBannerTone;
    setTitle: (value: string) => void;
    setMessage: (value: string) => void;
    setTone: (value: BroadcastBannerTone) => void;
  }>;
}

const toneLabels: Record<BroadcastBannerTone, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  critical: "Critical",
};

const previewClasses: Record<BroadcastBannerTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  critical: "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
};

export default function BroadcastBannerTab({
  activeId,
  banners,
  broadcastEmailEnabled,
  broadcastSmsEnabled,
  broadcastSmsProvider,
  broadcastSmsTwilioAccountSid,
  broadcastSmsTwilioAuthToken,
  broadcastSmsTwilioFromNumber,
  broadcastSmsWebhookToken,
  broadcastSmsWebhookUrl,
  isSaving,
  setActiveId,
  setBroadcastEmailEnabled,
  setBroadcastSmsEnabled,
  setBroadcastSmsProvider,
  setBroadcastSmsTwilioAccountSid,
  setBroadcastSmsTwilioAuthToken,
  setBroadcastSmsTwilioFromNumber,
  setBroadcastSmsWebhookToken,
  setBroadcastSmsWebhookUrl,
}: BroadcastBannerTabProps) {
  const [showSmsSecret, setShowSmsSecret] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  const handleTestSms = async () => {
    setTestingSms(true);
    try {
      const payload = broadcastSmsProvider === "twilio"
        ? {
            provider: "twilio",
            accountSid: broadcastSmsTwilioAccountSid,
            authToken: broadcastSmsTwilioAuthToken,
          }
        : {
            provider: "webhook",
            webhookUrl: broadcastSmsWebhookUrl,
          };
      const response = await fetch("/api/settings/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error || "SMS provider test failed");
      }
      toast.success(
        broadcastSmsProvider === "twilio"
          ? "Twilio credentials verified"
          : "SMS webhook configuration is valid"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "SMS provider test failed");
    } finally {
      setTestingSms(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <Accordion type="multiple" defaultValue={["channels", "broadcast"]} className="w-full">
        <AccordionItem value="channels" className="border-b">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Broadcast Channels</div>
                <div className="text-xs font-normal text-muted-foreground">Enable email and SMS delivery for broadcast pages</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 px-6 pb-4 pt-2">
            <ChannelSwitch
              checked={broadcastEmailEnabled}
              description="Use the SMTP server configured in Email Server for email announcements."
              disabled={isSaving}
              icon={Mail}
              id="broadcast-email-enabled"
              label="Email broadcasts"
              onCheckedChange={setBroadcastEmailEnabled}
            />
            <section className="rounded-lg border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <Smartphone className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="broadcast-sms-enabled">SMS broadcasts</Label>
                    <p className="mt-1 text-sm text-muted-foreground">Send SMS announcements through Twilio or a custom SMS webhook.</p>
                  </div>
                </div>
                <Switch
                  id="broadcast-sms-enabled"
                  checked={broadcastSmsEnabled}
                  disabled={isSaving}
                  onCheckedChange={setBroadcastSmsEnabled}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="broadcast-sms-provider">SMS provider</Label>
                  <Select
                    value={broadcastSmsProvider}
                    onValueChange={(value) => setBroadcastSmsProvider(value as BroadcastSmsProvider)}
                    disabled={isSaving || !broadcastSmsEnabled}
                  >
                    <SelectTrigger id="broadcast-sms-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webhook">Generic webhook</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {broadcastSmsProvider === "webhook" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-sms-webhook-url">Webhook URL</Label>
                    <Input
                      id="broadcast-sms-webhook-url"
                      value={broadcastSmsWebhookUrl}
                      disabled={isSaving || !broadcastSmsEnabled}
                      onChange={(event) => setBroadcastSmsWebhookUrl(event.target.value)}
                      placeholder="https://sms-provider.example/send"
                    />
                  </div>
                  <SecretInput
                    id="broadcast-sms-webhook-token"
                    label="Bearer token"
                    value={broadcastSmsWebhookToken}
                    disabled={isSaving || !broadcastSmsEnabled}
                    visible={showSmsSecret}
                    onToggleVisible={() => setShowSmsSecret((visible) => !visible)}
                    onChange={setBroadcastSmsWebhookToken}
                  />
                </div>
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-sms-twilio-sid">Account SID</Label>
                    <Input
                      id="broadcast-sms-twilio-sid"
                      value={broadcastSmsTwilioAccountSid}
                      disabled={isSaving || !broadcastSmsEnabled}
                      onChange={(event) => setBroadcastSmsTwilioAccountSid(event.target.value)}
                      placeholder="AC..."
                    />
                  </div>
                  <SecretInput
                    id="broadcast-sms-twilio-token"
                    label="Auth token"
                    value={broadcastSmsTwilioAuthToken}
                    disabled={isSaving || !broadcastSmsEnabled}
                    visible={showSmsSecret}
                    onToggleVisible={() => setShowSmsSecret((visible) => !visible)}
                    onChange={setBroadcastSmsTwilioAuthToken}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-sms-twilio-from">From number</Label>
                    <Input
                      id="broadcast-sms-twilio-from"
                      value={broadcastSmsTwilioFromNumber}
                      disabled={isSaving || !broadcastSmsEnabled}
                      onChange={(event) => setBroadcastSmsTwilioFromNumber(event.target.value)}
                      placeholder="+15551234567"
                    />
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving || testingSms || !broadcastSmsEnabled}
                  onClick={handleTestSms}
                >
                  {testingSms && <Loader2 className="h-4 w-4 animate-spin" />}
                  Test SMS provider
                </button>
              </div>
            </section>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="broadcast" className="border-b">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">In-App Announcement Bar</div>
                <div className="text-xs font-normal text-muted-foreground">Show one announcement bar at the top of the application</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 pt-2">
            <div className="space-y-4">
              {banners.map((banner) => (
                <BroadcastBannerSlot
                  key={banner.id}
                  activeId={activeId}
                  banner={banner}
                  disabled={isSaving}
                  onActiveChange={setActiveId}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  );
}

function ChannelSwitch({
  checked,
  description,
  disabled,
  icon: Icon,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  icon: ComponentType<{ className?: string }>;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <Label htmlFor={id}>{label}</Label>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </section>
  );
}

function SecretInput({
  disabled,
  id,
  label,
  onChange,
  onToggleVisible,
  value,
  visible,
}: {
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
  value: string;
  visible: boolean;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted disabled:opacity-50"
          disabled={disabled}
          onClick={onToggleVisible}
          aria-label={visible ? "Hide secret" : "Show secret"}
        >
          <Icon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function BroadcastBannerSlot({
  activeId,
  banner,
  disabled,
  onActiveChange,
}: {
  activeId: BroadcastBannerId;
  banner: BroadcastBannerTabProps["banners"][number];
  disabled: boolean;
  onActiveChange: (value: BroadcastBannerId) => void;
}) {
  const isActive = activeId === banner.id;
  const titleId = `broadcast-banner-${banner.id}-title`;
  const messageId = `broadcast-banner-${banner.id}-message`;
  const toneId = `broadcast-banner-${banner.id}-tone`;

  return (
    <section className={cn("rounded-lg border p-4", isActive ? "border-primary/50 bg-primary/5" : "bg-background")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">{banner.label}</h3>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Active across the app" : "Inactive"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`broadcast-banner-${banner.id}-active`} className="text-sm">
            Active
          </Label>
          <Switch
            id={`broadcast-banner-${banner.id}-active`}
            checked={isActive}
            disabled={disabled}
            onCheckedChange={(checked) => onActiveChange(checked ? banner.id : "none")}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
        <div className="space-y-2">
          <Label htmlFor={titleId}>Title</Label>
          <Input
            id={titleId}
            value={banner.title}
            disabled={disabled}
            onChange={(event) => banner.setTitle(event.target.value)}
            placeholder="Announcement"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={toneId}>Tone</Label>
          <Select value={banner.tone} onValueChange={(value) => banner.setTone(value as BroadcastBannerTone)} disabled={disabled}>
            <SelectTrigger id={toneId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(toneLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={messageId}>Message</Label>
        <Textarea
          id={messageId}
          value={banner.message}
          disabled={disabled}
          onChange={(event) => banner.setMessage(event.target.value)}
          placeholder="Write the announcement shown to signed-in users."
          rows={3}
        />
      </div>

      <div className={cn("mt-4 rounded-md border px-4 py-3 text-sm", previewClasses[banner.tone])}>
        <span className="font-semibold">{banner.title || "Announcement"}</span>
        {banner.message && <span className="ml-2">{banner.message}</span>}
      </div>
    </section>
  );
}
