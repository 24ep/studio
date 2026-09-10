'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { getJsonArray, isJsonObject, readJsonObject } from '@/lib/response-json';
import {
  SortableNativeHeader,
  type SortDirection,
  sortRowsByColumn,
  type SortValueResolverMap,
} from '@/components/ui/sortable-table';

interface LogEntry {
    id: string;
    action: string;
    details: {
        url: string;
        userAgent: string;
        timestamp: string;
    };
    createdAt: string;
    user: {
        name: string;
        email: string;
        image: string | null;
    };
}

function normalizeSecurityLogs(value: unknown): LogEntry[] {
    if (!isJsonObject(value)) {
        return [];
    }

    return (getJsonArray(value, 'logs') ?? [])
        .filter(isJsonObject)
        .map((log) => log as unknown as LogEntry);
}

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const sortResolvers = useMemo<SortValueResolverMap<LogEntry>>(() => ({
      user: log => `${log.user.name} ${log.user.email}`,
      event: log => log.action,
      page: log => log.details.url,
      device: log => log.details.userAgent,
      time: log => log.createdAt,
    }), []);
    const sortedLogs = useMemo(
      () => sortRowsByColumn(logs, sortColumn, sortDirection, sortResolvers),
      [logs, sortColumn, sortDirection, sortResolvers],
    );

    const handleSort = (column: string | null, direction: SortDirection) => {
      setSortColumn(column);
      setSortDirection(direction);
    };

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch('/api/protection/logs');
                if (res.ok) {
                    setLogs(normalizeSecurityLogs(await readJsonObject(res)));
                }
            } catch (error) {
                console.error('Failed to fetch logs', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading security logs...</div>;
    }

    return (
        <div className="p-4 text-foreground sm:p-6">
            <h1 className="mb-2 text-2xl font-bold">Security Logs</h1>
            <p className="mb-8 text-muted-foreground">
                Monitoring suspicious activities such as screen capture attempts.
            </p>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="overflow-x-auto" role="region" aria-label="Security log entries" tabIndex={0}>
                <table className="min-w-[860px] divide-y divide-border">
                    <thead className="bg-muted/60">
                    <tr>
                            <SortableNativeHeader
                              column="user"
                              label="User"
                              sortColumn={sortColumn}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            />
                            <SortableNativeHeader
                              column="event"
                              label="Event"
                              sortColumn={sortColumn}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            />
                            <SortableNativeHeader
                              column="page"
                              label="Page URL"
                              sortColumn={sortColumn}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            />
                            <SortableNativeHeader
                              column="device"
                              label="Device Info"
                              sortColumn={sortColumn}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            />
                            <SortableNativeHeader
                              column="time"
                              label="Time"
                              sortColumn={sortColumn}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {sortedLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                    No security incidents recorded.
                                </td>
                            </tr>
                        ) : (
                            sortedLogs.map((log) => (
                                <tr key={log.id} className="transition-colors hover:bg-muted/40">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 relative">
                                                {log.user.image ? (
                                                    <Image
                                                        src={log.user.image}
                                                        alt={log.user.name}
                                                        fill
                                                        className="rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                                        {log.user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-foreground">{log.user.name}</div>
                                                <div className="max-w-56 truncate text-sm text-muted-foreground" title={log.user.email}>{log.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex rounded-full bg-destructive/10 px-2 text-xs font-semibold leading-5 text-destructive">
                                            {log.action.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate text-sm text-foreground" title={log.details.url}>
                                            {log.details.url}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate text-xs text-muted-foreground" title={log.details.userAgent}>
                                            {log.details.userAgent}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                                        {format(new Date(log.createdAt), 'PPP p')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
              </div>
            </div>
        </div>
    );
}
