"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DownloadCloud, Plus } from 'lucide-react';

import {
  getAdminCenterTabFromSlug,
  type SettingsPageItem,
} from './settings-page-model';
import { buildEmbeddedSettingsHref } from './admin-center-config-drawer-utils';
import { OPEN_FIELD_CREATION_EVENT } from './field-management/field-management-events';
import {
  CREATE_APPLICANT_SOURCE_EVENT,
  LOAD_APPLICANT_SOURCES_EVENT,
} from './applicant-sources/applicant-sources-events';
import { OPEN_SYSTEM_API_KEY_CREATION_EVENT } from '../../components/settings/system-api-key-events';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { HrSetupWorkspace } from './HrSetupWorkspace';
import { RolesPermissionsWorkspace } from './RolesPermissionsWorkspace';
import { ManageUsersPageContent } from './users/ManageUsersPageContent';
import { BillingWorkspace } from './billing/BillingWorkspace';
import { AuditControlsWorkspace } from '../../components/audit-controls/AuditControlsWorkspace';
import {
  buildSettingsSections,
  getSettingsItemIcon,
  getSettingsItemKey,
  InlineAdminCenterConfigSkeleton,
  SettingsConfigurationSidebar,
  SettingsPageEmptyState,
  SettingsPageLoadingState,
  SettingsTabEmptyState,
} from './SettingsPageParts';

export {
  getSettingsItemIcon,
  getSettingsItemKey,
  hasSettingsItemIcon,
} from './SettingsPageParts';

export function SettingsPageView({
  accessibleItems,
  isLoading,
}: {
  accessibleItems: SettingsPageItem[];
  isLoading: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSystemTab = searchParams.get('systemTab');
  const requestedConfig = searchParams.get('config');
  const requestedConfigArea = searchParams.get('configArea');
  const requestedSystemItem = requestedSystemTab
    ? accessibleItems.find(item => (
        item.href.startsWith('/settings/system-settings')
        && new URL(item.href, 'https://admin.local').searchParams.get('tab') === requestedSystemTab
      ))
    : null;
  const requestedConfigItem = requestedConfig
    ? accessibleItems.find(item => {
        const itemPath = item.href.split('?', 1)[0];
        const pathMatches = itemPath === `/settings/${requestedConfig}` || itemPath === `/${requestedConfig}`;
        if (!pathMatches || !requestedConfigArea) return pathMatches;
        return new URL(item.href, 'https://admin.local').searchParams.get('area') === requestedConfigArea;
      })
    : null;
  const activeTab = searchParams.has('adminTab')
    ? getAdminCenterTabFromSlug(searchParams.get('adminTab'))
    : requestedSystemItem?.tab ?? requestedConfigItem?.tab ?? getAdminCenterTabFromSlug(null);
  const [selectedItemKey, setSelectedItemKey] = useState('');
  const sections = useMemo(
    () => buildSettingsSections(accessibleItems.filter(item => item.tab === activeTab)),
    [accessibleItems, activeTab],
  );
  const visibleItems = useMemo(
    () => sections.flatMap(section => section.items),
    [sections],
  );
  const selectedItem = visibleItems.find(item => getSettingsItemKey(item) === selectedItemKey)
    ?? (requestedSystemItem?.tab === activeTab ? requestedSystemItem : null)
    ?? (requestedConfigItem?.tab === activeTab ? requestedConfigItem : null)
    ?? visibleItems[0]
    ?? null;

  useEffect(() => {
    if (requestedConfigItem?.tab === activeTab) {
      setSelectedItemKey(getSettingsItemKey(requestedConfigItem));
    }
  }, [activeTab, requestedConfigItem]);

  useEffect(() => {
    if (isLoading || visibleItems.length === 0 || activeTab === 'Billing') return;

    const prefetchVisibleItems = () => {
      visibleItems.forEach(item => {
        router.prefetch(buildEmbeddedSettingsHref(item.href));
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(prefetchVisibleItems, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchVisibleItems, 300);
    return () => globalThis.clearTimeout(timeoutId);
  }, [activeTab, isLoading, router, visibleItems]);

  if (isLoading) return <SettingsPageLoadingState />;

  if (activeTab === 'HR Setup') {
    return (
      <HrSetupWorkspace
        items={accessibleItems.filter(item => item.tab === 'HR Setup')}
        requestedItem={requestedConfigItem?.tab === 'HR Setup' ? requestedConfigItem : null}
      />
    );
  }

  if (activeTab === 'Roles & Permissions') return <RolesPermissionsWorkspace />;
  if (activeTab === 'User Accounts') return <ManageUsersPageContent accountsOnly />;
  if (activeTab === 'Billing') return <BillingWorkspace />;

  return (
    <div className="settings-page-grid flex h-full min-h-0 flex-col text-[#20242c] dark:text-zinc-100">
      {accessibleItems.length === 0 ? (
        <SettingsPageEmptyState />
      ) : sections.length === 0 || !selectedItem ? (
        <SettingsTabEmptyState tab={activeTab} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <SettingsConfigurationSidebar
            activeItem={selectedItem}
            sections={sections}
            onPrefetchItem={(item) => router.prefetch(buildEmbeddedSettingsHref(item.href))}
            onSelectItem={(item) => setSelectedItemKey(getSettingsItemKey(item))}
          />
          <main className="min-h-[560px] min-w-0 flex-1 overflow-hidden lg:min-h-0">
            <InlineAdminCenterConfig item={selectedItem} flush />
          </main>
        </div>
      )}
    </div>
  );
}

function InlineAdminCenterConfig({
  item,
  flush = false,
}: {
  item: SettingsPageItem;
  flush?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embeddedHref = useMemo(() => buildEmbeddedSettingsHref(item.href), [item.href]);
  const ItemIcon = getSettingsItemIcon(item.label);
  const isFieldManagement = item.href.split('?', 1)[0] === '/settings/field-management';
  const isApplicantSources = item.href.split('?', 1)[0] === '/settings/applicant-sources';
  const isAuditControls = item.href.split('?', 1)[0] === '/audit-controls';
  const isSystemApiKeys = item.href.startsWith('/settings/system-settings')
    && new URL(item.href, 'https://admin.local').searchParams.get('tab') === 'system-api-keys';

  useEffect(() => {
    setIsLoading(true);
    setLoadFailed(false);
    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
      setLoadFailed(true);
    }, 8000);
    return () => window.clearTimeout(timeoutId);
  }, [embeddedHref]);

  const openFieldCreationForm = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: OPEN_FIELD_CREATION_EVENT },
      window.location.origin,
    );
  };

  const openSystemApiKeyCreationDialog = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: OPEN_SYSTEM_API_KEY_CREATION_EVENT },
      window.location.origin,
    );
  };

  const sendApplicantSourcesEvent = (
    type: typeof CREATE_APPLICANT_SOURCE_EVENT | typeof LOAD_APPLICANT_SOURCES_EVENT,
    environment?: 'development' | 'production',
  ) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type, environment },
      window.location.origin,
    );
  };

  if (isAuditControls) {
    return (
      <div className="h-full min-h-0 overflow-y-auto bg-background">
        <AuditControlsWorkspace />
      </div>
    );
  }

  return (
    <section
      className={cn(
        'flex min-h-[520px] flex-col overflow-hidden bg-white dark:bg-zinc-900',
        flush
          ? 'h-full min-h-0'
          : 'h-[calc(100dvh-170px)] rounded-[4px] border border-[#dfe2e8] shadow-[0_1px_3px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:shadow-none',
      )}
    >
      <div className="shrink-0 border-b border-[#dfe2e8] bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] border border-[#e1e6ed] bg-[#f7f9fc] text-[#55709a] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <ItemIcon className="h-4 w-4" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[13px] font-semibold leading-4 tracking-normal">{item.label}</h2>
              <p className="mt-0.5 truncate text-xs leading-4 text-[#777c86] dark:text-zinc-400">{item.description}</p>
            </div>
          </div>
          {isFieldManagement && (
            <Button className="shrink-0" size="sm" disabled={isLoading} onClick={openFieldCreationForm}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Field
            </Button>
          )}
          {isSystemApiKeys && (
            <Button className="shrink-0" size="sm" disabled={isLoading} onClick={openSystemApiKeyCreationDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create API Key
            </Button>
          )}
          {isApplicantSources && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => sendApplicantSourcesEvent(LOAD_APPLICANT_SOURCES_EVENT, 'development')}
              >
                <DownloadCloud className="mr-1.5 h-4 w-4" />
                Load development settings
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => sendApplicantSourcesEvent(LOAD_APPLICANT_SOURCES_EVENT, 'production')}
              >
                <DownloadCloud className="mr-1.5 h-4 w-4" />
                Load live settings
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isLoading}
                onClick={() => sendApplicantSourcesEvent(CREATE_APPLICANT_SOURCE_EVENT)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Source
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-[#f5f6f9] dark:bg-zinc-950">
        {isLoading && <InlineAdminCenterConfigSkeleton />}
        {loadFailed && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-[#f5f6f9] p-6 dark:bg-zinc-950" role="alert">
            <div className="max-w-md text-center">
              <h3 className="text-base font-semibold">Configuration took too long to load</h3>
              <p className="mt-2 text-sm text-muted-foreground">Check the service connection, then retry this configuration.</p>
              <Button className="mt-4" onClick={() => {
                setLoadFailed(false);
                setIsLoading(true);
                if (iframeRef.current) iframeRef.current.src = embeddedHref;
              }}>Retry</Button>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={embeddedHref}
          src={embeddedHref}
          title={`${item.label} configuration`}
          className={cn(
            'absolute inset-0 block h-full w-full border-0 bg-background transition-opacity',
            isLoading ? 'opacity-0' : 'opacity-100',
          )}
          onLoad={() => {
            setLoadFailed(false);
            setIsLoading(false);
          }}
        />
      </div>
    </section>
  );
}
