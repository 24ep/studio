
// src/app/logs/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { ListOrdered, ServerCrash, ShieldAlert, Info, RefreshCw, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import type { LogEntry, LogLevel } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getLogLevelBadgeVariant = (level: LogLevel): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'ERROR':
      return 'destructive';
    case 'WARN':
      return 'secondary'; 
    case 'INFO':
      return 'default'; 
    case 'DEBUG':
      return 'outline';
    default:
      return 'outline';
  }
};

const getLogLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'ERROR':
      return <ServerCrash className="h-4 w-4 mr-1.5" />;
    case 'WARN':
      return <ShieldAlert className="h-4 w-4 mr-1.5" />;
    case 'INFO':
      return <Info className="h-4 w-4 mr-1.5" />;
    case 'DEBUG':
      return <ListOrdered className="h-4 w-4 mr-1.5" />; 
    default:
      return <Info className="h-4 w-4 mr-1.5" />;
  }
};

const ITEMS_PER_PAGE = 20;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "ALL">("ALL");

  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE);

  const fetchLogs = useCallback(async (page: number, filterLevel: LogLevel | "ALL") => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let url = `/api/logs?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
      if (filterLevel !== "ALL") {
        url += `&level=${filterLevel}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch logs: ${response.statusText}`);
      }
      const data: { logs: LogEntry[], total: number } = await response.json();
      setLogs(data.logs);
      setTotalLogs(data.total);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError((err as Error).message);
      setLogs([]);
      setTotalLogs(0);
      toast({
        title: "Error Fetching Logs",
        description: (err as Error).message || "Could not load log data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsClient(true);
    fetchLogs(currentPage, levelFilter);
  }, [fetchLogs, currentPage, levelFilter]);


  const handleRefresh = () => {
    if (currentPage !== 1) {
      setCurrentPage(1); // Reset to page 1 on refresh if not already there, which triggers fetchLogs
    } else {
      fetchLogs(1, levelFilter); // Otherwise, just fetch page 1 with current filter
    }
  };
  
  const handleLevelFilterChange = (value: string) => {
    setLevelFilter(value as LogLevel | "ALL");
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  if (!isClient && !isLoading) { // Initial server render before client takes over, or if client load fails early.
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/3 mb-1 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </CardHeader>
          <CardContent>
             <div className="text-center py-10">
              <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-muted-foreground">Loading log entries...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <ListOrdered className="mr-2 h-6 w-6 text-primary" /> Application Logs
            </CardTitle>
            <CardDescription>
              View system and application logs.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={levelFilter} onValueChange={handleLevelFilterChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARN">Warn</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh Logs</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && logs.length === 0 ? ( // Show skeleton only when loading initial data or full page refresh
             <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(4)].map((_, i) => <TableHead key={i} className="h-12 bg-muted/50 animate-pulse"></TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell className="h-[60px]"><div className="h-4 bg-muted rounded"></div></TableCell>
                      <TableCell><div className="h-6 bg-muted rounded w-20"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded"></div></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded w-24"></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : error ? (
             <div className="text-center py-10">
              <ServerCrash className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-4 text-destructive font-semibold">Error loading logs</p>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10">
              <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No log entries found for the selected filter.</p>
            </div>
          ) : (
            <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead className="w-[120px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[150px]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs text-muted-foreground">
                        {format(parseISO(log.timestamp), "MMM d, yyyy, HH:mm:ss.SSS")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLogLevelBadgeVariant(log.level)} className="text-xs capitalize items-center">
                          {getLogLevelIcon(log.level)}
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm break-all">{log.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.source || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1 || isLoading}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages || isLoading}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
