"use client";

import * as React from 'react';
import { ExternalLink, Pencil, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  createDefaultCompanyPortalState,
  createDefaultJobPortalState,
  parseCompanyPortalState,
  type CompanyPortalDocument,
  type CompanyPortalLiveRecords,
  type CompanyPortalState,
} from '@/lib/company-portal-builder';
import { CompanyPortalEditor } from './CompanyPortalEditor';
import {
  CompanyPortalRenderer,
  type CompanyPortalRendererVariant,
} from './CompanyPortalRenderer';
import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';

type CompanyPortalApiState = CompanyPortalState & {
  canManage: boolean;
  liveRecords: CompanyPortalLiveRecords;
};

function cloneDocument(document: CompanyPortalDocument) {
  return structuredClone(document);
}

function getLoginRedirectUrl() {
  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  return `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function CompanyPortalExperience({
  apiPath = '/api/company-portal',
  footerLabel = 'Applicant job portal',
  fullPageHref,
  portalVariant = 'job',
  saveApiPath,
  startInEditMode = false,
}: {
  apiPath?: string;
  footerLabel?: string;
  fullPageHref?: string;
  portalVariant?: CompanyPortalRendererVariant;
  saveApiPath?: string;
  startInEditMode?: boolean;
}) {
  const router = useRouter();
  const resolvedSaveApiPath = saveApiPath ?? apiPath;
  const createDefaultState = React.useMemo(
    () => (portalVariant === 'job' ? createDefaultJobPortalState : createDefaultCompanyPortalState),
    [portalVariant],
  );
  const [state, setState] = React.useState<CompanyPortalApiState>({
    ...createDefaultState(),
    canManage: false,
    liveRecords: {},
  });
  const [draft, setDraft] = React.useState<CompanyPortalDocument>(() => (
    cloneDocument(createDefaultState().document)
  ));
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const loadPortal = React.useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(apiPath, {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });

      if (response.status === 401) {
        router.replace(getLoginRedirectUrl());
        return;
      }

      if (!response.ok) {
        const errorPayload = await readJsonObject(response);
        const errorMessage = getJsonErrorMessage(
          errorPayload,
          `Failed to load company portal (${response.status} ${response.statusText})`,
        );
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const parsed = parseCompanyPortalState(data, createDefaultState());
      const nextState = {
        ...parsed,
        canManage: data.canManage === true,
        liveRecords: data.liveRecords || {},
      };
      setState(nextState);
      setDraft(cloneDocument(nextState.document));
      if (startInEditMode && nextState.canManage) {
        setIsEditing(true);
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof DOMException && error.name === 'AbortError'
        ? 'The employee portal took too long to respond.'
        : 'Company portal configuration could not be loaded.';
      setLoadError(message);
      toast.error(message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [apiPath, createDefaultState, startInEditMode]);

  React.useEffect(() => {
    void loadPortal();
  }, [loadPortal]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(state.document);

  const closeEditor = () => {
    if (isDirty && !window.confirm('Discard unsaved portal changes?')) return;
    setDraft(cloneDocument(state.document));
    setIsEditing(false);
  };

  const savePortal = async (note: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(resolvedSaveApiPath, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: draft,
          expectedRevision: state.revision,
          note: note.trim() || 'Portal content updated',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409 && data.state) {
          const latest = parseCompanyPortalState(data.state, createDefaultState());
          setState(current => ({ ...latest, canManage: current.canManage, liveRecords: {} }));
        }
        throw new Error(data.error || 'Failed to save portal');
      }

      const parsed = parseCompanyPortalState(data, createDefaultState());
      setState({ ...parsed, canManage: true, liveRecords: data.liveRecords || {} });
      setDraft(cloneDocument(parsed.document));
      toast.success(`Portal version ${parsed.revision} saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save portal');
    } finally {
      setIsSaving(false);
    }
  };

  const restoreVersion = async (versionId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(resolvedSaveApiPath, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedRevision: state.revision,
          versionId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to restore version');

      const parsed = parseCompanyPortalState(data, createDefaultState());
      setState({ ...parsed, canManage: true, liveRecords: data.liveRecords || {} });
      setDraft(cloneDocument(parsed.document));
      toast.success(`Version ${parsed.revision} created from history.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore version');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <CompanyPortalEditor
        document={draft}
        isDirty={isDirty}
        isSaving={isSaving}
        onChange={setDraft}
        onClose={closeEditor}
        onRestore={restoreVersion}
        onSave={savePortal}
        portalVariant={portalVariant}
        revision={state.revision}
        versions={state.versions}
      />
    );
  }

  return (
    <main className="relative min-h-full bg-[#f6f8fb]">
      {fullPageHref && (
        <Button
          asChild
          type="button"
          variant="outline"
          size="icon"
          className="absolute right-4 top-4 z-20 h-9 w-9 rounded-[8px] border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur hover:bg-white hover:text-slate-950"
          title="Open full page in new tab"
          aria-label="Open full page in new tab"
        >
          <Link href={fullPageHref} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      )}

      {isLoading ? (
        <div className="mx-auto max-w-6xl animate-pulse px-8 py-12">
          <div className="h-72 bg-slate-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="h-28 bg-slate-200" />
            <div className="h-28 bg-slate-200" />
            <div className="h-28 bg-slate-200" />
          </div>
        </div>
      ) : loadError ? (
        <div className="grid min-h-[60vh] place-items-center px-6 py-12" role="alert">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-slate-950">Employee portal unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{loadError}</p>
            <Button className="mt-5" onClick={() => void loadPortal()}>Retry</Button>
          </div>
        </div>
      ) : (
        <CompanyPortalRenderer document={state.document} variant={portalVariant} liveRecords={state.liveRecords} />
      )}

      <footer className="border-t border-slate-200 bg-white px-8 py-5">
        <div className="mx-auto flex max-w-6xl items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4" />
          {footerLabel}
        </div>
      </footer>

      {state.canManage && !isLoading && (
        <Button
          type="button"
          className="fixed bottom-6 right-6 z-30 h-12 rounded-full px-5 shadow-lg shadow-slate-900/20"
          onClick={() => {
            setDraft(cloneDocument(state.document));
            setIsEditing(true);
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit portal
        </Button>
      )}
    </main>
  );
}

