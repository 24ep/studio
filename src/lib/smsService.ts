import { getSystemSetting } from "./systemSettings";

export type SmsProvider = "webhook" | "twilio";

export interface SmsConfig {
  enabled: boolean;
  provider: SmsProvider;
  webhookUrl: string;
  webhookToken: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
}

export async function getSmsConfig(): Promise<SmsConfig | null> {
  const enabled = await getSystemSetting("broadcastSmsEnabled");
  if (enabled !== "true") {
    return null;
  }

  const provider = await getSystemSetting("broadcastSmsProvider");

  return {
    enabled: true,
    provider: provider === "twilio" ? "twilio" : "webhook",
    webhookUrl: await getSystemSetting("broadcastSmsWebhookUrl") || "",
    webhookToken: await getSystemSetting("broadcastSmsWebhookToken") || "",
    twilioAccountSid: await getSystemSetting("broadcastSmsTwilioAccountSid") || "",
    twilioAuthToken: await getSystemSetting("broadcastSmsTwilioAuthToken") || "",
    twilioFromNumber: await getSystemSetting("broadcastSmsTwilioFromNumber") || "",
  };
}

export async function sendSms(
  to: string,
  message: string,
): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  try {
    const config = await getSmsConfig();
    if (!config) {
      return { success: false, error: "SMS broadcasts are disabled in System Settings" };
    }

    return config.provider === "twilio"
      ? sendTwilioSms(config, to, message)
      : sendWebhookSms(config, to, message);
  } catch (error) {
    console.error("[SmsService] Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending SMS",
    };
  }
}

async function sendWebhookSms(config: SmsConfig, to: string, message: string) {
  if (!config.webhookUrl) {
    return { success: false, error: "SMS webhook URL is not configured" };
  }

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.webhookToken ? { Authorization: `Bearer ${config.webhookToken}` } : {}),
    },
    body: JSON.stringify({ to, message }),
  });

  if (!response.ok) {
    return { success: false, error: `SMS webhook returned ${response.status}` };
  }

  return { success: true };
}

async function sendTwilioSms(config: SmsConfig, to: string, message: string) {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromNumber) {
    return { success: false, error: "Twilio SMS settings are incomplete" };
  }

  const body = new URLSearchParams({
    To: to,
    From: config.twilioFromNumber,
    Body: message,
  });
  const authToken = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString("base64");

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.twilioAccountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      error: typeof responseBody.message === "string" ? responseBody.message : `Twilio returned ${response.status}`,
    };
  }

  return {
    success: true,
    providerMessageId: typeof responseBody.sid === "string" ? responseBody.sid : undefined,
  };
}
