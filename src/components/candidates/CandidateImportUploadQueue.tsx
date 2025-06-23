"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, CheckCircle, FileText, RotateCcw, ExternalLink, AlertCircle, Eye, FileUp, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

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
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Filtering logic
  const filteredJobs = jobs.filter(job => {
    const matchesName = job.file.name.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter ? job.status === statusFilter : true;
    return matchesName && matchesStatus;
  });

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <Input
          placeholder="Filter by file name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-md px-2 py-2 text-sm bg-background text-foreground max-w-xs"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="uploading">Uploading</option>
          <option value="importing">Importing</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">No import/upload jobs in queue.</TableCell>
              </TableRow>
            ) : filteredJobs.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    {item.type === "upload" ? <UploadCloud className="h-5 w-5 text-primary" /> : <FileUp className="h-5 w-5 text-primary" />}
                    <span className="truncate max-w-xs" title={item.file.name}>{item.file.name}</span>
                  </TableCell>
                  <TableCell>{formatBytes(item.file.size)}</TableCell>
                  <TableCell>
                    {item.status === "uploading" || item.status === "importing" ? (
                      <span className="flex items-center gap-1 text-primary"><Loader2 className="h-4 w-4 animate-spin" /> {item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                    ) : item.status === "success" ? (
                      <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /> Success</span>
                    ) : item.status === "error" ? (
                      <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-4 w-4" /> Error</span>
                    ) : item.status === "cancelled" ? (
                      <span className="text-muted-foreground">Cancelled</span>
                    ) : (
                      <span className="text-muted-foreground capitalize">{item.status}</span>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    {item.status === "error" && (
                      <Button variant="ghost" size="icon" onClick={() => setShowErrorLogId(item.id)} title="View error log">
                        <Eye className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {item.status === "success" && item.candidateProfileUrl && (
                      <Link href={item.candidateProfileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" title="View candidate profile">
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </Button>
                      </Link>
                    )}
                    {(item.status === "uploading" || item.status === "importing" || item.status === "queued") && (
                      <Button variant="ghost" size="icon" onClick={() => updateJob(item.id, { status: "cancelled" })} title="Cancel">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {item.status === "error" && (
                      <Button variant="ghost" size="icon" onClick={() => updateJob(item.id, { status: "queued", error: undefined, errorDetails: undefined })} title="Retry">
                        <RotateCcw className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    {(item.status === "success" || item.status === "cancelled" || item.status === "error") && (
                      <Button variant="ghost" size="icon" onClick={() => removeJob(item.id)} title="Remove">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {showErrorLogId === item.id && item.errorDetails && (
                  <TableRow>
                    <TableCell colSpan={4} className="bg-destructive/10 rounded p-2 text-xs text-destructive">
                      <div className="flex justify-between items-center mb-1">
                        <span>Error Log</span>
                        <Button variant="ghost" size="icon" onClick={() => setShowErrorLogId(null)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{item.errorDetails}</pre>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 