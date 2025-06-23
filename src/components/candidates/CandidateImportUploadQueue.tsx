"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, CheckCircle, FileText, RotateCcw, ExternalLink, AlertCircle, Eye, FileUp, UploadCloud } from "lucide-react";
import Link from "next/link";

export type CandidateJobType = "upload" | "import";

export interface CandidateJob {
  id: string;
  file: File;
  type: CandidateJobType;
  status: "queued" | "uploading" | "importing" | "success" | "error" | "cancelled";
  error?: string;
  errorDetails?: string;
  candidateId?: string;
  candidateProfileUrl?: string;
  abortController?: AbortController;
}

interface QueueContextType {
  jobs: CandidateJob[];
  addJob: (job: CandidateJob) => void;
  updateJob: (id: string, update: Partial<CandidateJob>) => void;
  removeJob: (id: string) => void;
}

const CandidateQueueContext = createContext<QueueContextType | undefined>(undefined);

export function useCandidateQueue() {
  const ctx = useContext(CandidateQueueContext);
  if (!ctx) throw new Error("useCandidateQueue must be used within CandidateQueueProvider");
  return ctx;
}

export const CandidateQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<CandidateJob[]>([]);

  const addJob = useCallback((job: CandidateJob) => {
    setJobs((prev) => [...prev, job]);
  }, []);

  const updateJob = useCallback((id: string, update: Partial<CandidateJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...update } : j)));
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return (
    <CandidateQueueContext.Provider value={{ jobs, addJob, updateJob, removeJob }}>
      {children}
    </CandidateQueueContext.Provider>
  );
};

export const CandidateImportUploadQueue: React.FC = () => {
  const { jobs, updateJob, removeJob } = useCandidateQueue();
  const [showErrorLogId, setShowErrorLogId] = useState<string | null>(null);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="space-y-4 mb-6">
      {jobs.map((item) => (
        <Card key={item.id} className="flex flex-col md:flex-row items-center gap-4 p-4">
          <CardContent className="flex-1 flex items-center gap-4 p-0">
            {item.type === "upload" ? <UploadCloud className="h-6 w-6 text-primary" /> : <FileUp className="h-6 w-6 text-primary" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.file.name}</div>
              <div className="text-xs text-muted-foreground">{formatBytes(item.file.size)} • {item.type === "upload" ? "CV Upload" : "Import"}</div>
              {item.status === "error" && item.error && (
                <div className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {item.error}
                </div>
              )}
              {item.status === "cancelled" && (
                <div className="text-xs text-muted-foreground mt-1">Cancelled</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(item.status === "uploading" || item.status === "importing") && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {item.status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
              {item.status === "error" && (
                <Button variant="ghost" size="icon" onClick={() => setShowErrorLogId(item.id)} title="View error log">
                  <Eye className="h-5 w-5 text-destructive" />
                </Button>
              )}
              {item.status === "success" && item.candidateProfileUrl && (
                <Link href={item.candidateProfileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" title="View candidate profile">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </Button>
                </Link>
              )}
              {(item.status === "uploading" || item.status === "importing" || item.status === "queued") && (
                <Button variant="ghost" size="icon" onClick={() => updateJob(item.id, { status: "cancelled" })} title="Cancel">
                  <XCircle className="h-5 w-5 text-destructive" />
                </Button>
              )}
              {item.status === "error" && (
                <Button variant="ghost" size="icon" onClick={() => updateJob(item.id, { status: "queued", error: undefined, errorDetails: undefined })} title="Retry">
                  <RotateCcw className="h-5 w-5 text-primary" />
                </Button>
              )}
              {(item.status === "success" || item.status === "cancelled" || item.status === "error") && (
                <Button variant="ghost" size="icon" onClick={() => removeJob(item.id)} title="Remove">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </CardContent>
          {showErrorLogId === item.id && item.errorDetails && (
            <div className="w-full mt-2 bg-destructive/10 rounded p-2 text-xs text-destructive overflow-auto max-h-40">
              <div className="flex justify-between items-center mb-1">
                <span>Error Log</span>
                <Button variant="ghost" size="icon" onClick={() => setShowErrorLogId(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <pre className="whitespace-pre-wrap break-all">{item.errorDetails}</pre>
            </div>
          )}
        </Card>
      ))}
      {jobs.length === 0 && <div className="text-muted-foreground text-sm">No import/upload jobs in queue.</div>}
    </div>
  );
}; 