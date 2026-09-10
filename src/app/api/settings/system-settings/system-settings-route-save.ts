import { NextResponse, type NextRequest } from 'next/server';
import { saveSystemSettingsSchema } from './system-settings-route-schema';
import type { Session } from 'next-auth';
import { parseSettingsToSave } from './system-settings-route-parse-save';
import { saveValidatedSystemSettings } from './system-settings-route-save-db';
import { normalizeEmployeeEmailDomain } from '@/lib/employee-email-address';

function normalizeOrganizationProfileDomain(
  settings: Array<{ key: string; value: string | null }>,
): NextResponse | null {
  const organizationSetting = settings.find(setting => setting.key === 'organizationProfile');
  if (!organizationSetting?.value) return null;

  try {
    const profile = JSON.parse(organizationSetting.value) as Record<string, unknown>;
    const rawDomain = profile.employeeEmailDomain;
    if (rawDomain === undefined || rawDomain === null || rawDomain === '') return null;
    if (typeof rawDomain !== 'string') {
      return NextResponse.json({ message: 'Company Email Domain must be text.' }, { status: 400 });
    }

    const normalizedDomain = normalizeEmployeeEmailDomain(rawDomain);
    if (!normalizedDomain) {
      return NextResponse.json({
        message: 'Enter a valid Company Email Domain such as company.com.',
      }, { status: 400 });
    }
    profile.employeeEmailDomain = normalizedDomain;
    organizationSetting.value = JSON.stringify(profile);
    return null;
  } catch {
    return NextResponse.json({ message: 'Organization profile must be valid JSON.' }, { status: 400 });
  }
}

export async function handleSaveSystemSettings(request: NextRequest, session: Session) {
  const parsedSettings = await parseSettingsToSave(request);
  if (parsedSettings instanceof NextResponse) {
    return parsedSettings;
  }

  const validationResult = saveSystemSettingsSchema.safeParse(parsedSettings);
  if (!validationResult.success) {
    console.error('System settings validation failed:', validationResult.error.flatten().fieldErrors);
    console.error('Data that failed validation:', JSON.stringify(parsedSettings, null, 2));
    return NextResponse.json(
      {
        message: 'Invalid input for system settings',
        errors: validationResult.error.flatten().fieldErrors,
        data: parsedSettings,
      },
      { status: 400 }
    );
  }

  const domainValidationResponse = normalizeOrganizationProfileDomain(validationResult.data);
  if (domainValidationResponse) return domainValidationResponse;

  return saveValidatedSystemSettings(validationResult.data, session);
}
