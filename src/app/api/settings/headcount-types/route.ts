import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';
import { z } from 'zod';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { fetchAppKitSeedCollection } from '@/lib/appkit-sdk-client';
export const dynamic = 'force-dynamic';

const headcountTypeOptionSchema = z.object({
  value: z.string().min(1, "Value is required"),
  label: z.string().min(1, "Label is required"),
  color: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const updateHeadcountTypesSchema = z.object({
  options: z.array(headcountTypeOptionSchema),
});

type HeadcountTypeOption = z.infer<typeof headcountTypeOptionSchema>;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view headcount type options
    // Users should be able to view these options if they can view positions
    if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view headcount type options' }, { status: 403 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Get headcount type options from system settings
      const result = await client.query(
        'SELECT value FROM "SystemSetting" WHERE key = $1',
        ['headcountTypeOptions']
      );

      if (result.rows.length === 0) {
        const records = await fetchAppKitSeedCollection<HeadcountTypeOption>('production', 'headcount_types');
        const options = records
          .map(record => headcountTypeOptionSchema.safeParse(record))
          .filter((result): result is z.SafeParseSuccess<HeadcountTypeOption> => result.success)
          .map(result => result.data)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (options.length) {
          await client.query(
            'INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (key) DO NOTHING',
            ['headcountTypeOptions', JSON.stringify(options)],
          );
        }
        return NextResponse.json(options);
      }

      try {
        const options = JSON.parse(result.rows[0].value);
        return NextResponse.json(options);
      } catch {
        return NextResponse.json([]);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching headcount type options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  const environment = bodyResult.ok && bodyResult.value && typeof bodyResult.value === 'object'
    && (bodyResult.value as { environment?: unknown }).environment === 'development'
    ? 'development'
    : 'production';
  const records = await fetchAppKitSeedCollection<HeadcountTypeOption>(environment, 'headcount_types');
  const options = records
    .map(record => headcountTypeOptionSchema.safeParse(record))
    .filter((result): result is z.SafeParseSuccess<HeadcountTypeOption> => result.success)
    .map(result => result.data)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (!options.length) {
    return NextResponse.json({ error: `No headcount types found in AppKit ${environment}.` }, { status: 404 });
  }
  await getPool().query(
    'INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (key) DO NOTHING',
    ['headcountTypeOptions', JSON.stringify(options)],
  );
  return NextResponse.json({ count: options.length, environment });
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage system settings
    if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = bodyResult.value;
    const validationResult = updateHeadcountTypesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;
    const options = validatedData.options;

    // Validate that at least one option is active
    const activeOptions = options.filter(opt => opt.isActive);
    if (activeOptions.length === 0) {
      return NextResponse.json({ 
        error: 'At least one headcount type option must be active' 
      }, { status: 400 });
    }

    // Validate unique values
    const values = options.map(opt => opt.value);
    const uniqueValues = new Set(values);
    if (values.length !== uniqueValues.size) {
      return NextResponse.json({ 
        error: 'Headcount type values must be unique' 
      }, { status: 400 });
    }

    // Upsert the setting
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Check if setting exists
      const existingResult = await client.query(
        'SELECT key FROM "SystemSetting" WHERE key = $1',
        ['headcountTypeOptions']
      );

      if (existingResult.rows.length > 0) {
        // Update existing setting
        await client.query(
          'UPDATE "SystemSetting" SET value = $1, "updatedAt" = NOW() WHERE key = $2',
          [JSON.stringify(options), 'headcountTypeOptions']
        );
      } else {
        // Insert new setting
        await client.query(
          'INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
          ['headcountTypeOptions', JSON.stringify(options)]
        );
      }
    } finally {
      client.release();
    }

    return NextResponse.json({ message: 'Headcount type options updated successfully' });
  } catch (error) {
    console.error('Error updating headcount type options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
