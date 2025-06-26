"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, CheckCircle, FileText, RotateCcw, ExternalLink, AlertCircle, Eye, FileUp, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MINIO_PUBLIC_BASE_URL, MINIO_BUCKET } from '@/lib/minio-constants';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export type CandidateJobType = "upload" | "import";

export interface CandidateJob {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  error?: string;
  error_details?: string;
  source: string;
  upload_date?: string;
  completed_date?: string;
  upload_id?: string;
  created_by?: string;
  updated_at?: string;
  file_path?: string;
  file?: File;
  type: CandidateJobType;
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
  const [jobs, setJobs] = useState<CandidateJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showErrorLogId, setShowErrorLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [showBulkRetryConfirm, setShowBulkRetryConfirm] = useState(false);
  const [bulkRetryLoading, setBulkRetryLoading] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { success, error } = useToast();

  // Fetch paginated jobs
  const fetchJobs = useCallback(async () => {
    let isMounted = true;
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });
    const res = await fetch(`/api/upload-queue?${params.toString()}`);
    if (!res.ok) return;
    const { data, total } = await res.json();
    if (isMounted) {
      setJobs(Array.isArray(data) ? data : []);
      setTotal(total);
    }
    return () => { isMounted = false; };
  }, [page, pageSize]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_QUEUE_BRIDGE_URL || 'ws://localhost:3002';
    const ws = new window.WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'queue_updated') {
          // Re-fetch jobs when the queue is updated
          fetchJobs();
        }
      } catch {}
    };
    return () => ws.close();
  }, [fetchJobs]);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Filtering logic (client-side for now)
  const filteredJobs = jobs.filter(job => {
    if (job.source !== "bulk") return false;
    const matchesName = job.file_name?.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter ? job.status === statusFilter : true;
    return matchesName && matchesStatus;
  });
  const totalBulkJobs = total; // Show total from API
  const totalPages = Math.ceil(totalBulkJobs / pageSize);

  // Add checkbox selection logic with indeterminate state
  const allSelected = filteredJobs.length > 0 && bulkDeleteIds.length === filteredJobs.length;
  const someSelected = bulkDeleteIds.length > 0 && bulkDeleteIds.length < filteredJobs.length;
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setBulkDeleteIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setBulkDeleteIds(filteredJobs.map(j => j.id));
    } else {
      setBulkDeleteIds([]);
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-2 font-semibold">All Upload Jobs: {totalBulkJobs}</div>
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
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={allSelected}
          ref={el => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={e => handleSelectAll(e.target.checked)}
          aria-label="Select all filtered jobs"
        />
        <span>Select All</span>
        <Button
          variant="outline"
          size="sm"
          disabled={bulkDeleteIds.length === 0 || bulkRetryLoading}
          onClick={() => setShowBulkRetryConfirm(true)}
          aria-label="Retry selected jobs"
        >
          {bulkRetryLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          Retry Selected
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={bulkDeleteIds.length === 0 || bulkDeleteLoading}
          onClick={() => setShowBulkDeleteConfirm(true)}
          aria-label="Delete selected jobs"
        >
          {bulkDeleteLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          Delete Selected
        </Button>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completed Date</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Upload ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">No import/upload jobs in queue.</TableCell>
              </TableRow>
            ) : filteredJobs.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={bulkDeleteIds.includes(item.id)}
                      onChange={e => handleCheckboxChange(item.id, e.target.checked)}
                      aria-label={`Select job ${item.file_name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    {item.file_path ? (
                      <a
                        href={`${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${item.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:text-primary/80 truncate max-w-xs"
                        title={item.file_name}
                      >
                        {item.file_name}
                      </a>
                    ) : (
                      <span className="truncate max-w-xs" title={item.file_name}>{item.file_name}</span>
                    )}
                  </TableCell>
                  <TableCell>{formatBytes(item.file_size)}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground capitalize">{item.status}</span>
                  </TableCell>
                  <TableCell>{item.completed_date ? new Date(item.completed_date).toLocaleString() : '-'}</TableCell>
                  <TableCell>{item.upload_date ? new Date(item.upload_date).toLocaleString() : '-'}</TableCell>
                  <TableCell>{item.upload_id || '-'}</TableCell>
                  <TableCell className="flex gap-1">
                    {item.status === "error" && (
                      <Button variant="ghost" size="icon" onClick={() => setShowErrorLogId(item.id)} title="View error log">
                        <Eye className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {(item.status === "queued" || item.status === "error") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Retry"
                        onClick={async () => {
                          await fetch(`/api/upload-queue/${item.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'queued', error: null, error_details: null, completed_date: null })
                          });
                          fetchJobs();
                        }}
                      >
                        <RotateCcw className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    {(item.status === "queued" || item.status === "uploading") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cancel"
                        disabled={cancelLoading}
                        onClick={() => setCancelId(item.id)}
                      >
                        {cancelLoading && cancelId === item.id ? <Loader2 className="animate-spin h-4 w-4" /> : <X className="h-4 w-4 text-orange-500" />}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {showErrorLogId === item.id && item.error_details && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-destructive/10 rounded p-2 text-xs text-destructive">
                      <div className="flex justify-between items-center mb-1">
                        <span>Error Log</span>
                        <Button variant="ghost" size="icon" onClick={() => setShowErrorLogId(null)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{item.error_details}</pre>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <Button
            key={i + 1}
            variant={page === i + 1 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
      </div>
      {/* Confirm single delete */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>Confirm Delete</AlertDialogHeader>
          <div>Are you sure you want to delete this job from the queue?</div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteLoading}
              onClick={async () => {
                if (deleteId) {
                  setDeleteLoading(true);
                  try {
                    const res = await fetch(`/api/upload-queue/${deleteId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Delete failed');
                    success('Job deleted successfully');
                  } catch (err) {
                    error('Failed to delete job');
                  } finally {
                    setDeleteLoading(false);
                    setDeleteId(null);
                  }
                }
              }}
            >{deleteLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Confirm bulk delete */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={open => !open && setShowBulkDeleteConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>Confirm Bulk Delete</AlertDialogHeader>
          <div>Are you sure you want to delete the selected jobs from the queue?</div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBulkDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkDeleteLoading}
              onClick={async () => {
                setBulkDeleteLoading(true);
                try {
                  const results = await Promise.all(bulkDeleteIds.map(id => fetch(`/api/upload-queue/${id}`, { method: 'DELETE' })));
                  if (results.some(res => !res.ok)) throw new Error('Some deletes failed');
                  success('Selected jobs deleted successfully');
                } catch (err) {
                  error('Failed to delete some jobs');
                } finally {
                  setBulkDeleteIds([]);
                  setBulkDeleteLoading(false);
                  setShowBulkDeleteConfirm(false);
                }
              }}
            >{bulkDeleteLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Confirm bulk retry */}
      <AlertDialog open={showBulkRetryConfirm} onOpenChange={open => !open && setShowBulkRetryConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>Confirm Bulk Retry</AlertDialogHeader>
          <div>Are you sure you want to retry the selected jobs? This will add them back to the queue.</div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBulkRetryConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkRetryLoading}
              onClick={async () => {
                setBulkRetryLoading(true);
                try {
                  const results = await Promise.all(bulkDeleteIds.map(id => fetch(`/api/upload-queue/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'queued', error: null, error_details: null, completed_date: null })
                  })));
                  if (results.some(res => !res.ok)) throw new Error('Some retries failed');
                  success('Selected jobs retried successfully');
                  await fetchJobs();
                } catch (err) {
                  error('Failed to retry some jobs');
                } finally {
                  setBulkRetryLoading(false);
                  setShowBulkRetryConfirm(false);
                  setBulkDeleteIds([]);
                }
              }}
            >{bulkRetryLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}Retry All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Confirm cancel */}
      <AlertDialog open={!!cancelId} onOpenChange={open => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>Confirm Cancel</AlertDialogHeader>
          <div>Are you sure you want to cancel this job?</div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelId(null)}>No, Keep Running</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelLoading}
              onClick={async () => {
                if (cancelId) {
                  setCancelLoading(true);
                  try {
                    const res = await fetch(`/api/upload-queue/${cancelId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'cancelled', completed_date: new Date().toISOString() })
                    });
                    if (!res.ok) throw new Error('Cancel failed');
                    success('Job cancelled successfully');
                  } catch (err) {
                    error('Failed to cancel job');
                  } finally {
                    setCancelLoading(false);
                    setCancelId(null);
                  }
                }
              }}
            >{cancelLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}Yes, Cancel Job</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 