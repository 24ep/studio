'use client';

import * as React from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  Database,
  History,
  Loader2,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DATA_OPERATION_MODELS,
  downloadImportTemplate,
  exportData,
  getImportFileError,
  importData,
  type DataOperationModelId,
  type ExportFormat,
  type ImportResult,
} from './data-operations-api';
import {
  EMPTY_FILTERS,
  getTransferDomainCount,
  isSystemTransferModel,
  type ApplicantExportFilters,
} from './DataOperationsModel';
import {
  ActivityPanel,
  ChooseDataStep,
  ExportConfigureStep,
  FlowSummary,
  ImportConfigureStep,
  ReviewStep,
  StepRail,
  type ActivityView,
} from './DataOperationsParts';

type WorkspaceTab = 'import' | 'export' | 'activity';

export function DataOperationsWorkspace() {
  const searchParams = useSearchParams();
  const requestedTab = (() => {
    const requestedMode = searchParams.get('mode');
    return requestedMode === 'import' || requestedMode === 'export' || requestedMode === 'activity'
      ? requestedMode
      : null;
  })();

  const [tab, setTab] = React.useState<WorkspaceTab>(requestedTab ?? 'import');
  const [step, setStep] = React.useState(1);
  const [modelId, setModelId] = React.useState<DataOperationModelId>('applicants');
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState<ExportFormat>('excel');
  const [filters, setFilters] = React.useState<ApplicantExportFilters>(EMPTY_FILTERS);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [activityView, setActivityView] = React.useState<ActivityView>('data');
  const model = DATA_OPERATION_MODELS.find(item => item.id === modelId) ?? DATA_OPERATION_MODELS[0];

  const resetFlow = React.useCallback((nextTab: WorkspaceTab) => {
    setTab(nextTab);
    setStep(1);
    setFile(null);
    setResult(null);
    setFormat('excel');
    setFilters(EMPTY_FILTERS);
  }, []);

  const selectTab = (nextTab: WorkspaceTab) => {
    if (nextTab === 'activity') {
      setTab(nextTab);
      return;
    }
    resetFlow(nextTab);
  };

  const selectModel = (id: DataOperationModelId) => {
    const nextModel = DATA_OPERATION_MODELS.find(item => item.id === id);
    setModelId(id);
    setFile(null);
    setResult(null);
    setFormat(isSystemTransferModel(id) ? 'jsonl' : 'excel');
    setFilters({
      ...EMPTY_FILTERS,
      transferDomains: nextModel?.systemTransferDomain || EMPTY_FILTERS.transferDomains,
    });
  };

  React.useEffect(() => {
    if (!requestedTab) return;
    resetFlow(requestedTab);
  }, [requestedTab, resetFlow]);

  const handleTemplateDownload = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadImportTemplate(modelId);
      toast.success(`${model.name} template downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not download the template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFile = (nextFile: File | null) => {
    const fileError = getImportFileError(modelId, nextFile);
    if (fileError) {
      setFile(null);
      toast.error(fileError);
      return;
    }
    setFile(nextFile);
    setResult(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      if (tab === 'import') {
        if (!file) throw new Error('Choose a file before starting the import.');
        const importResult = await importData(modelId, file);
        setResult(importResult);
        toast.success(importResult.summary);
      } else {
        const queued = await exportData(modelId, format, { ...filters });
        setResult({ ...queued, summary: `${model.name} export added to the queue.` });
        toast.success(`${model.name} export added to the queue`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${tab === 'import' ? 'Import' : 'Export'} failed`);
    } finally {
      setIsRunning(false);
    }
  };

  const hasTransferDomains = !isSystemTransferModel(modelId) || getTransferDomainCount(filters) > 0;
  const canContinue = step === 1 || (tab === 'export' ? hasTransferDomains : Boolean(file));

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,hsl(var(--muted)/.35),transparent_22rem)]">
      <header className="border-b bg-background/95 px-4 pt-5 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="pb-5">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Database className="h-3.5 w-3.5" /> Data operations
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Import &amp; Export</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Move platform data with a guided, review-before-run workflow.</p>
          </div>
          <nav className="flex gap-6 overflow-x-auto" aria-label="Data operations">
            {([
              ['import', 'Import data', ArrowUpFromLine],
              ['export', 'Export data', ArrowDownToLine],
              ['activity', 'Queue activity', History],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={cn('relative flex h-11 shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', tab === id && 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary')}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        {tab === 'activity' ? (
          <ActivityPanel view={activityView} onViewChange={setActivityView} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              <StepRail current={step} mode={tab} />
              <div className="mt-5 overflow-hidden rounded-xl border bg-background">
                {step === 1 && <ChooseDataStep selected={modelId} onSelect={selectModel} />}
                {step === 2 && tab === 'import' && <ImportConfigureStep model={model} file={file} isDownloading={isDownloadingTemplate} onDownload={handleTemplateDownload} onFile={handleFile} />}
                {step === 2 && tab === 'export' && <ExportConfigureStep model={model} format={format} filters={filters} onFormat={setFormat} onFilters={setFilters} />}
                {step === 3 && <ReviewStep mode={tab} model={model} file={file} format={format} filters={filters} result={result} />}
                <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-5 py-4">
                  <Button variant="ghost" onClick={() => (step === 1 ? resetFlow(tab) : setStep(value => value - 1))} disabled={isRunning || step === 1}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  {step < 3 ? (
                    <Button onClick={() => setStep(value => value + 1)} disabled={!canContinue}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  ) : result ? (
                    <Button variant="outline" onClick={() => resetFlow(tab)}><RotateCcw className="mr-2 h-4 w-4" /> Start another</Button>
                  ) : (
                    <Button onClick={handleRun} disabled={isRunning || (tab === 'import' && !file) || (tab === 'export' && !hasTransferDomains)}>
                      {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : tab === 'import' ? <UploadCloud className="mr-2 h-4 w-4" /> : <ArrowDownToLine className="mr-2 h-4 w-4" />}
                      {isRunning ? 'Adding to queue…' : tab === 'import' ? `Queue ${model.name} import` : `Queue ${model.name} export`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <FlowSummary mode={tab} step={step} model={model} file={file} format={format} filters={filters} />
          </div>
        )}
      </main>
    </div>
  );
}
