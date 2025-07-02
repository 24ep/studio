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
import { addDays, format, isAfter, isBefore, parseISO, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useSession } from 'next-auth/react';

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
  webhook_payload?: any;
  webhook_response?: any;
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
  const [showWebhookLogId, setShowWebhookLogId] = useState<string | null>(null);
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
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = subDays(end, 30);
    return { start, end };
  });
  const [showJobDetailId, setShowJobDetailId] = useState<string | null>(null);
  const { data: session } = useSession();

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

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    await fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    function handleRefreshEvent() {
      fetchJobs();
    }
    window.addEventListener('refreshCandidateQueue', handleRefreshEvent);
    return () => {
      window.removeEventListener('refreshCandidateQueue', handleRefreshEvent);
    };
  }, [fetchJobs]);

  useEffect(() => {
    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/upload-queue/ws`;
    
    const ws = new window.WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected to upload queue endpoint');
    };
    
    ws.onerror = (error) => {
      console.warn('WebSocket connection error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'queue_updated') {
          // Re-fetch jobs when the queue is updated
          fetchJobs();
        }
      } catch (error) {
        console.warn('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [fetchJobs]);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Function to calculate and format duration
  function formatDuration(startDate: string, endDate?: string): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 1000) return "0s";
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Real-time duration updates for in-progress jobs
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Helper to check if a date is in range
  function isInRange(dateStr?: string) {
    if (!dateStr) return false;
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isAfter(date, dateRange.start) && isBefore(date, addDays(dateRange.end, 1));
  }

  // Status counts
  const numQueued = jobs.filter(j => j.source === 'bulk' && j.status === 'queued').length;
  const numInProgress = jobs.filter(j => j.source === 'bulk' && (j.status === 'uploading' || j.status === 'importing' || j.status === 'processing')).length;
  const numSuccess = jobs.filter(j => j.source === 'bulk' && j.status === 'success' && isInRange(j.completed_date)).length;
  const numError = jobs.filter(j => j.source === 'bulk' && j.status === 'error' && isInRange(j.completed_date)).length;

  // 1. Add a helper to get the selected job for the webhook log:
  const selectedWebhookLogJob = jobs.find(j => j.id === showWebhookLogId);

  return (
    <div className="mb-6">
      {/* Summary Status Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Queued</p>
                  <p className="text-2xl font-bold text-foreground">{numQueued}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Q</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-foreground">{numInProgress}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success</p>
                  <p className="text-2xl font-bold text-foreground">{numSuccess}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Error</p>
                  <p className="text-2xl font-bold text-foreground">{numError}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Filters and Bulk Actions in Card */}
      <Card className="mb-4 p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 shadow-none border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Filters */}
          <Input
            placeholder="Filter by file name..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="min-w-[180px] max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded-md px-2 py-2 text-sm bg-background text-foreground min-w-[130px] max-w-xs"
          >
            <option value="">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="uploading">Uploading</option>
            <option value="processing">Processing</option>
            <option value="importing">Importing</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Date:</span>
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={e => setDateRange(r => ({ ...r, start: new Date(e.target.value) }))}
              className="border rounded px-2 py-1 text-sm"
            />
            <span className="text-sm text-muted-foreground">-</span>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={e => setDateRange(r => ({ ...r, end: new Date(e.target.value) }))}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className=""
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilter("");
              setStatusFilter("");
              setDateRange({ start: subDays(new Date(), 30), end: new Date() });
            }}
            className=""
          >
            Clear Filters
          </Button>
          {/* Bulk Actions */}
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={e => handleSelectAll(e.target.checked)}
            aria-label="Select all filtered jobs"
            className="scale-110"
          />
          <span className="text-sm">Select All</span>
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
      </Card>
      <div className="mb-2 font-semibold">All Upload Jobs: {totalBulkJobs}</div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Completed Date</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Upload ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">No import/upload jobs in queue.</TableCell>
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
                    {(() => {
                      const status = item.status;
                      let variant: any = 'default';
                      switch (status) {
                        case 'queued': variant = 'secondary'; break;
                        case 'uploading': variant = 'default'; break;
                        case 'processing': variant = 'outline'; break;
                        case 'importing': variant = 'outline'; break;
                        case 'success': variant = 'default'; break;
                        case 'error': variant = 'destructive'; break;
                        case 'cancelled': variant = 'secondary'; break;
                        default: variant = 'secondary';
                      }
                      return (
                        <Badge variant={variant} className="capitalize">{status}</Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {item.upload_date ? (
                      <span className="text-sm font-mono">
                        {formatDuration(item.upload_date, item.completed_date)}
                        {!item.completed_date && (item.status === 'uploading' || item.status === 'importing' || item.status === 'processing') && (
                          <span className="text-blue-500 ml-1">●</span>
                        )}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{item.completed_date ? new Date(item.completed_date).toLocaleString() : '-'}</TableCell>
                  <TableCell>{item.upload_date ? new Date(item.upload_date).toLocaleString() : '-'}</TableCell>
                  <TableCell>{item.upload_id || '-'}</TableCell>
                  <TableCell className="flex gap-1">
                    {item.file_path && (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        title="Download CV"
                      >
                        <a
                          href={`${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${item.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={item.file_name}
                        >
                          <FileText className="h-4 w-4 text-primary" />
                        </a>
                      </Button>
                    )}
                    {(item.webhook_payload || item.webhook_response) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowWebhookLogId(item.id)} 
                        title="View webhook log"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Show Details"
                      onClick={() => setShowJobDetailId(item.id)}
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
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
      <Dialog open={!!showJobDetailId} onOpenChange={open => !open && setShowJobDetailId(null)}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {(() => {
            const job = jobs.find(j => j.id === showJobDetailId);
            if (!job) return <div>Job not found.</div>;
            return (
              <div className="space-y-6">
                {/* Job Details Section */}
                <div>
                  <h3 className="font-semibold mb-2">Job Info</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">File:</span> {job.file_name}</div>
                    <div><span className="font-medium">Size:</span> {formatBytes(job.file_size)}</div>
                    <div><span className="font-medium">Status:</span> {job.status}</div>
                    <div><span className="font-medium">Source:</span> {job.source}</div>
                    <div><span className="font-medium">Uploaded:</span> {job.upload_date ? format(new Date(job.upload_date), 'yyyy-MM-dd HH:mm') : '-'}</div>
                    <div><span className="font-medium">Completed:</span> {job.completed_date ? format(new Date(job.completed_date), 'yyyy-MM-dd HH:mm') : '-'}</div>
                    <div><span className="font-medium">Duration:</span> {job.upload_date ? formatDuration(job.upload_date, job.completed_date) : '-'}</div>
                    <div><span className="font-medium">ID:</span> {job.id}</div>
                  </div>
                  {job.file_path && (
                    <div className="mt-2">
                      <a href={`${MINIO_PUBLIC_BASE_URL}/${MINIO_BUCKET}/${job.file_path}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download File</a>
                    </div>
                  )}
                </div>
                {/* Webhook Log Section */}
                {(job.webhook_payload || job.webhook_response) && (
                  <div>
                    <h3 className="font-semibold mb-2">Webhook Log</h3>
                    {job.webhook_payload && (
                      <div className="mb-2">
                        <div className="font-medium text-xs mb-1">Payload:</div>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">{JSON.stringify(job.webhook_payload, null, 2)}</pre>
                      </div>
                    )}
                    {job.webhook_response && (
                      <div>
                        <div className="font-medium text-xs mb-1">Response:</div>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">{JSON.stringify(job.webhook_response, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
                {/* Error Log Section */}
                {job.error_details && (
                  <div>
                    <h3 className="font-semibold mb-2 text-destructive">Error Log</h3>
                    <pre className="bg-destructive/10 border border-destructive rounded p-2 text-xs text-destructive max-h-40 overflow-auto whitespace-pre-wrap">{job.error_details}</pre>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Webhook Log Dialog (rendered once, outside the table) */}
      <Dialog open={!!selectedWebhookLogJob} onOpenChange={(open) => { if (!open) setShowWebhookLogId(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pt-6 px-6 pb-4 border-b">
            <DialogTitle className="text-2xl flex items-center text-blue-800">
              <ExternalLink className="h-6 w-6 mr-3 text-blue-700" />Webhook Log
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
            {selectedWebhookLogJob?.webhook_payload && (
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Payload Sent to Webhook:</h4>
                <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto bg-background p-2 rounded border text-xs">
                  {JSON.stringify(selectedWebhookLogJob.webhook_payload, null, 2)}
                </pre>
              </div>
            )}
            {selectedWebhookLogJob?.webhook_response && (
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Webhook Response:</h4>
                <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto bg-background p-2 rounded border text-xs">
                  {JSON.stringify(selectedWebhookLogJob.webhook_response, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 