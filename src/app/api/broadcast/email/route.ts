import { NextResponse, type NextRequest } from "next/server";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { auth } from "@/auth";
import { sendEmail } from "@/lib/emailService";
import { getSystemSetting } from "@/lib/systemSettings";
import { createBroadcastCampaign } from "@/lib/broadcast-campaigns";
import { getActiveEmailTemplateVersions } from "@/lib/email-template-catalog";
import {
  broadcastAudienceSchema,
  getBroadcastRecipients,
  requireBroadcastPermission,
} from "../broadcast-route-utils";

export const dynamic = "force-dynamic";

const emailBroadcastSchema = z.object({
  audience: broadcastAudienceSchema.default("all-employees"),
  customRecipients: z.array(z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
  })).optional(),
  message: z.string().trim().min(1).max(100000),
  subject: z.string().trim().min(1).max(180),
  templateCode: z.string().trim().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const forbidden = requireBroadcastPermission(session);
  if (forbidden) return forbidden;

  const enabled = await getSystemSetting("broadcastEmailEnabled");
  if (enabled !== "true") {
    return NextResponse.json({ message: "Email broadcasts are disabled in System Settings" }, { status: 400 });
  }

  const parsed = emailBroadcastSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid email broadcast payload", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const templateCatalog = parseTemplateCatalog(await getSystemSetting("emailTemplateCatalog"));
  if (!templateCatalog.some((template) => template.code === parsed.data.templateCode)) {
    return NextResponse.json({ message: "Select an active email template from Admin Center" }, { status: 400 });
  }

  const recipients = await getBroadcastRecipients(parsed.data.audience, parsed.data.customRecipients);
  const emails = [...new Set(recipients.map((recipient) => recipient.email).filter((email): email is string => Boolean(email)))];
  if (emails.length === 0) {
    return NextResponse.json({ message: "No recipients with email addresses were found" }, { status: 400 });
  }

  const result = await sendEmail(
    emails,
    parsed.data.subject,
    sanitizeBroadcastEmailHtml(parsed.data.message),
  );

  if (!result.success) {
    return NextResponse.json({ message: result.error || "Failed to send email broadcast" }, { status: 500 });
  }

  const campaign = await createBroadcastCampaign({
    channel: "email", title: parsed.data.subject, message: parsed.data.message,
    audience: parsed.data.audience, status: "sent", recipientCount: emails.length,
    providerMessageId: result.messageId, createdBy: session!.user.id,
    createdByName: session!.user.name || session!.user.email || "Unknown user",
  });

  return NextResponse.json({
    message: "Email broadcast sent",
    channel: "email",
    sent: emails.length,
    messageId: result.messageId,
    campaign,
  });
}

function parseTemplateCatalog(value: string | null): Array<{ code: string }> {
  return getActiveEmailTemplateVersions(value).map(template => ({ code: template.code }));
}

function sanitizeBroadcastEmailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "html", "head", "body", "title", "meta", "style", "img", "picture", "source", "section", "main", "header", "footer",
    ]),
    allowedAttributes: {
      "*": ["class", "id", "style", "title", "role", "aria-*", "data-*"],
      html: ["lang", "dir"],
      meta: ["charset", "name", "content", "http-equiv"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height", "border", "align"],
      table: ["width", "height", "border", "cellpadding", "cellspacing", "align", "bgcolor"],
      td: ["width", "height", "colspan", "rowspan", "align", "valign", "bgcolor"],
      th: ["width", "height", "colspan", "rowspan", "align", "valign", "bgcolor"],
      source: ["src", "srcset", "media", "type"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "cid", "data"],
    allowProtocolRelative: false,
  });
}
