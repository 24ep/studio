// src/app/api/settings/system-settings/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import type { SystemSetting, SystemSettingKey } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { MINIO_PUBLIC_BASE_URL, minioClient, MINIO_BUCKET } from '@/lib/minio';

/**
 * @openapi
 * /api/settings/system-settings:
 *   get:
 *     summary: Get system settings
 *     responses:
 *       200:
 *         description: System settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *   post:
 *     summary: Update system settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: System settings updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

const systemSettingKeyEnum = z.enum([
    'appName', 'appLogoDataUrl', 'appThemePreference',
    'primaryGradientStart', 'primaryGradientEnd',
    'smtpHost', 'smtpPort', 'smtpUser', 'smtpSecure', 'smtpFromEmail',
    'resumeProcessingWebhookUrl',
    'generalPdfWebhookUrl', 'geminiApiKey',
    'loginPageBackgroundType', 'loginPageBackgroundImageUrl', 
    'loginPageBackgroundColor1', 'loginPageBackgroundColor2',
    'loginPageLayoutType',
    // Sidebar Light Theme
    'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL',
    'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL',
    'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
    // Sidebar Dark Theme
    'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD',
    'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD',
    'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD',
    'appFontFamily',
    'loginPageContent',
    'maxConcurrentProcessors',
]);


const systemSettingSchema = z.object({
  key: systemSettingKeyEnum,
  value: z.string().nullable(),
});

const saveSystemSettingsSchema = z.array(systemSettingSchema);

export async function GET(request: NextRequest) {
  // Publicly accessible or light auth check if needed for non-sensitive parts
  try {
    const result = await getPool().query('SELECT key, value, "updatedAt" FROM "SystemSetting"');
    const settings = Object.fromEntries(result.rows.map(row => [row.key, row.value]));
    // Fallback for resumeProcessingWebhookUrl
    if (!settings.resumeProcessingWebhookUrl) {
      settings.resumeProcessingWebhookUrl = process.env.RESUME_PROCESSING_WEBHOOK_URL || 'http://localhost:5678/webhook';
    }
    // Fallback for generalPdfWebhookUrl
    if (!settings.generalPdfWebhookUrl) {
      settings.generalPdfWebhookUrl = process.env.GENERAL_PDF_WEBHOOK_URL || '';
    }
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return NextResponse.json({ message: "Error fetching system settings", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to update system settings by user ${session?.user?.email || 'Unknown'}.`, 'API:SystemSettings:Update', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = saveSystemSettingsSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for system settings", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const settingsToSave = validationResult.data;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const savedSettings: SystemSetting[] = [];

    for (const setting of settingsToSave) {
      const upsertQuery = `
        INSERT INTO "SystemSetting" (key, value, "updatedAt")
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          "updatedAt" = NOW()
        RETURNING key, value, "updatedAt";
      `;
      const result = await client.query(upsertQuery, [setting.key, setting.value]);
      savedSettings.push(result.rows[0]);
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `System settings updated by ${session.user.name}. Keys: ${settingsToSave.map(s=>s.key).join(', ')}`, 'API:SystemSettings:Update', session.user.id, { updatedKeys: settingsToSave.map(s=>s.key) });
    
    // Return all current settings after update as an object (key-value pairs)
    const allSettingsResult = await client.query('SELECT key, value, "updatedAt" FROM "SystemSetting"');
    const settings = Object.fromEntries(allSettingsResult.rows.map(row => [row.key, row.value]));
    // Fallback for resumeProcessingWebhookUrl
    if (!settings.resumeProcessingWebhookUrl) {
      settings.resumeProcessingWebhookUrl = process.env.RESUME_PROCESSING_WEBHOOK_URL || 'http://localhost:5678/webhook';
    }
    // Fallback for generalPdfWebhookUrl
    if (!settings.generalPdfWebhookUrl) {
      settings.generalPdfWebhookUrl = process.env.GENERAL_PDF_WEBHOOK_URL || '';
    }
    return NextResponse.json(settings, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to save system settings:", error);
    await logAudit('ERROR', `Failed to save system settings by ${session.user.name}. Error: ${error.message}`, 'API:SystemSettings:Update', session.user.id);
    return NextResponse.json({ message: "Error saving system settings", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// New endpoint: POST /api/settings/upload-image
export async function PUT(request: NextRequest) {
  // Only allow Admin or SYSTEM_SETTINGS_MANAGE
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to upload settings image by user ${session?.user?.email || 'Unknown'}.`, 'API:SystemSettings:UploadImage', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!(file as File).type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  const ext = (file as File).name.split('.').pop();
  const objectName = `settings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await (file as File).arrayBuffer());
  await getPool(); // Ensure DB pool is initialized (if needed for MinIO)
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': (file as File).type,
  });
  const publicUrl = `${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${objectName}`;
  return NextResponse.json({ url: publicUrl });
}
