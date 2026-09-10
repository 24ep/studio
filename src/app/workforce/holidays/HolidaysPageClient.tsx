"use client";

import * as React from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  EllipsisVerticalIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SortableTableHead, type SortDirection, sortRowsByColumn, type SortValueResolverMap } from '@/components/ui/sortable-table';

interface HolidayRecord {
  id: string;
  name?: string;
  holidayDate?: string;
  location?: string;
  isPaid?: string | boolean;
  [key: string]: unknown;
}

interface HolidayApiResponse {
  resource?: {
    records?: HolidayRecord[];
  };
}

type ViewMode = 'table' | 'calendar';

const apiPath = '/api/hr/attendance?view=holidays';
const holidayCsvHeaders = ['name', 'holidayDate', 'location', 'isPaid'] as const;
const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2026, index, 1)));
const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const quarters = [
  { label: 'Q1', range: 'Jan – Mar', months: [0, 1, 2] },
  { label: 'Q2', range: 'Apr – Jun', months: [3, 4, 5] },
  { label: 'Q3', range: 'Jul – Sep', months: [6, 7, 8] },
  { label: 'Q4', range: 'Oct – Dec', months: [9, 10, 11] },
] as const;
const monthAccentNames = ['blue', 'blue', 'emerald', 'amber', 'blue', 'violet', 'emerald', 'blue', 'blue', 'amber', 'amber', 'emerald'] as const;

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDate(value: string | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

function formatDate(value: string | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function isPaidHoliday(value: HolidayRecord['isPaid']) {
  return value === true || value === 'true';
}

function getHolidayMap(holidays: HolidayRecord[]) {
  return holidays.reduce<Map<string, HolidayRecord[]>>((map, holiday) => {
    const date = normalizeDate(holiday.holidayDate);
    if (!date) return map;
    map.set(date, [...(map.get(date) || []), holiday]);
    return map;
  }, new Map());
}

function escapeCsvValue(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildHolidayCsv(holidays: HolidayRecord[]) {
  const rows = holidays.map((holiday) => [
    holiday.name || '',
    normalizeDate(holiday.holidayDate),
    holiday.location || '',
    isPaidHoliday(holiday.isPaid) ? 'true' : 'false',
  ]);
  return [
    holidayCsvHeaders.join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(',')),
  ].join('\n');
}

function parseCsvRows(content: string) {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(current.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some(cell => cell.length > 0)) rows.push(row);
  return rows;
}

function parseHolidayCsv(content: string) {
  const [headers = [], ...rows] = parseCsvRows(content);
  const normalizedHeaders = headers.map(header => header.trim());
  const missingHeaders = holidayCsvHeaders.filter(header => !normalizedHeaders.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required column(s): ${missingHeaders.join(', ')}`);
  }

  return rows.map((row, rowIndex) => {
    const values = Object.fromEntries(normalizedHeaders.map((header, index) => [header, row[index] || '']));
    if (!values.name || !values.holidayDate) {
      throw new Error(`Row ${rowIndex + 2} must include name and holidayDate.`);
    }

    return {
      name: values.name,
      holidayDate: values.holidayDate,
      location: values.location || '',
      isPaid: String(values.isPaid || 'true').toLowerCase() === 'false' ? 'false' : 'true',
    };
  });
}

function createCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function HolidaysPageClient() {
  const [holidays, setHolidays] = React.useState<HolidayRecord[]>([]);
  const [viewMode, setViewMode] = React.useState<ViewMode>('calendar');
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [appKitLoad, setAppKitLoad] = React.useState<{
    environment: 'development' | 'production';
    percent: number;
    message: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingHoliday, setEditingHoliday] = React.useState<HolidayRecord | null>(null);
  const [deletingHoliday, setDeletingHoliday] = React.useState<HolidayRecord | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const importInputRef = React.useRef<HTMLInputElement | null>(null);
  const [form, setForm] = React.useState({
    name: '',
    holidayDate: toDateInputValue(new Date()),
    location: '',
    isPaid: 'true',
  });

  const holidayMap = React.useMemo(() => getHolidayMap(holidays), [holidays]);
  const filteredHolidays = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return holidays
      .filter((holiday) => normalizeDate(holiday.holidayDate).startsWith(String(year)))
      .filter((holiday) => {
        if (!normalizedQuery) return true;
        return [
          holiday.name || '',
          holiday.location || '',
          holiday.isPaid === true || holiday.isPaid === 'true' ? 'paid' : 'unpaid',
          normalizeDate(holiday.holidayDate),
        ].join(' ').toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => normalizeDate(a.holidayDate).localeCompare(normalizeDate(b.holidayDate)));
  }, [holidays, query, year]);

  const loadHolidays = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(apiPath, { cache: 'no-store', credentials: 'include' });
      if (!response.ok) throw new Error('Unable to load holidays.');

      const payload = await response.json() as HolidayApiResponse;
      setHolidays(payload.resource?.records || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load holidays.');
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  function openAddDialog(date?: Date) {
    setEditingHoliday(null);
    setForm({
      name: '',
      holidayDate: date ? toDateInputValue(date) : toDateInputValue(new Date(year, 0, 1)),
      location: '',
      isPaid: 'true',
    });
    setDialogOpen(true);
  }

  function openEditDialog(holiday: HolidayRecord) {
    setEditingHoliday(holiday);
    setForm({
      name: holiday.name || '',
      holidayDate: normalizeDate(holiday.holidayDate),
      location: holiday.location || '',
      isPaid: isPaidHoliday(holiday.isPaid) ? 'true' : 'false',
    });
    setDialogOpen(true);
  }

  async function submitHoliday() {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const requestUrl = editingHoliday
        ? `${apiPath}&id=${encodeURIComponent(editingHoliday.id)}`
        : apiPath;
      const response = await fetch(requestUrl, {
        method: editingHoliday ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message || `Unable to ${editingHoliday ? 'update' : 'add'} holiday.`);
      }

      setDialogOpen(false);
      setEditingHoliday(null);
      await loadHolidays();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add holiday.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteHoliday() {
    if (!deletingHoliday) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`${apiPath}&id=${encodeURIComponent(deletingHoliday.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Unable to delete holiday.');
      setDeletingHoliday(null);
      await loadHolidays();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete holiday.');
    } finally {
      setIsSaving(false);
    }
  }

  async function updateHolidayPaidStatus(isPaid: boolean) {
    const ids = Array.from(selectedIds);
    if (!ids.length || bulkUpdating) return;
    setBulkUpdating(true);
    setError(null);
    const results = await Promise.allSettled(ids.map(async id => {
      const response = await fetch(`${apiPath}&id=${encodeURIComponent(id)}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPaid: String(isPaid) }),
      });
      if (!response.ok) throw new Error('Update failed');
    }));
    const failed = ids.filter((_, index) => results[index].status === 'rejected');
    setSelectedIds(new Set(failed));
    if (failed.length) setError(`${ids.length - failed.length} updated; ${failed.length} failed.`);
    await loadHolidays();
    setBulkUpdating(false);
  }

  function downloadTemplate() {
    downloadTextFile(
      `holiday-import-template-${year}.csv`,
      [
        holidayCsvHeaders.join(','),
        ['New Year Holiday', `${year}-01-01`, 'All locations', 'true'].map(escapeCsvValue).join(','),
      ].join('\n')
    );
  }

  function exportHolidays() {
    downloadTextFile(`holidays-${year}.csv`, buildHolidayCsv(filteredHolidays));
  }

  async function importHolidays(file: File) {
    setIsImporting(true);
    setError(null);
    setNotice(null);

    try {
      const rows = parseHolidayCsv(await file.text());
      if (rows.length === 0) throw new Error('The import file has no holiday rows.');

      for (const row of rows) {
        const response = await fetch(apiPath, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(payload.message || `Unable to import ${row.name}.`);
        }
      }

      await loadHolidays();
      setNotice(`Imported ${rows.length} holiday${rows.length === 1 ? '' : 's'} successfully.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import holidays.');
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  async function loadHolidaysFromAppKit(environment: 'development' | 'production') {
    try {
      setError(null);
      setNotice(null);
      setAppKitLoad({ environment, percent: 10, message: 'Preparing request' });
      const response = await fetch('/api/hr/attendance/import-appkit-holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, year }),
      });
      setAppKitLoad((current) => current ? { ...current, percent: 50, message: 'Downloading holidays' } : null);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load holidays from AppKit.');
      }
      setAppKitLoad((current) => current ? { ...current, percent: 75, message: 'Refreshing holidays' } : null);
      await loadHolidays();
      const count = Array.isArray(payload.holidays) ? payload.holidays.length : 0;
      setNotice(`Loaded ${count} AppKit holiday${count === 1 ? '' : 's'} from ${environment}.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load holidays from AppKit.');
    } finally {
      setAppKitLoad(null);
    }
  }
  const isLoadingAppKit = appKitLoad !== null;
  const loadingForDevelopment =
    appKitLoad && appKitLoad.environment === 'development' ? appKitLoad : null;
  const loadingForProduction =
    appKitLoad && appKitLoad.environment === 'production' ? appKitLoad : null;

  return (
    <main className="min-h-full bg-background px-[18px] py-4 text-foreground dark:bg-[#101821] min-[900px]:pr-[52px]">
      <div className="mx-auto flex max-w-7xl flex-col gap-0">
        <section className="border-b border-border/80 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-[#3b82f6]">Calendar Command Center</p>
              <h1 className="mt-1 text-[24px] font-bold leading-7 tracking-tight text-foreground">Holidays</h1>
              <p className="mt-1 max-w-xl text-[13px] leading-5 text-muted-foreground">
                Plan, manage, and maintain company holidays for the year.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" className="h-9 px-4 text-[14px]" onClick={() => openAddDialog()}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add holiday
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-9 min-w-36 justify-between px-4 text-[14px]">
                    Actions
                    <EllipsisVerticalIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={exportHolidays} disabled={isLoading || filteredHolidays.length === 0}>
                    <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={downloadTemplate}>
                    <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                    Download template
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => importInputRef.current?.click()} disabled={isImporting}>
                    <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
                    {isImporting ? 'Importing…' : 'Import CSV'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void loadHolidaysFromAppKit('development')} disabled={isLoadingAppKit}>
                    {loadingForDevelopment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="mr-2 h-4 w-4" />}
                    {loadingForDevelopment ? `${loadingForDevelopment.percent}% · ${loadingForDevelopment.message}` : 'Load development holidays'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void loadHolidaysFromAppKit('production')} disabled={isLoadingAppKit}>
                    {loadingForProduction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="mr-2 h-4 w-4" />}
                    {loadingForProduction ? `${loadingForProduction.percent}% · ${loadingForProduction.message}` : 'Load live holidays'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="hidden">
              <Button type="button" variant="outline" size="sm" onClick={exportHolidays} disabled={isLoading || filteredHolidays.length === 0}>
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                Download template
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => importInputRef.current?.click()} disabled={isImporting}>
                <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadHolidaysFromAppKit('development')} disabled={isLoadingAppKit}>
                {loadingForDevelopment ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                )}
                {loadingForDevelopment
                  ? `${loadingForDevelopment.percent}% · ${loadingForDevelopment.message}`
                  : 'Load development holidays'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadHolidaysFromAppKit('production')} disabled={isLoadingAppKit}>
                {loadingForProduction ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                )}
                {loadingForProduction
                  ? `${loadingForProduction.percent}% · ${loadingForProduction.message}`
                  : 'Load live holidays'}
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importHolidays(file);
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setYear(current => current - 1)}>
                <ChevronLeftIcon className="mr-1 h-4 w-4" />
                {year - 1}
              </Button>
              <div className="rounded-[8px] border border-border bg-muted px-4 py-2 text-sm font-bold text-foreground">{year}</div>
              <Button type="button" variant="outline" size="sm" onClick={() => setYear(current => current + 1)}>
                {year + 1}
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
              <Button type="button" size="sm" onClick={() => openAddDialog()}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add holiday
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-fit shrink-0 items-center rounded-[7px] border border-border bg-background">
              <Button type="button" variant="ghost" size="icon" className="h-10 w-12 rounded-r-none border-r border-border" aria-label="Previous year" onClick={() => setYear(current => current - 1)}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <div className="relative h-10 min-w-28">
                <select
                  aria-label="Calendar year"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="h-10 min-w-28 appearance-none bg-transparent px-5 pr-9 text-center text-[14px] font-bold text-foreground outline-none"
                >
                  {Array.from({ length: 16 }, (_, index) => 2020 + index).map(optionYear => (
                    <option key={optionYear} value={optionYear}>{optionYear}</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-12 rounded-l-none border-l border-border" aria-label="Next year" onClick={() => setYear(current => current + 1)}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-full min-[700px]:ml-9 min-[700px]:w-72">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search holidays" className="h-10 pl-9 text-[14px]" />
            </div>
            <div className="inline-flex w-fit rounded-[7px] border border-border bg-background p-0.5 min-[700px]:ml-1">
              <button type="button" className={cn('inline-flex h-9 items-center gap-2 rounded-[6px] px-4 text-[14px] font-semibold transition', viewMode === 'calendar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')} onClick={() => setViewMode('calendar')}>
                <CalendarDaysIcon className="h-4 w-4" />
                Calendar
              </button>
              <button type="button" className={cn('inline-flex h-9 items-center gap-2 rounded-[6px] px-4 text-[14px] font-semibold transition', viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')} onClick={() => setViewMode('table')}>
                <ListBulletIcon className="h-4 w-4" />
                Table
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="hidden">
            <div className="inline-flex rounded-[8px] bg-muted p-1">
              <button
                type="button"
                className={cn('inline-flex items-center gap-2 rounded-[7px] px-3 py-2 text-sm font-semibold transition', viewMode === 'table' ? 'bg-card text-card-foreground shadow-sm dark:shadow-none' : 'text-muted-foreground hover:text-foreground')}
                onClick={() => setViewMode('table')}
              >
                <ListBulletIcon className="h-4 w-4" />
                Table
              </button>
              <button
                type="button"
                className={cn('inline-flex items-center gap-2 rounded-[7px] px-3 py-2 text-sm font-semibold transition', viewMode === 'calendar' ? 'bg-card text-card-foreground shadow-sm dark:shadow-none' : 'text-muted-foreground hover:text-foreground')}
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDaysIcon className="h-4 w-4" />
                Year calendar
              </button>
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search holidays"
              className="w-full lg:w-80"
            />
          </div>

          {error && (
            <div className="rounded-[8px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-[8px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              {notice}
            </div>
          )}

          {viewMode === 'table' ? (
            <HolidayTable
              holidays={filteredHolidays}
              isLoading={isLoading}
              onDelete={setDeletingHoliday}
              onEdit={openEditDialog}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              bulkUpdating={bulkUpdating}
              onBulkPaid={updateHolidayPaidStatus}
            />
          ) : (
            <YearCalendar year={year} holidayMap={holidayMap} onDateClick={openAddDialog} onHolidayClick={openEditDialog} />
          )}
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[8px]">
          <DialogHeader>
            <DialogTitle>{editingHoliday ? 'Edit holiday' : 'Add holiday'}</DialogTitle>
            <DialogDescription>
              {editingHoliday
                ? 'Update the holiday date, location, and paid status.'
                : 'Create a holiday record for workforce planning and leave calendars.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="holiday-name">Name</Label>
              <Input
                id="holiday-name"
                value={form.name}
                onChange={(event) => setForm(current => ({ ...current, name: event.target.value }))}
                placeholder="Holiday name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday-date">Date</Label>
              <Input
                id="holiday-date"
                type="date"
                value={form.holidayDate}
                onChange={(event) => setForm(current => ({ ...current, holidayDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday-paid">Paid holiday</Label>
              <select
                id="holiday-paid"
                value={form.isPaid}
                onChange={(event) => setForm(current => ({ ...current, isPaid: event.target.value }))}
                className="h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
              >
                <option value="true">Paid</option>
                <option value="false">Unpaid</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="holiday-location">Location</Label>
              <Input
                id="holiday-location"
                value={form.location}
                onChange={(event) => setForm(current => ({ ...current, location: event.target.value }))}
                placeholder="All locations, Bangkok, Remote"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="button" onClick={() => void submitHoliday()} disabled={isSaving || !form.name || !form.holidayDate}>
              {isSaving ? 'Saving...' : editingHoliday ? 'Update holiday' : 'Create holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingHoliday)} onOpenChange={open => !open && setDeletingHoliday(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingHoliday?.name}” will be removed from workforce calendars.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void deleteHoliday()}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function HolidayTable({
  holidays,
  isLoading,
  onDelete,
  onEdit,
  selectedIds,
  onSelectionChange,
  bulkUpdating,
  onBulkPaid,
}: {
  holidays: HolidayRecord[];
  isLoading: boolean;
  onDelete: (holiday: HolidayRecord) => void;
  onEdit: (holiday: HolidayRecord) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  bulkUpdating: boolean;
  onBulkPaid: (isPaid: boolean) => void;
}) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const sortValueResolvers: SortValueResolverMap<HolidayRecord> = {
    name: (holiday) => holiday.name || "",
    date: (holiday) => normalizeDate(holiday.holidayDate),
    location: (holiday) => holiday.location || "",
    paid: (holiday) => (isPaidHoliday(holiday.isPaid) ? "Paid" : "Unpaid"),
  };
  const sortedHolidays = sortRowsByColumn(holidays, sortColumn, sortDirection, sortValueResolvers);
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const allSelected = holidays.length > 0 && holidays.every(holiday => selectedIds.has(holiday.id));
  return (
    <div className="overflow-x-auto">
      {selectedIds.size > 0 && <div className="flex items-center gap-2 border-y border-border bg-primary/10 px-4 py-2"><span className="text-sm font-semibold">{selectedIds.size} selected</span><Button size="sm" disabled={bulkUpdating} onClick={() => onBulkPaid(true)}>Mark paid</Button><Button size="sm" variant="outline" disabled={bulkUpdating} onClick={() => onBulkPaid(false)}>Mark unpaid</Button><Button size="sm" variant="ghost" className="ml-auto" onClick={() => onSelectionChange(new Set())}>Clear</Button></div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"><Checkbox aria-label="Select all holidays" checked={allSelected ? true : selectedIds.size ? 'indeterminate' : false} onCheckedChange={checked => onSelectionChange(checked === true ? new Set(holidays.map(holiday => holiday.id)) : new Set())} /></TableHead>
            <SortableTableHead column="name" label="Name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="date" label="Date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="location" label="Location" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="paid" label="Paid" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">Loading holidays...</TableCell>
            </TableRow>
          ) : sortedHolidays.length > 0 ? sortedHolidays.map((holiday) => (
            <TableRow key={holiday.id}>
              <TableCell><Checkbox aria-label={`Select ${holiday.name || 'holiday'}`} checked={selectedIds.has(holiday.id)} onCheckedChange={checked => { const next = new Set(selectedIds); checked === true ? next.add(holiday.id) : next.delete(holiday.id); onSelectionChange(next); }} /></TableCell>
              <TableCell className="font-semibold">{holiday.name || 'Unnamed holiday'}</TableCell>
              <TableCell>{formatDate(holiday.holidayDate)}</TableCell>
              <TableCell>{holiday.location || 'All locations'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn('rounded-full', isPaidHoliday(holiday.isPaid) ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'border-border bg-muted text-muted-foreground')}>
                  {isPaidHoliday(holiday.isPaid) ? 'Paid' : 'Unpaid'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button type="button" variant="ghost" size="icon" title="Edit holiday" onClick={() => onEdit(holiday)}>
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" title="Delete holiday" className="text-red-600" onClick={() => onDelete(holiday)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="h-28 text-center text-sm text-muted-foreground">No holidays found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function YearCalendar({
  year,
  holidayMap,
  onDateClick,
  onHolidayClick,
}: {
  year: number;
  holidayMap: Map<string, HolidayRecord[]>;
  onDateClick: (date: Date) => void;
  onHolidayClick: (holiday: HolidayRecord) => void;
}) {
  const today = new Date();
  const todayKey = toDateInputValue(today);
  const accentClasses = {
    blue: { day: 'bg-blue-600 text-white', dot: 'bg-blue-500' },
    amber: { day: 'bg-amber-500 text-slate-950', dot: 'bg-amber-500' },
    emerald: { day: 'bg-emerald-500 text-slate-950', dot: 'bg-emerald-500' },
    violet: { day: 'bg-violet-500 text-white', dot: 'bg-violet-500' },
  } as const;

  return (
    <div className="overflow-x-auto border border-border/80 bg-transparent">
      {quarters.map((quarter, quarterIndex) => {
        return (
          <section
            key={quarter.label}
            aria-labelledby={`quarter-${quarter.label}`}
            className={cn(
              'grid h-[145px] min-w-[900px] grid-cols-[80px_minmax(0,1fr)] overflow-hidden',
              quarterIndex > 0 && 'border-t border-border/80',
            )}
          >
            <div className="border-r border-border/80 px-3 py-2">
              <h2 id={`quarter-${quarter.label}`} className="text-[16px] font-bold leading-5 tracking-tight text-foreground">{quarter.label}</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{quarter.range}</p>
            </div>

            <div className="grid grid-cols-3">
              {quarter.months.map((monthIndex, monthPosition) => {
                const accent = accentClasses[monthAccentNames[monthIndex]];
                const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
                const isCurrentMonth = year === today.getFullYear() && monthIndex === today.getMonth();
                const monthHolidays = Array.from(holidayMap.entries())
                  .filter(([date]) => date.startsWith(monthPrefix))
                  .flatMap(([, records]) => records)
                  .sort((left, right) => normalizeDate(left.holidayDate).localeCompare(normalizeDate(right.holidayDate)));

                return (
                  <div key={monthNames[monthIndex]} className={cn('min-w-0 px-4 py-1.5', monthPosition > 0 && 'border-l border-border/60')}>
                    <h3 className="mb-1 text-[13px] font-bold leading-4 text-foreground">{monthNames[monthIndex]}</h3>
                    <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-muted-foreground">
                      {weekdayNames.map((weekday, index) => <div key={`${weekday}-${index}`}>{weekday}</div>)}
                    </div>
                    <div className="mt-0.5 grid grid-cols-7">
                      {createCalendarCells(year, monthIndex).map((date, index) => {
                        if (!date) return <div key={`empty-${index}`} className="h-[14px]" />;
                        const dateKey = toDateInputValue(date);
                        const dayHolidays = holidayMap.get(dateKey) || [];
                        const isToday = dateKey === todayKey;
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => onDateClick(date)}
                            className={cn(
                              'mx-auto flex h-[14px] w-[14px] items-center justify-center rounded-full text-[10px] font-semibold leading-none text-foreground transition hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              dayHolidays.length > 0 && accent.day,
                              isToday && dayHolidays.length === 0 && 'ring-1 ring-primary text-primary',
                            )}
                            title={dayHolidays.map(holiday => holiday.name).join(', ') || 'Add holiday'}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-0.5 flex min-h-[16px] gap-3 overflow-hidden">
                      {isCurrentMonth && (
                        <span className="flex min-w-0 items-center gap-1.5 text-left text-[10.5px] text-muted-foreground">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                          <span className="truncate">Today ({monthNames[monthIndex].slice(0, 3)} {today.getDate()}, {year})</span>
                        </span>
                      )}
                      {monthHolidays.slice(0, isCurrentMonth ? 1 : 2).map((holiday) => (
                        <button
                          key={holiday.id}
                          type="button"
                          onClick={() => onHolidayClick(holiday)}
                          className="flex min-w-0 items-center gap-1.5 text-left text-[10.5px] text-muted-foreground transition hover:text-foreground"
                          title={`Edit ${holiday.name || 'holiday'}`}
                        >
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', accent.dot)} />
                          <span className="shrink-0">{Number(normalizeDate(holiday.holidayDate).slice(8, 10))}</span>
                          <span className="truncate">{holiday.name || 'Unnamed holiday'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
