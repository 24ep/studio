"use client";

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StatusPill } from './PrivacySupportShell';

export type TicketActivity = {
  id?: string;
  action: string;
  message: string | null;
  createdAt: string;
  actorId?: string | null;
  actor?: string | null;
};

export type SupportTicket = {
  id: string;
  requesterId?: string;
  requestNumber: string;
  requester: string;
  requesterEmail?: string;
  assignee?: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  submittedAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  activities: TicketActivity[];
};

export type StatusFilter = 'all' | 'open' | 'closed';

export type ServiceDeskTranslate = (key: string, fallback: string) => string;

export function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatListDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || '?';
}

export function avatarTone(value: string) {
  const tones = [
    'bg-teal-600 text-white',
    'bg-indigo-500 text-white',
    'bg-emerald-600 text-white',
    'bg-orange-500 text-white',
    'bg-blue-600 text-white',
    'bg-pink-500 text-white',
  ];
  return tones[[...value].reduce((total, character) => total + character.charCodeAt(0), 0) % tones.length];
}

export function statusTone(status: string): 'neutral' | 'good' | 'warn' | 'bad' {
  if (status === 'closed' || status === 'resolved') return 'good';
  if (status === 'action_required') return 'warn';
  if (status === 'withdrawn') return 'bad';
  return 'neutral';
}

export function ConversationMessage({
  actor,
  email,
  message,
  createdAt,
  locale,
  requesterMessage,
}: {
  actor: string;
  email?: string;
  message: string;
  createdAt: string;
  locale: string;
  requesterMessage: boolean;
}) {
  const avatar = (
    <Avatar size="md" className="mt-5 shrink-0 rounded-full">
      <AvatarFallback className={cn('rounded-full text-[11px] font-semibold', avatarTone(actor))}>{initials(actor)}</AvatarFallback>
    </Avatar>
  );

  return (
    <article className={cn('flex items-start gap-3', requesterMessage ? 'justify-end' : 'justify-start')}>
      {!requesterMessage && avatar}
      <div className={cn('min-w-0 max-w-[min(78%,44rem)]', requesterMessage && 'text-end')}>
        <div className={cn('mb-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5', requesterMessage && 'justify-end')}>
          <span className="text-xs font-semibold text-foreground">{actor}</span>
          {email && <span className="break-all text-[10px] text-muted-foreground">{email}</span>}
        </div>
        <div className={cn(
          'inline-block max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-start text-sm leading-6 [overflow-wrap:anywhere]',
          requesterMessage
            ? 'rounded-se-sm bg-primary text-primary-foreground'
            : 'rounded-ss-sm border border-border bg-muted/65 text-foreground',
        )}>
          {message}
        </div>
        <time className="mt-1.5 block text-[10px] text-muted-foreground">{formatDate(createdAt, locale)}</time>
      </div>
      {requesterMessage && avatar}
    </article>
  );
}

export function ServiceDeskTicketList({
  activeId,
  categoryLabel,
  closedCount,
  displayStatus,
  error,
  filtered,
  hasActiveTicket,
  isHistoryMode,
  isHr,
  loading,
  locale,
  onQueryChange,
  onRetry,
  onSelectTicket,
  onStatusFilterChange,
  openCount,
  query,
  statusFilter,
  t,
  ticketCount,
}: {
  activeId: string | null;
  categoryLabel: (category: string) => string;
  closedCount: number;
  displayStatus: (status: string) => string;
  error: string;
  filtered: SupportTicket[];
  hasActiveTicket: boolean;
  isHistoryMode: boolean;
  isHr: boolean;
  loading: boolean;
  locale: string;
  onQueryChange: (value: string) => void;
  onRetry: () => void;
  onSelectTicket: (ticketId: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  openCount: number;
  query: string;
  statusFilter: StatusFilter;
  t: ServiceDeskTranslate;
  ticketCount: number;
}) {
  return (
    <aside
      className={cn(
        'min-h-0 min-w-0 flex-col bg-card lg:flex lg:border-e lg:border-border',
        hasActiveTicket ? 'hidden' : 'flex',
      )}
      aria-label={t('serviceDesk.ticketList', 'Support ticket list')}
    >
      <div className="border-b border-border px-4 pb-3 pt-4 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold tracking-[-0.01em]">{isHr ? t('serviceDesk.inbox', 'Ticket inbox') : t('serviceDesk.yourTickets', 'Your tickets')}</h2>
          <p className="shrink-0 text-xs text-muted-foreground">
            {isHistoryMode
              ? t('serviceDesk.closedCount', '{count} closed tickets').replace('{count}', String(closedCount))
              : t('serviceDesk.openCount', '{count} open tickets').replace('{count}', String(openCount))}
          </p>
        </div>
        <label className="relative mt-3 block">
          <span className="sr-only">{t('serviceDesk.searchLabel', 'Search tickets')}</span>
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            className="h-10 bg-background ps-9 shadow-none"
            placeholder={t('serviceDesk.searchPlaceholder', 'Search tickets or employees')}
          />
        </label>
        <div className="mt-3 flex items-center gap-3">
          <label className="relative block w-full">
            <span className="sr-only">{t('serviceDesk.filterLabel', 'Filter tickets by status')}</span>
            <select
              value={statusFilter}
              onChange={event => onStatusFilterChange(event.target.value as StatusFilter)}
              className="h-9 w-full appearance-none rounded-md border border-input bg-background py-0 pe-9 ps-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">{t('serviceDesk.filter.all', 'All tickets')}</option>
              <option value="open">{t('serviceDesk.filter.open', 'Open tickets')}</option>
              <option value="closed">{t('serviceDesk.filter.closed', 'Closed and withdrawn')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && !hasActiveTicket && (
          <div role="alert" className="border-b border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/30 dark:text-red-200 lg:hidden">
            <p>{error}</p>
            <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={onRetry}>
              <RefreshCw className="me-1.5 h-4 w-4" />{t('common.retry', 'Try again')}
            </Button>
          </div>
        )}
        {loading && ticketCount === 0 && (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />{t('serviceDesk.loading', 'Loading tickets…')}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-sm">
            <p className="font-medium">{query || statusFilter !== 'all' ? t('serviceDesk.noMatches', 'No tickets match these filters.') : t('serviceDesk.empty', 'No support tickets yet.')}</p>
            <p className="mt-1 leading-5 text-muted-foreground">{query || statusFilter !== 'all' ? t('serviceDesk.adjustFilters', 'Try another search or status.') : t('serviceDesk.emptyHint', 'Start a private conversation when you need help from the People team.')}</p>
          </div>
        )}
        {isHistoryMode ? (
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start sm:px-5">#</th>
                  <th className="px-4 py-3 text-start sm:px-5">{t('serviceDesk.ticketTitle', 'Subject')}</th>
                  <th className="px-4 py-3 text-start sm:px-5">{t('serviceDesk.requester', 'Requester')}</th>
                  <th className="px-4 py-3 text-start sm:px-5">{t('serviceDesk.category', 'Category')}</th>
                  <th className="px-4 py-3 text-start sm:px-5">{t('serviceDesk.updatedAt', 'Updated')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-5" colSpan={5}>
                      <p className="font-medium">{query ? t('serviceDesk.noMatches', 'No tickets match these filters.') : t('serviceDesk.noClosedTickets', 'No closed or withdrawn tickets yet.')}</p>
                      <p className="mt-1 leading-5 text-muted-foreground">{query ? t('serviceDesk.adjustFilters', 'Try another search or status.') : t('serviceDesk.noClosedTicketsHint', 'Closed and withdrawn conversations will appear here.')}</p>
                    </td>
                  </tr>
                ) : filtered.map(ticket => (
                  <tr
                    key={ticket.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectTicket(ticket.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectTicket(ticket.id);
                      }
                    }}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <td className="px-4 py-3 sm:px-5">{ticket.requestNumber}</td>
                    <td className="px-4 py-3 sm:px-5"><span className="font-medium">{ticket.subject}</span></td>
                    <td className="px-4 py-3 sm:px-5"><span className="truncate">{ticket.requester}</span></td>
                    <td className="px-4 py-3 sm:px-5">{categoryLabel(ticket.category)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground sm:px-5">{formatListDate(ticket.updatedAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.map(ticket => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => onSelectTicket(ticket.id)}
            aria-current={activeId === ticket.id ? 'true' : undefined}
            className={cn(
              'relative grid w-full grid-cols-[40px_minmax(0,1fr)_auto] gap-x-3 border-b border-border px-4 py-3 text-start transition-colors hover:bg-muted/45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5',
              activeId === ticket.id && 'bg-primary/[0.075] before:absolute before:inset-y-0 before:start-0 before:w-0.5 before:bg-primary',
            )}
          >
            <Avatar size="md" className="mt-0.5 rounded-full">
              <AvatarFallback className={cn('rounded-full text-[11px] font-semibold', avatarTone(ticket.requester))}>{initials(ticket.requester)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{ticket.requester}</span>
              <span className="mt-0.5 block truncate text-xs text-foreground/80">{ticket.subject}</span>
              <span className="mt-1 block truncate text-[11px] text-muted-foreground">{ticket.requestNumber} <span aria-hidden>·</span> {categoryLabel(ticket.category)}</span>
            </span>
            <span className="flex min-w-[94px] flex-col items-end gap-2">
              <time className="text-[11px] text-muted-foreground">{formatListDate(ticket.updatedAt, locale)}</time>
              <span className="flex items-center gap-1.5">
                <StatusPill tone={statusTone(ticket.status)}>{displayStatus(ticket.status)}</StatusPill>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
