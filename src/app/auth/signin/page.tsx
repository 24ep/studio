export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { redirect } from 'next/navigation';
import SignInClient from "./SignInClient";
import { getPool } from '@/lib/db';
import type { SystemSetting } from '@/lib/types';
import { isPlatformSetupRequired } from '@/lib/platform-installation';

export default async function SignInPage() {
  const [setupResult, settingsResult] = await Promise.allSettled([
    isPlatformSetupRequired(),
    getPool().query<SystemSetting>(`
      SELECT key, value, "updatedAt"
      FROM "SystemSetting"
      WHERE key LIKE 'login%'
         OR key LIKE 'mobileHeader%'
         OR key = ANY($1::text[])
      UNION ALL
      SELECT hero.key,
             localization.value::jsonb #>> ARRAY[
               'config',
               'translations',
               COALESCE(
                 localization.value::jsonb #>> '{config,defaultLanguage}',
                 localization.value::jsonb #>> '{config,fallbackLanguage}',
                 'en'
               ),
               hero.translation_key
             ] AS value,
             localization."updatedAt"
      FROM "SystemSetting" localization
      CROSS JOIN (VALUES
        ('loginHeroEyebrow', 'auth.login.hero.eyebrow'),
        ('loginHeroTitle', 'auth.login.hero.title'),
        ('loginHeroDescription', 'auth.login.hero.description')
      ) AS hero(key, translation_key)
      WHERE localization.key = 'appkitLocalizationConfig'
    `, [[
      'appLogoDataUrl',
      'appName',
      'appThemePreference',
      'organizationName',
      'primaryGradient',
      'primaryGradientEnd',
      'primaryGradientStart',
      'rightClickProtectionEnabled',
      'showLogoOnly',
    ]]),
  ]);

  const setupRequired = setupResult.status === 'fulfilled' && setupResult.value;
  if (setupResult.status === 'rejected') {
    console.warn('[SIGNIN_PAGE] Platform setup check unavailable; continuing with sign-in defaults.', setupResult.reason);
  }
  if (setupRequired) redirect('/setup');

  const settings = settingsResult.status === 'fulfilled' ? settingsResult.value.rows : [];
  if (settingsResult.status === 'rejected') {
    console.warn('[SIGNIN_PAGE] Settings unavailable; rendering with client-side defaults.', settingsResult.reason);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInClient initialSettings={settings} />
    </Suspense>
  );
}
    

    



