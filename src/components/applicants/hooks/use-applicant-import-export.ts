import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import { sanitizeUrl } from '@/lib/security';
import { getErrorMessage } from '@/lib/networkUtils';
import type { ApplicantFilterValues } from '@/lib/types';
import { readJsonOrFallback } from '@/lib/response-json';
import {
  fetchApplicantExportBlob,
  getApplicantExportImportFeatureEnabled,
} from '../applicant-page-utils';

interface UseApplicantImportExportProps {
  filters: ApplicantFilterValues;
  setTableLoading: Dispatch<SetStateAction<boolean>>;
  setIsImportModalOpen: Dispatch<SetStateAction<boolean>>;
}

export function useApplicantImportExport({
  filters,
  setTableLoading,
  setIsImportModalOpen,
}: UseApplicantImportExportProps) {
  const [exportImportFeatureEnabled, setExportImportFeatureEnabled] = useState(true);

  const handleExportApplicants = useCallback(async () => {
    try {
      setTableLoading(true);

      if (!filters) {
        toast.error('Filters not available for export');
        return;
      }

      const blob = await fetchApplicantExportBlob(filters);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Applicants-export-${new Date().toISOString().split('T')[0]}.xlsx`;

      const safeUrl = sanitizeUrl(url);
      if (safeUrl) {
        anchor.href = safeUrl;
        anchor.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Export completed successfully! File size: ${(blob.size / 1024).toFixed(1)} KB`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setTableLoading(false);
    }
  }, [filters, setTableLoading]);

  const handleImportApplicants = useCallback(() => {
    setIsImportModalOpen(true);
  }, [setIsImportModalOpen]);

  useEffect(() => {
    const fetchExportImportSetting = async () => {
      try {
        const response = await fetch('/api/settings/system-settings?keys=exportImportFeatureEnabled');
        if (response.ok) {
          const data = await readJsonOrFallback<unknown>(response, {});
          setExportImportFeatureEnabled(getApplicantExportImportFeatureEnabled(data));
        }
      } catch (error) {
        console.error('Failed to fetch export/import setting:', error);
        setExportImportFeatureEnabled(true);
      }
    };

    fetchExportImportSetting();
  }, []);

  return {
    exportImportFeatureEnabled,
    handleExportApplicants,
    handleImportApplicants,
  };
}
