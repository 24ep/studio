"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "react-hot-toast";

import { readJsonObject } from "@/lib/response-json";
import {
  buildPositionsTemplateCsvContent,
  getPositionImportErrorMessage,
  getPositionImportFileValidationError,
  getPositionImportSuccessMessage,
  isPositionImportAbortError,
  normalizePositionImportResult,
  type PositionImportResult,
  type PositionImportStatus,
} from "./import-positions-modal-utils";

interface UseImportPositionsModalOptions {
  onImportSuccess: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

export function useImportPositionsModal({
  onImportSuccess,
  onOpenChange,
}: UseImportPositionsModalOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<PositionImportStatus>("idle");
  const [importResults, setImportResults] = useState<PositionImportResult | null>(null);

  const importTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearImportTimeouts = useCallback(() => {
    if (importTimeoutRef.current) {
      clearTimeout(importTimeoutRef.current);
      importTimeoutRef.current = null;
    }
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
  }, []);

  const resetForm = useCallback(() => {
    clearImportTimeouts();
    setSelectedFile(null);
    setIsImporting(false);
    setProgress(0);
    setImportStatus("idle");
    setImportResults(null);

    const fileInput = document.getElementById("position-import-file") as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  }, [clearImportTimeouts]);

  useEffect(() => clearImportTimeouts, [clearImportTimeouts]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const validationError = getPositionImportFileValidationError(file);

    if (validationError) {
      toast.error(validationError);
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setImportStatus("idle");
    setProgress(0);
    setImportResults(null);
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please select a CSV file to import. Only CSV files are supported.");
      return;
    }

    clearImportTimeouts();
    setIsImporting(true);
    setImportStatus("uploading");
    setProgress(10);
    setImportResults(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const controller = new AbortController();
      importTimeoutRef.current = setTimeout(() => controller.abort(), 5000);

      setImportStatus("processing");
      setProgress(30);

      const response = await fetch("/api/positions/import", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (importTimeoutRef.current) {
        clearTimeout(importTimeoutRef.current);
        importTimeoutRef.current = null;
      }

      setProgress(90);
      const result = normalizePositionImportResult(await readJsonObject(response));

      if (!response.ok) {
        throw new Error(result.message || `Failed to import positions. Status: ${response.status}`);
      }

      setImportResults(result);
      setImportStatus("completed");
      setProgress(100);

      if (result.errors.length > 0) {
        console.warn("Import warnings:", result.errors);
      }
      toast.success(getPositionImportSuccessMessage(result));

      autoCloseTimeoutRef.current = setTimeout(() => {
        onImportSuccess();
        onOpenChange(false);
        resetForm();
      }, 3000);
    } catch (error) {
      if (importTimeoutRef.current) {
        clearTimeout(importTimeoutRef.current);
        importTimeoutRef.current = null;
      }

      setImportStatus("error");
      setProgress(0);

      if (isPositionImportAbortError(error)) {
        toast.error("Import timeout. The file may be too large or the server is busy. Please try again.");
      } else {
        console.error("Error importing positions:", error);
        toast.error(getPositionImportErrorMessage(error, "An unexpected error occurred during import."));
      }
    } finally {
      setIsImporting(false);
    }
  }, [clearImportTimeouts, onImportSuccess, onOpenChange, resetForm, selectedFile]);

  const handleDownloadCsvTemplate = useCallback(() => {
    const blob = new Blob([buildPositionsTemplateCsvContent()], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "positions_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    handleDownloadCsvTemplate,
    handleFileChange,
    handleImport,
    importResults,
    importStatus,
    isImporting,
    progress,
    resetForm,
    selectedFile,
  };
}
