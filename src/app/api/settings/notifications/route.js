// src/app/api/settings/notifications/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
/**
 * @openapi
 * /api/settings/notifications:
 *   get:
 *     summary: Get notification settings
 *     description: Returns all notification event/channel settings. Requires Admin or NOTIFICATION_SETTINGS_MANAGE permission.
 *     responses:
 *       200:
 *         description: List of notification event/channel settings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 *   post:
 *     summary: Update notification settings
 *     description: Updates notification event/channel settings. Requires Admin or NOTIFICATION_SETTINGS_MANAGE permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Updated notification settings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 */
export const dynamic = "force-dynamic";
export async function GET(request) {
    var _a, _b, _c, _d, _e, _f, _g;
    const session = await getServerSession(authOptions);
    if (((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) !== 'Admin' && !((_c = (_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.modulePermissions) === null || _c === void 0 ? void 0 : _c.includes('NOTIFICATION_SETTINGS_MANAGE'))) {
        await logAudit('WARN', `Forbidden attempt to GET notification settings by user ${((_d = session === null || session === void 0 ? void 0 : session.user) === null || _d === void 0 ? void 0 : _d.email) || 'Unknown'}.`, 'API:NotificationSettings:Get', (_e = session === null || session === void 0 ? void 0 : session.user) === null || _e === void 0 ? void 0 : _e.id);
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }
    try {
        const eventsResult = await getPool().query('SELECT id, event_key, label, description FROM "NotificationEvent" ORDER BY label ASC');
        const channelsResult = await getPool().query('SELECT id, channel_key, label FROM "NotificationChannel"');
        const settingsResult = await getPool().query('SELECT id, event_id, channel_id, is_enabled, configuration FROM "NotificationSetting"');
        const eventsWithSettings = eventsResult.rows.map(event => {
            const channelsWithTheirSettings = channelsResult.rows.map(channel => {
                const setting = settingsResult.rows.find(s => s.event_id === event.id && s.channel_id === channel.id);
                return {
                    channelId: channel.id,
                    channelKey: channel.channel_key,
                    channelLabel: channel.label,
                    isEnabled: setting ? setting.is_enabled : false,
                    configuration: setting ? setting.configuration : null,
                    settingId: setting ? setting.id : undefined,
                };
            });
            return Object.assign(Object.assign({}, event), { channels: channelsWithTheirSettings });
        });
        return NextResponse.json(eventsWithSettings, { status: 200 });
    }
    catch (error) {
        console.error("Failed to fetch notification settings:", error);
        await logAudit('ERROR', `Failed to fetch notification settings by ${(_f = session === null || session === void 0 ? void 0 : session.user) === null || _f === void 0 ? void 0 : _f.name}. Error: ${error.message}`, 'API:NotificationSettings:Get', (_g = session === null || session === void 0 ? void 0 : session.user) === null || _g === void 0 ? void 0 : _g.id);
        return NextResponse.json({ message: "Error fetching notification settings", error: error.message }, { status: 500 });
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
export async function POST(request) {
    var _a, _b, _c, _d, _e, _f;
    const session = await getServerSession(authOptions);
    if (((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.role) !== 'Admin' && !((_c = (_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.modulePermissions) === null || _c === void 0 ? void 0 : _c.includes('NOTIFICATION_SETTINGS_MANAGE'))) {
        await logAudit('WARN', `Forbidden attempt to POST notification settings by user ${((_d = session === null || session === void 0 ? void 0 : session.user) === null || _d === void 0 ? void 0 : _d.email) || 'Unknown'}.`, 'API:NotificationSettings:Post', (_e = session === null || session === void 0 ? void 0 : session.user) === null || _e === void 0 ? void 0 : _e.id);
        return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch (error) {
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }
    const validationResult = updateNotificationSettingsSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input for notification settings", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
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
                if ((_f = channelSetting.configuration) === null || _f === void 0 ? void 0 : _f.webhookUrl) {
                    configPayload = channelSetting.configuration;
                }
                else if (channelSetting.configuration && Object.keys(channelSetting.configuration).length > 0 && !channelSetting.configuration.webhookUrl) {
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
        const eventsWithSettings = eventsResult.rows.map(event => {
            const channelsWithTheirSettings = channelsResult.rows.map(channel => {
                const setting = updatedSettingsResult.rows.find(s => s.event_id === event.id && s.channel_id === channel.id);
                return {
                    channelId: channel.id,
                    channelKey: channel.channel_key,
                    channelLabel: channel.label,
                    isEnabled: setting ? setting.is_enabled : false,
                    configuration: setting ? setting.configuration : null,
                    settingId: setting ? setting.id : undefined,
                };
            });
            return Object.assign(Object.assign({}, event), { channels: channelsWithTheirSettings });
        });
        return NextResponse.json(eventsWithSettings, { status: 200 });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error("Failed to save notification settings:", error);
        await logAudit('ERROR', `Failed to save notification settings by ${session.user.name}. Error: ${error.message}`, 'API:NotificationSettings:Post', session.user.id);
        return NextResponse.json({ message: "Error saving notification settings", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
