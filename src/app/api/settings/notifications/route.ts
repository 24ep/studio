// src/app/api/settings/notifications/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import type { NotificationEventWithSettings, NotificationSetting } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

/**
 * @openapi
 * /api/settings/notifications:
 *   get:
 *     summary: Get notification settings
 *     description: Returns the current notification settings for the system. Requires authentication and Admin or NOTIFICATION_SETTINGS_MANAGE permission.
 *     responses:
 *       200:
 *         description: Notification settings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   - id: "uuid"
 *                     event_key: "candidate_created"
 *                     label: "Candidate Created"
 *                     channels:
 *                       - channelId: "uuid"
 *                         channelKey: "email"
 *                         channelLabel: "Email"
 *                         isEnabled: true
 *                         configuration: {}
 *                         settingId: "uuid"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: "Forbidden: Insufficient permissions"
 */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('NOTIFICATION_SETTINGS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to GET notification settings by user ${session?.user?.email || 'Unknown'}.`, 'API:NotificationSettings:Get', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const eventsResult = await getPool().query('SELECT id, event_key, label, description FROM "NotificationEvent" ORDER BY label ASC');
    const channelsResult = await getPool().query('SELECT id, channel_key, label FROM "NotificationChannel"');
    const settingsResult = await getPool().query('SELECT id, event_id, channel_id, is_enabled, configuration FROM "NotificationSetting"');

    const eventsWithSettings: NotificationEventWithSettings[] = eventsResult.rows.map(event => {
      const channelsWithTheirSettings = channelsResult.rows.map(channel => {
        const setting = settingsResult.rows.find(s => s.event_id === event.id && s.channel_id === channel.id);
        return {
          channelId: channel.id,
          channelKey: channel.channel_key as 'email' | 'webhook',
          channelLabel: channel.label,
          isEnabled: setting ? setting.is_enabled : false,
          configuration: setting ? (setting.configuration as { webhookUrl?: string } | null) : null,
          settingId: setting ? setting.id : undefined,
        };
      });
      return {
        ...event,
        channels: channelsWithTheirSettings,
      };
    });

    return NextResponse.json(eventsWithSettings, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch notification settings:", error);
    await logAudit('ERROR', `Failed to fetch notification settings by ${session?.user?.name}. Error: ${(error as Error).message}`, 'API:NotificationSettings:Get', session?.user?.id);
    return NextResponse.json({ message: "Error fetching notification settings", error: (error as Error).message }, { status: 500 });
  }
}


const notificationChannelSettingSchema = z.object({
  channelId: z.string().uuid(),
  isEnabled: z.boolean(),
  configuration: z.object({ webhookUrl: z.string().url().optional().nullable() }).optional().nullable(),
});

const notificationEventSettingSchema = z.object({
  eventId: z.string().uuid(),
  channels: z.array(notificationChannelSettingSchema),
});

const updateNotificationSettingsSchema = z.array(notificationEventSettingSchema);


export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('NOTIFICATION_SETTINGS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to POST notification settings by user ${session?.user?.email || 'Unknown'}.`, 'API:NotificationSettings:Post', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateNotificationSettingsSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for notification settings", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const settingsToUpdate = validationResult.data;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    for (const eventSetting of settingsToUpdate) {
      for (const channelSetting of eventSetting.channels) {
        const upsertQuery = `
          INSERT INTO "NotificationSetting" (id, event_id, channel_id, is_enabled, configuration, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (event_id, channel_id) DO UPDATE SET
            is_enabled = EXCLUDED.is_enabled,
            configuration = EXCLUDED.configuration,
            "updatedAt" = NOW()
          RETURNING id;
        `;
        // Ensure configuration is null if not provided or if webhookUrl is empty for webhooks
        let configPayload = null;
        if (channelSetting.configuration?.webhookUrl) {
            configPayload = channelSetting.configuration;
        } else if (channelSetting.configuration && Object.keys(channelSetting.configuration).length > 0 && !channelSetting.configuration.webhookUrl) {
            // If config object exists but webhookUrl is empty/null, ensure it's saved as null or an empty object
            configPayload = { webhookUrl: null }; 
        }

        await client.query(upsertQuery, [
          uuidv4(), // For INSERT path, ON CONFLICT will use existing ID
          eventSetting.eventId,
          channelSetting.channelId,
          channelSetting.isEnabled,
          configPayload
        ]);
      }
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `Notification settings updated by ${session.user.name}. ${settingsToUpdate.length} events processed.`, 'API:NotificationSettings:Post', session.user.id, { count: settingsToUpdate.length });
    
    // Fetch and return the updated settings in the same format as GET
    const eventsResult = await client.query('SELECT id, event_key, label, description FROM "NotificationEvent" ORDER BY label ASC');
    const channelsResult = await client.query('SELECT id, channel_key, label FROM "NotificationChannel"');
    const updatedSettingsResult = await client.query('SELECT id, event_id, channel_id, is_enabled, configuration FROM "NotificationSetting"');

    const eventsWithSettings: NotificationEventWithSettings[] = eventsResult.rows.map(event => {
      const channelsWithTheirSettings = channelsResult.rows.map(channel => {
        const setting = updatedSettingsResult.rows.find(s => s.event_id === event.id && s.channel_id === channel.id);
        return {
          channelId: channel.id,
          channelKey: channel.channel_key as 'email' | 'webhook',
          channelLabel: channel.label,
          isEnabled: setting ? setting.is_enabled : false,
          configuration: setting ? (setting.configuration as { webhookUrl?: string } | null) : null,
          settingId: setting ? setting.id : undefined,
        };
      });
      return {
        ...event,
        channels: channelsWithTheirSettings,
      };
    });
    return NextResponse.json(eventsWithSettings, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to save notification settings:", error);
    await logAudit('ERROR', `Failed to save notification settings by ${session.user.name}. Error: ${error.message}`, 'API:NotificationSettings:Post', session.user.id);
    return NextResponse.json({ message: "Error saving notification settings", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

    