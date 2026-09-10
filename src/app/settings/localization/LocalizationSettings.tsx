'use client';

import { useEffect, useMemo, useState } from 'react';
import { DownloadCloud, Languages, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMissingLocalizationKeys } from '@/lib/localization-utils';
import type { StoredLocalizationConfig } from '@/lib/localization-config';

type LanguageCoverage = {
  language: {
    code: string;
    nativeName?: string | null;
    name?: string | null;
  };
  count: number;
  translated: number;
  missing: string[];
};

export function LocalizationSettings() {
  const [snapshot, setSnapshot] = useState<StoredLocalizationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appKitLoad, setAppKitLoad] = useState<{
    environment: 'development' | 'production';
    percent: number;
    message: string;
  } | null>(null);
  const { common, locale, t } = useLocalization();

  const load = async (
    method: 'GET' | 'POST' = 'GET',
    environment: 'development' | 'production' = 'production',
  ) => {
    setIsLoading(true);
    try {
      if (method === 'POST') {
        setAppKitLoad({ environment, percent: 10, message: 'Preparing request' });
      }
      const response = await fetch('/api/localization', {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify({ environment }) : undefined,
        cache: 'no-store',
      });
      if (method === 'POST') {
        setAppKitLoad((current) => current ? { ...current, percent: 50, message: 'Downloading localization data' } : null);
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to load localization');
      setSnapshot(payload);
      if (method === 'POST') {
        setAppKitLoad((current) => current ? { ...current, percent: 95, message: 'Applying localization' } : null);
        toast.success(`Localization loaded from AppKit ${environment}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load localization');
    } finally {
      setIsLoading(false);
      if (method === 'POST') {
        setAppKitLoad(null);
      }
    }
  };

  useEffect(() => { void load(); }, []);

  const config = snapshot?.config;
  const languages = config?.supportedLanguages || [];
  const packageCount = Array.isArray(config?.packages) ? config.packages.length : 0;

  const languageCoverage = useMemo<LanguageCoverage[]>(() => {
    if (!config || !languages.length) return [];
    return languages.map((language) => {
      const coverage = getMissingLocalizationKeys(config, language.code);

      return {
        language,
        count: coverage.count,
        translated: coverage.translated,
        missing: coverage.missing,
      };
    });
  }, [config, languages]);

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              {t('settings.localization.title', 'Localization')}
            </CardTitle>
            <CardDescription>
              {t(
                'settings.localization.description',
                'Language configuration and translations loaded from AppKit at initial application load.',
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || !!appKitLoad}
              onClick={() => void load('POST', 'development')}
            >
              {appKitLoad && appKitLoad.environment === 'development'
              ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {appKitLoad.percent}% {t('settings.localization.loadingSeparator', '-')} {t('settings.localization.statusMessage', appKitLoad.message)}
                  </>
                )
                : (
                  <>
                    <DownloadCloud className="mr-1.5 h-4 w-4" />
                    {t('settings.localization.loadDev', 'Load development translations')}
                  </>
                )}
            </Button>
            <Button
              size="sm"
              disabled={isLoading || !!appKitLoad}
              onClick={() => void load('POST', 'production')}
            >
              {appKitLoad && appKitLoad.environment === 'production'
                ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {appKitLoad.percent}% {t('settings.localization.loadingSeparator', '-')} {t('settings.localization.statusMessage', appKitLoad.message)}
                  </>
                )
                : (
                  <>
                    <DownloadCloud className="mr-1.5 h-4 w-4" />
                    {t('settings.localization.loadProduction', 'Load live translations')}
                  </>
                )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">{t('settings.localization.status', 'Status')}</dt>
              <dd className="font-medium">{config?.enabled ? t('settings.localization.enabled', 'Enabled') : t('settings.localization.disabled', 'Disabled')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('settings.localization.defaultLanguage', 'Default language')}</dt>
              <dd className="font-medium">{config?.defaultLanguage || common.notSet}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('settings.localization.languages', 'Languages')}</dt>
              <dd className="font-medium">
                {languages.map((item) => item.nativeName || item.name || item.code).join(', ') || common.notSet}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('settings.localization.packages', 'Translation packages')}</dt>
              <dd className="font-medium">{packageCount}</dd>
            </div>
          </dl>
          {snapshot?.loadedAt && (
            <p className="mt-4 text-xs text-muted-foreground">
              {t('settings.localization.lastLoaded', 'Last loaded')} {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.loadedAt))} {t('settings.localization.fromEnvironment', 'from')} {snapshot.environment}.
            </p>
          )}
          {languageCoverage.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-medium">{t('settings.localization.keywordCoverage', 'Translation coverage')}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {languageCoverage.map(({ language, count, translated }) => (
                  <span key={language.code} className="rounded border bg-muted/40 px-2 py-1 text-xs">
                    {language.nativeName || language.name || language.code}: {translated}/{count}
                  </span>
                ))}
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  {t('settings.localization.missingSummary', 'Show missing translation keys')}
                </summary>
                <div className="mt-2 space-y-3">
                  {languageCoverage.map(({ language, missing }) => (
                    <div key={language.code}>
                      <p className="text-xs font-medium">
                        {language.nativeName || language.name || language.code}
                      </p>
                      {missing.length > 0 ? (
                        <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                          {missing.map((key) => (
                            <li key={key}>{key}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">{t('settings.localization.noMissing', 'No missing translations')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
