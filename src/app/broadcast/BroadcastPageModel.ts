export type BroadcastView = "sms" | "email" | "banner" | "popup";

export type BroadcastHistoryItem = {
  campaignId: string;
  id: string;
  channel: "sms" | "email" | "banner" | "popup";
  title: string;
  audience: string;
  status: "scheduled" | "sent" | "active" | "inactive" | "failed" | "expired";
  owner: string;
  date: string;
  seenCount: number;
  acknowledgedCount: number;
};

export const viewCopy = {
  sms: {
    title: "SMS Broadcasting",
    description: "Send short operational alerts to employee groups.",
  },
  email: {
    title: "Email Announcements",
    description: "Prepare richer announcements for company and HR communication.",
  },
  banner: {
    title: "Banner Setup",
    description: "Publish in-app banner messages and review banner history.",
  },
  popup: {
    title: "First-See Popup",
    description: "Set a popup announcement that appears once when users first open the app.",
  },
} satisfies Record<BroadcastView, { title: string; description: string }>;

export const initialBroadcastForm = {
  audience: "all-employees",
  title: "",
  subject: "",
  message: "",
  templateCode: "",
  sender: "NCC HR",
  scheduleDate: "",
  expiresDate: "",
  priority: "normal",
  placement: "top",
  backgroundColor: "#eef2ff",
  fontColor: "#312e81",
  scrollAnimation: "none",
  ctaLabel: "",
};

export type BroadcastForm = typeof initialBroadcastForm;

export const audienceOptions = [
  { value: "all-employees", label: "All employees" },
  { value: "managers", label: "Managers" },
  { value: "bangkok-office", label: "Bangkok office" },
  { value: "new-hires", label: "New hires" },
  { value: "payroll-recipients", label: "Payroll recipients" },
];

export function channelLabel(channel: BroadcastHistoryItem["channel"]) {
  return channel === "sms" ? "SMS" : channel;
}

export function validHexColor(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export function getAudienceLabel(value: string) {
  return audienceOptions.find((option) => option.value === value)?.label || value;
}

export function toHistoryItem(campaign: Record<string, unknown>): BroadcastHistoryItem {
  return {
    campaignId: String(campaign.id),
    id: String(campaign.id).slice(0, 8).toUpperCase(),
    channel: campaign.channel as BroadcastHistoryItem["channel"],
    title: String(campaign.title || "Untitled"),
    audience: getAudienceLabel(String(campaign.audience || "all-employees")),
    status: campaign.status as BroadcastHistoryItem["status"],
    owner: String(campaign.owner || "Unknown user"),
    date: new Date(String(campaign.scheduledAt || campaign.createdAt)).toLocaleDateString(),
    seenCount: Number(campaign.seenCount || 0),
    acknowledgedCount: Number(campaign.acknowledgedCount || 0),
  };
}
