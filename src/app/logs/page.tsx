
// src/app/logs/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { ListOrdered, ServerCrash, ShieldAlert, Info } from "lucide-react"; // Icons for log levels

interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source?: string; // e.g., 'API', 'Frontend', 'System'
}

const mockLogs: LogEntry[] = [
  {
    id: 'log1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    level: 'INFO',
    message: 'User admin@example.com logged in successfully.',
    source: 'AuthService',
  },
  {
    id: 'log2',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
    level: 'WARN',
    message: 'Failed login attempt for user: test@example.com',
    source: 'AuthService',
  },
  {
    id: 'log3',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
    level: 'ERROR',
    message: 'Failed to connect to database: Connection refused.',
    source: 'DatabaseConnector',
  },
  {
    id: 'log4',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(), // 30 seconds ago
    level: 'INFO',
    message: 'Candidate Alice Wonderland status updated to Interview Scheduled.',
    source: 'CandidateService',
  },
  {
    id: 'log5',
    timestamp: new Date().toISOString(),
    level: 'DEBUG',
    message: 'Request received for /api/candidates with query: {}',
    source: 'API',
  },
];

const getLogLevelBadgeVariant = (level: LogEntry['level']): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'ERROR':
      return 'destructive';
    case 'WARN':
      return 'secondary'; // Using secondary which is often yellow/orange in themes
    case 'INFO':
      return 'default'; // Primary color
    case 'DEBUG':
      return 'outline';
    default:
      return 'outline';
  }
};

const getLogLevelIcon = (level: LogEntry['level']) => {
  switch (level) {
    case 'ERROR':
      return <ServerCrash className="h-4 w-4 mr-1.5" />;
    case 'WARN':
      return <ShieldAlert className="h-4 w-4 mr-1.5" />;
    case 'INFO':
      return <Info className="h-4 w-4 mr-1.5" />;
    case 'DEBUG':
      return <ListOrdered className="h-4 w-4 mr-1.5" />; // Using ListOrdered as a stand-in for debug
    default:
      return <Info className="h-4 w-4 mr-1.5" />;
  }
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real application, you would fetch logs from a server or subscribe to a real-time feed.
    // For this prototype, we sort mock logs by timestamp descending.
    setLogs(mockLogs.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
  }, []);

  if (!isClient) {
    // Skeleton or loading state
    return (
      <div className="space-y-6">
        <Card className="shadow-lg animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/3 mb-1"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="h-12 bg-muted border-b"></div> {/* Header row */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center p-4 border-b h-[60px]">
                  <div className="h-4 bg-muted rounded w-1/4 mr-4"></div> {/* Timestamp */}
                  <div className="h-6 bg-muted rounded w-16 mr-4"></div> {/* Level */}
                  <div className="h-4 bg-muted rounded w-1/2 mr-4"></div> {/* Message */}
                  <div className="h-4 bg-muted rounded w-1/6"></div> {/* Source */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ListOrdered className="mr-2 h-6 w-6 text-primary" /> Application Logs
          </CardTitle>
          <CardDescription>
            This page displays mock application logs. In a real system, these would be streamed or fetched from a logging backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-10">
              <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No log entries found.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[120px]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs text-muted-foreground">
                        {format(parseISO(log.timestamp), "MMM d, yyyy, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLogLevelBadgeVariant(log.level)} className="text-xs capitalize">
                          {getLogLevelIcon(log.level)}
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.source || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
