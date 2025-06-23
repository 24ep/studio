"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { ListOrdered, ServerCrash, ShieldAlert, Info, RefreshCw, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, AlertTriangle, Loader2, Search, CalendarIcon, UserCircle, FilterX, ChevronsUpDown, Check } from "lucide-react";
import type { LogEntry, LogLevel, UserProfile } from '@/lib/types';
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signIn } from "next-auth/react";

const getLogLevelBadgeVariant = (level: LogLevel): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'ERROR': return 'destructive';
    case 'WARN': return 'secondary';
    case 'AUDIT': return 'default'; // Changed for better visibility
    case 'INFO': return 'outline';
    case 'DEBUG': return 'outline';
    default: return 'outline';
  }
};

const getLogLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'ERROR': return <ServerCrash className="h-4 w-4 mr-1.5" />;
    case 'WARN': return <AlertTriangle className="h-4 w-4 mr-1.5" />;
    case 'AUDIT': return <ShieldAlert className="h-4 w-4 mr-1.5" />;
    case 'INFO': return <Info className="h-4 w-4 mr-1.5" />;
    case 'DEBUG': return <ListOrdered className="h-4 w-4 mr-1.5" />;
    default: return <Info className="h-4 w-4 mr-1.5" />;
  }
};

const ITEMS_PER_PAGE = 20;

export default function ApplicationLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actingUserIdFilter, setActingUserIdFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [allUsers, setAllUsers] = useState<Pick<UserProfile, 'id' | 'name'>[]>([]);
  
  const [userSearch, setUserSearch] = useState('');
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);


  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE);
  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - 10;
  const toYear = currentYear + 1;

  const fetchLogUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users for log filter');
      const usersData: UserProfile[] = await response.json();
      setAllUsers((usersData || []).map(u => ({ id: u.id, name: u.name })));
    } catch (error) {
      console.error("Error fetching users for log filter:", error);
      setAllUsers([]); // Ensure fallback to empty array on error
    }
  }, []);

  const fetchLogs = useCallback(async (page: number, filters: { level: LogLevel | "ALL", search: string, userId: string, start?: Date, end?: Date }) => {
    if (sessionStatus !== 'authenticated') {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setFetchError(null);

    try {
      let url = `/api/logs?page=${page}&limit=${ITEMS_PER_PAGE}`;
      if (filters.level !== "ALL") url += `&level=${filters.level}`;
      if (filters.search.trim()) url += `&search=${encodeURIComponent(filters.search.trim())}`;
      if (filters.userId !== "ALL") url += `&actingUserId=${filters.userId}`;
      if (filters.start) url += `&startDate=${filters.start.toISOString()}`;
      if (filters.end) url += `&endDate=${filters.end.toISOString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        let errorJson;
        let errorMessageFromServer;
        try { errorJson = await response.json(); errorMessageFromServer = errorJson.message; }
        catch (e) { errorMessageFromServer = `Failed to fetch logs: ${response.statusText || `Status ${response.status}`}`; }

        if (response.status === 401 || response.status === 403) {
            setFetchError(errorMessageFromServer || `You do not have permission to view logs.`);
            setLogs([]); setTotalLogs(0); return;
        }
        setFetchError(errorMessageFromServer || `An unknown error occurred. Status: ${response.status}`);
        setLogs([]); setTotalLogs(0); return;
      }

      const data = await response.json();
      setLogs(data.data || []);
      setTotalLogs(data.pagination?.total || 0);
    } catch (err) {
      console.error("Error fetching logs:", err);
      const errorMessage = (err as Error).message;
      setFetchError(errorMessage); setLogs([]); setTotalLogs(0);
      if (!(errorMessage && errorMessage.toLowerCase().includes("unauthorized"))) {
        // toast.error(errorMessage || "Could not load log data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, toast, pathname]);

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('LOGS_VIEW')) {
        setFetchError("You do not have permission to view logs.");
        setIsLoading(false);
      } else {
        fetchLogUsers();
        fetchLogs(currentPage, { level: levelFilter, search: searchQuery, userId: actingUserIdFilter, start: startDate, end: endDate });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, session, currentPage, levelFilter, searchQuery, actingUserIdFilter, startDate, endDate, pathname, fetchLogUsers]);

  useEffect(() => {
    if (fetchError) {
      // toast.error(fetchError);
    }
  }, [fetchError, toast]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchLogs(1, { level: levelFilter, search: searchQuery, userId: actingUserIdFilter, start: startDate, end: endDate });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setLevelFilter('ALL');
    setActingUserIdFilter('ALL');
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
    fetchLogs(1, { level: "ALL", search: "", userId: "ALL", start: undefined, end: undefined });
  };
  
  const filteredUsersForDropdown = allUsers.filter(user => user.name.toLowerCase().includes(userSearch.toLowerCase()));


  if (sessionStatus === 'loading' || (isLoading && !fetchError && !isClient && logs.length === 0)) {
    return ( <div className="flex h-full items-center justify-center"> <Loader2 className="h-16 w-16 animate-spin text-primary" /> </div> );
  }

  if (fetchError && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Logs</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        {fetchError === "You do not have permission to view logs." ? (
             <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
        ) : (
             <Button onClick={handleApplyFilters} className="btn-hover-primary-gradient">Try Again</Button>
        )}
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center text-2xl"> <ListOrdered className="mr-3 h-6 w-6 text-primary" /> Application Logs </CardTitle>
          <CardDescription> View system and application logs. Filter by level, date, user, or search message/source. </CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={handleApplyFilters} disabled={isLoading} className="sm:ml-auto">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> <span className="sr-only">Refresh Logs</span>
        </Button>
      </CardHeader>
      <CardContent>
          {/* Filters Section */}
          <div className="mb-6 p-4 border rounded-lg bg-card shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1"><Label htmlFor="search-query">Search Message/Source</Label><Input id="search-query" type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} className="w-full"/></div>
                  <div className="space-y-1"><Label htmlFor="level-filter">Log Level</Label><Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as LogLevel | "ALL")}><SelectTrigger id="level-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All Levels</SelectItem><SelectItem value="DEBUG">Debug</SelectItem><SelectItem value="INFO">Info</SelectItem><SelectItem value="WARN">Warn</SelectItem><SelectItem value="ERROR">Error</SelectItem><SelectItem value="AUDIT">Audit</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1">
                    <Label htmlFor="user-filter">Acting User</Label>
                    <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={userPopoverOpen} className="w-full justify-between font-normal">
                          {actingUserIdFilter === 'ALL' ? 'All Users' : allUsers.find(u => u.id === actingUserIdFilter)?.name || 'All Users'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
                        <Command>
                          <CommandInput
                            placeholder="Search user..."
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>{userSearch ? 'No user found.' : 'Type to search users.'}</CommandEmpty>
                            <CommandItem value="ALL" onSelect={() => { setActingUserIdFilter('ALL'); setUserPopoverOpen(false); setUserSearch(''); }}>
                              <Check className={cn("mr-2 h-4 w-4", actingUserIdFilter === 'ALL' ? "opacity-100" : "opacity-0")} />
                              All Users
                            </CommandItem>
                            <ScrollArea className="max-h-48">
                              {filteredUsersForDropdown.map((user) => (
                                <CommandItem key={user.id} value={user.name} onSelect={() => { setActingUserIdFilter(user.id); setUserPopoverOpen(false); setUserSearch(''); }}>
                                  <Check className={cn("mr-2 h-4 w-4", actingUserIdFilter === user.id ? "opacity-100" : "opacity-0")} />
                                  {user.name}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1"><Label htmlFor="start-date">Start Date</Label><Popover><PopoverTrigger asChild><Button id="start-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus captionLayout="dropdown-buttons" fromYear={fromYear} toYear={toYear} /></PopoverContent></Popover></div>
                  <div className="space-y-1"><Label htmlFor="end-date">End Date</Label><Popover><PopoverTrigger asChild><Button id="end-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus captionLayout="dropdown-buttons" fromYear={fromYear} toYear={toYear} /></PopoverContent></Popover></div>
                  <div className="flex gap-2 items-end">
                      <Button variant="outline" onClick={handleResetFilters} disabled={isLoading} className="w-full"><FilterX className="mr-2 h-4 w-4"/>Reset</Button>
                      <Button onClick={handleApplyFilters} disabled={isLoading} className="w-full"><Search className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>Apply</Button>
                  </div>
              </div>
          </div>

        {isLoading && logs.length === 0 ? (  <div className="flex flex-col items-center justify-center py-10"> <Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="mt-2 text-muted-foreground">Loading logs...</p> </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10"> <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground" /> <p className="mt-4 text-muted-foreground">No log entries found for the selected filter or search query.</p> </div>
        ) : (
          <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead className="w-[200px]">Timestamp</TableHead><TableHead className="w-[120px]">Level</TableHead><TableHead>Message</TableHead><TableHead className="w-[150px] hidden md:table-cell">Source</TableHead><TableHead className="w-[180px] hidden lg:table-cell">Acting User</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-xs text-muted-foreground"> {log.timestamp ? format(parseISO(log.timestamp), "MMM d, yyyy, HH:mm:ss.SSS") : 'Invalid Date'} </TableCell>
                    <TableCell> <Badge variant={getLogLevelBadgeVariant(log.level)} className="text-xs capitalize items-center"> {getLogLevelIcon(log.level)} {log.level} </Badge> </TableCell>
                    <TableCell className="text-sm break-all">{log.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{log.source || 'N/A'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                      {log.actingUserName ? (
                          <div className="flex items-center gap-1.5"> <UserCircle className="h-3.5 w-3.5"/> {log.actingUserName} </div>
                      ) : log.actingUserId ? (
                          <div className="flex items-center gap-1.5"> <UserCircle className="h-3.5 w-3.5"/> <span title={log.actingUserId}>User ID: ...{log.actingUserId.slice(-6)}</span> </div>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || isLoading}> <ChevronsLeft className="h-4 w-4" /> </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading}> <ChevronLeft className="h-4 w-4" /> </Button>
                  <span className="text-sm text-muted-foreground"> Page {currentPage} of {totalPages} </span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading}> <ChevronRight className="h-4 w-4" /> </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || isLoading}> <ChevronsRight className="h-4 w-4" /> </Button>
              </div>
          )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

