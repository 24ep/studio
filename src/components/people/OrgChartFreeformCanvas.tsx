"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowsPointingOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PencilSquareIcon,
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  PrinterIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface CanvasEmployee {
  [key: string]: unknown;
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  status?: string | null;
  location?: string | null;
  managerId?: string | null;
  departmentId?: string | null;
}

type Point = { x: number; y: number };
type Viewport = Point & { zoom: number };

const CARD_WIDTH = 264;
const CARD_HEIGHT = 112;
const COLUMN_GAP = 92;
const ROW_GAP = 40;

function nameOf(employee: CanvasEmployee) {
  return [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email || 'Unnamed employee';
}

function initialsOf(employee: CanvasEmployee) {
  const initials = [employee.firstName, employee.lastName].filter(Boolean).map(value => value?.[0]).join('');
  return (initials || employee.email?.[0] || '?').toUpperCase();
}

function descendantsOf(employeeId: string, employees: CanvasEmployee[]) {
  const found = new Set<string>();
  const visit = (id: string) => employees.filter(employee => employee.managerId === id).forEach(employee => {
    if (found.has(employee.id)) return;
    found.add(employee.id);
    visit(employee.id);
  });
  visit(employeeId);
  return found;
}

function initialLayout(employees: CanvasEmployee[]) {
  const ids = new Set(employees.map(employee => employee.id));
  const children = new Map<string, CanvasEmployee[]>();
  employees.forEach(employee => {
    const key = employee.managerId && ids.has(employee.managerId) ? employee.managerId : 'root';
    children.set(key, [...(children.get(key) || []), employee]);
  });
  const positions: Record<string, Point> = {};
  let row = 0;
  const visit = (employee: CanvasEmployee, depth: number) => {
    const directReports = children.get(employee.id) || [];
    if (!directReports.length) {
      positions[employee.id] = { x: 80 + depth * (CARD_WIDTH + COLUMN_GAP), y: 72 + row * (CARD_HEIGHT + ROW_GAP) };
      row += 1;
      return;
    }
    const startRow = row;
    directReports.forEach(report => visit(report, depth + 1));
    const endRow = Math.max(startRow, row - 1);
    positions[employee.id] = { x: 80 + depth * (CARD_WIDTH + COLUMN_GAP), y: 72 + ((startRow + endRow) / 2) * (CARD_HEIGHT + ROW_GAP) };
  };
  (children.get('root') || employees.slice(0, 1)).forEach(root => visit(root, 0));
  employees.forEach(employee => {
    if (!positions[employee.id]) {
      positions[employee.id] = { x: 80, y: 72 + row * (CARD_HEIGHT + ROW_GAP) };
      row += 1;
    }
  });
  return positions;
}

export function OrgChartFreeformCanvas({
  employees,
  canManage,
  onEdit,
  onRelationshipChange,
}: {
  employees: CanvasEmployee[];
  canManage: boolean;
  onEdit: (employee: CanvasEmployee) => void;
  onRelationshipChange: (employee: CanvasEmployee, managerId: string | null) => Promise<void>;
}) {
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const [positions, setPositions] = React.useState<Record<string, Point>>(() => initialLayout(employees));
  const [viewport, setViewport] = React.useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [moving, setMoving] = React.useState<{ id: string; start: Point; origin: Point } | null>(null);
  const [panning, setPanning] = React.useState<{ start: Point; origin: Point } | null>(null);
  const [linking, setLinking] = React.useState<{ employeeId: string; point: Point; overId: string | null; mode: 'manager' | 'dotted' } | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [past, setPast] = React.useState<Array<Record<string, Point>>>([]);
  const [future, setFuture] = React.useState<Array<Record<string, Point>>>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [history, setHistory] = React.useState<Array<{ id: string; text: string; at: string }>>([]);
  const [relationMode, setRelationMode] = React.useState<'manager' | 'dotted'>('manager');
  const [dottedLinks, setDottedLinks] = React.useState<Array<{ from: string; to: string }>>([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('org-chart-canvas-positions');
      if (saved) setPositions(current => ({ ...current, ...JSON.parse(saved) }));
      const savedHistory = localStorage.getItem('org-chart-relationship-history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      const savedDotted = localStorage.getItem('org-chart-dotted-links');
      if (savedDotted) setDottedLinks(JSON.parse(savedDotted));
    } catch { /* Ignore malformed local preferences. */ }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem('org-chart-canvas-positions', JSON.stringify(positions)), 250);
    return () => window.clearTimeout(timer);
  }, [positions]);

  React.useEffect(() => {
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const point = focusId ? positions[focusId] : null;
    const surface = surfaceRef.current;
    if (!focusId || !point || !surface) return;
    setSelected(new Set([focusId]));
    setViewport(current => ({ ...current, x: surface.clientWidth / 2 - (point.x + CARD_WIDTH / 2) * current.zoom, y: surface.clientHeight / 2 - (point.y + CARD_HEIGHT / 2) * current.zoom }));
  }, [positions]);

  React.useEffect(() => {
    setPositions(current => ({ ...initialLayout(employees), ...Object.fromEntries(Object.entries(current).filter(([id]) => employees.some(employee => employee.id === id))) }));
  }, [employees]);

  const toCanvasPoint = React.useCallback((clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return {
      x: (clientX - (rect?.left || 0) - viewport.x) / viewport.zoom,
      y: (clientY - (rect?.top || 0) - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  React.useEffect(() => {
    if (!moving && !panning && !linking) return;
    const onMove = (event: PointerEvent) => {
      if (moving) {
        const dx = (event.clientX - moving.start.x) / viewport.zoom;
        const dy = (event.clientY - moving.start.y) / viewport.zoom;
        setPositions(current => ({ ...current, [moving.id]: { x: moving.origin.x + dx, y: moving.origin.y + dy } }));
      } else if (panning) {
        setViewport(current => ({ ...current, x: panning.origin.x + event.clientX - panning.start.x, y: panning.origin.y + event.clientY - panning.start.y }));
      } else if (linking) {
        const point = toCanvasPoint(event.clientX, event.clientY);
        const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-org-node]');
        setLinking(current => current ? { ...current, point, overId: element?.dataset.orgNode || null } : null);
      }
    };
    const onUp = async () => {
      if (linking) {
        const employee = employees.find(item => item.id === linking.employeeId);
        const forbidden = descendantsOf(linking.employeeId, employees);
        const managerId = linking.overId;
        setLinking(null);
        if (employee && linking.mode === 'dotted' && managerId && managerId !== employee.id) {
          setDottedLinks(current => {
            const exists = current.some(link => link.from === employee.id && link.to === managerId);
            const next = exists ? current.filter(link => !(link.from === employee.id && link.to === managerId)) : [...current, { from: employee.id, to: managerId }];
            localStorage.setItem('org-chart-dotted-links', JSON.stringify(next)); return next;
          });
        } else if (employee && managerId !== employee.managerId && managerId !== employee.id && (!managerId || !forbidden.has(managerId))) {
          setSavingId(employee.id);
          try {
            await onRelationshipChange(employee, managerId);
            const manager = employees.find(item => item.id === managerId);
            const entry = { id: `${Date.now()}-${employee.id}`, text: manager ? `${nameOf(employee)} now reports to ${nameOf(manager)}.` : `${nameOf(employee)} moved to the top level.`, at: new Date().toLocaleString() };
            setHistory(current => {
              const next = [entry, ...current].slice(0, 50);
              localStorage.setItem('org-chart-relationship-history', JSON.stringify(next));
              return next;
            });
          } finally { setSavingId(null); }
        }
      }
      if (moving) { setPast(items => [...items.slice(-29), { ...positions, [moving.id]: moving.origin }]); setFuture([]); }
      setMoving(null);
      setPanning(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [employees, linking, moving, onRelationshipChange, panning, toCanvasPoint, viewport.zoom]);

  const zoomBy = (amount: number) => setViewport(current => ({ ...current, zoom: Math.min(1.6, Math.max(.55, current.zoom + amount)) }));
  const fit = () => {
    const values = Object.values(positions);
    if (!values.length || !surfaceRef.current) return;
    const maxX = Math.max(...values.map(point => point.x)) + CARD_WIDTH + 80;
    const maxY = Math.max(...values.map(point => point.y)) + CARD_HEIGHT + 80;
    const zoom = Math.min(1, Math.max(.55, Math.min(surfaceRef.current.clientWidth / maxX, surfaceRef.current.clientHeight / maxY)));
    setViewport({ x: 24, y: 24, zoom });
  };
  const applyLayout = () => { setPast(items => [...items.slice(-29), positions]); setFuture([]); setPositions(initialLayout(employees)); };
  const undo = () => setPast(items => {
    const previous = items.at(-1); if (!previous) return items;
    setFuture(next => [positions, ...next].slice(0, 30)); setPositions(previous); return items.slice(0, -1);
  });
  const redo = () => setFuture(items => {
    const next = items[0]; if (!next) return items;
    setPast(previous => [...previous, positions].slice(-30)); setPositions(next); return items.slice(1);
  });
  const focusEmployee = (id: string) => {
    const point = positions[id]; const surface = surfaceRef.current; if (!point || !surface) return;
    setViewport(current => ({ ...current, x: surface.clientWidth / 2 - (point.x + CARD_WIDTH / 2) * current.zoom, y: surface.clientHeight / 2 - (point.y + CARD_HEIGHT / 2) * current.zoom }));
    setSelected(new Set([id]));
  };
  const hiddenIds = React.useMemo(() => {
    const hidden = new Set<string>(); collapsed.forEach(id => descendantsOf(id, employees).forEach(child => hidden.add(child))); return hidden;
  }, [collapsed, employees]);

  return (
    <section className="relative h-full min-h-[620px] overflow-hidden bg-muted/30 text-foreground" aria-label="Interactive organization chart">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,hsl(var(--border))_1px,transparent_1.2px)] bg-[size:24px_24px]" />
      <div className="absolute left-3 top-3 z-30 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1.5 shadow-lg sm:left-5 sm:top-5 sm:max-w-[calc(100%-40px)]">
        <div className="relative w-48">
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a person…" className="h-11 border-0 bg-muted text-sm shadow-none sm:h-9 sm:text-xs" />
          {query && <div className="absolute left-0 top-12 max-h-52 w-64 overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl sm:top-10">{employees.filter(employee => `${nameOf(employee)} ${employee.jobTitle || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8).map(employee => <button key={employee.id} className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { focusEmployee(employee.id); setQuery(''); }}><strong className="block text-foreground">{nameOf(employee)}</strong><span className="text-muted-foreground">{employee.jobTitle || 'Role not set'}</span></button>)}</div>}
        </div>
        <Button asChild size="sm" className="h-11 text-xs sm:h-9"><Link href="/people"><PlusIcon className="mr-1.5 h-4 w-4" />Add person</Link></Button>
        <Button variant="ghost" size="sm" className="h-11 text-xs sm:h-9" onClick={applyLayout}>Auto-layout</Button>
        <Button variant="ghost" size="sm" className={cn('h-11 text-xs sm:h-9', relationMode === 'dotted' && 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200')} onClick={() => setRelationMode(mode => mode === 'manager' ? 'dotted' : 'manager')}>{relationMode === 'manager' ? 'Solid hierarchy' : 'Dotted relationship'}</Button>
        <ToolButton label="Undo layout change" onClick={undo} disabled={!past.length}><ArrowUturnLeftIcon /></ToolButton>
        <ToolButton label="Redo layout change" onClick={redo} disabled={!future.length}><ArrowUturnRightIcon /></ToolButton>
        <ToolButton label="Relationship history" onClick={() => setShowHistory(value => !value)}><ClockIcon /></ToolButton>
        <ToolButton label="Export or print" onClick={() => window.print()}><PrinterIcon /></ToolButton>
      </div>
      {showHistory && <aside className="absolute right-3 top-20 z-40 w-[min(20rem,calc(100%-1.5rem))] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl sm:right-5 sm:top-16"><div className="mb-2 flex items-center justify-between gap-3"><strong className="text-xs text-foreground">Relationship history</strong><span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Approved changes</span></div>{history.length ? <div className="max-h-64 space-y-2 overflow-auto">{history.map(item => <div key={item.id} className="border-t border-border pt-2 text-xs"><p className="text-foreground">{item.text}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.at}</p></div>)}</div> : <p className="py-5 text-center text-xs text-muted-foreground">No relationship changes yet.</p>}</aside>}
      <div className="absolute bottom-3 right-3 z-30 flex items-center rounded-lg border border-border bg-card p-1 shadow-lg sm:bottom-5 sm:right-5">
        <ToolButton label="Zoom out" onClick={() => zoomBy(-.1)}><MagnifyingGlassMinusIcon /></ToolButton>
        <span className="w-12 text-center text-[11px] font-bold tabular-nums text-muted-foreground">{Math.round(viewport.zoom * 100)}%</span>
        <ToolButton label="Zoom in" onClick={() => zoomBy(.1)}><MagnifyingGlassPlusIcon /></ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton label="Fit chart" onClick={fit}><ArrowsPointingOutIcon /></ToolButton>
      </div>

      <div
        ref={surfaceRef}
        className={cn('absolute inset-0 touch-none', panning ? 'cursor-grabbing' : 'cursor-grab')}
        onPointerDown={event => {
          if (event.button !== 0 || (event.target as HTMLElement).closest('[data-org-node]')) return;
          setPanning({ start: { x: event.clientX, y: event.clientY }, origin: { x: viewport.x, y: viewport.y } });
        }}
        onWheel={event => {
          if (!event.ctrlKey && !event.metaKey) return;
          event.preventDefault();
          zoomBy(event.deltaY > 0 ? -.08 : .08);
        }}
      >
        <div className="absolute left-0 top-0 h-0 w-0 origin-top-left" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
          <svg className="pointer-events-none absolute left-0 top-0 h-[4000px] w-[6000px] overflow-visible">
            {dottedLinks.map(link => {
              const from = positions[link.from]; const to = positions[link.to]; if (!from || !to || hiddenIds.has(link.from) || hiddenIds.has(link.to)) return null;
              return <path key={`${link.from}-${link.to}`} className="stroke-amber-600 dark:stroke-amber-400" d={`M ${from.x + CARD_WIDTH / 2} ${from.y + CARD_HEIGHT} C ${from.x + CARD_WIDTH / 2} ${from.y + CARD_HEIGHT + 48}, ${to.x + CARD_WIDTH / 2} ${to.y - 48}, ${to.x + CARD_WIDTH / 2} ${to.y}`} fill="none" strokeWidth="2" strokeDasharray="6 6" />;
            })}
            {employees.filter(employee => !hiddenIds.has(employee.id)).map(employee => {
              const from = employee.managerId ? positions[employee.managerId] : null;
              const to = positions[employee.id];
              if (!from || !to) return null;
              const x1 = from.x + CARD_WIDTH; const y1 = from.y + CARD_HEIGHT / 2;
              const x2 = to.x; const y2 = to.y + CARD_HEIGHT / 2;
              const bend = x1 + Math.max(36, (x2 - x1) / 2);
              return <path key={employee.id} className={linking?.employeeId === employee.id ? 'stroke-amber-600 dark:stroke-amber-400' : 'stroke-muted-foreground/55'} d={`M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`} fill="none" strokeWidth="2" />;
            })}
            {linking && (() => {
              const employee = employees.find(item => item.id === linking.employeeId);
              const start = employee ? positions[employee.id] : null;
              if (!start) return null;
              return <path className="stroke-amber-600 dark:stroke-amber-400" d={`M ${start.x} ${start.y + CARD_HEIGHT / 2} C ${start.x - 54} ${start.y + CARD_HEIGHT / 2}, ${linking.point.x + 54} ${linking.point.y}, ${linking.point.x} ${linking.point.y}`} fill="none" strokeWidth="3" strokeDasharray="7 5" />;
            })()}
          </svg>

          {employees.filter(employee => !hiddenIds.has(employee.id)).map(employee => {
            const position = positions[employee.id] || { x: 0, y: 0 };
            const reports = employees.filter(item => item.managerId === employee.id).length;
            const invalidTarget = linking && (linking.employeeId === employee.id || descendantsOf(linking.employeeId, employees).has(employee.id));
            return (
              <article
                key={employee.id}
                data-org-node={employee.id}
                className={cn('absolute select-none rounded-xl border bg-card text-card-foreground shadow-md transition-[border-color,box-shadow] duration-150', linking?.overId === employee.id && !invalidTarget ? 'border-amber-500 ring-4 ring-amber-500/15' : selected.has(employee.id) ? 'border-primary ring-2 ring-primary/15' : 'border-border', invalidTarget && 'opacity-50')}
                style={{ left: position.x, top: position.y, width: CARD_WIDTH, height: CARD_HEIGHT }}
                onPointerDown={event => {
                  if (event.button !== 0 || (event.target as HTMLElement).closest('a,button,[data-link-handle]')) return;
                  event.stopPropagation();
                  setSelected(current => event.shiftKey ? new Set(current).add(employee.id) : new Set([employee.id]));
                  setMoving({ id: employee.id, start: { x: event.clientX, y: event.clientY }, origin: position });
                }}
              >
                {canManage && (
                  <button
                    type="button"
                    data-link-handle
                    aria-label={`Drag to change manager for ${nameOf(employee)}`}
                    title="Drag onto another employee to set them as manager"
                    className="group absolute -left-5 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 touch-none cursor-grab place-items-center rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 active:cursor-grabbing"
                    onPointerDown={event => {
                      event.stopPropagation();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setLinking({ employeeId: employee.id, point: toCanvasPoint(event.clientX, event.clientY), overId: null, mode: relationMode });
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-4 w-4 rounded-[4px] border-2 border-card bg-amber-500 shadow-sm transition-transform duration-150',
                        linking?.employeeId === employee.id ? 'scale-110 bg-amber-600' : 'group-hover:scale-110',
                      )}
                    />
                  </button>
                )}
                <div className="flex h-full items-center gap-3 px-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">{initialsOf(employee)}</div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/people/${employee.id}`} className="block truncate text-sm font-bold text-foreground hover:text-primary">{nameOf(employee)}</Link>
                    <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{employee.jobTitle || 'Role not set'}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><UserIcon className="h-3.5 w-3.5" />{reports} direct {reports === 1 ? 'report' : 'reports'}</p>
                  </div>
                  <button type="button" className="grid h-11 w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${collapsed.has(employee.id) ? 'Expand' : 'Collapse'} branch for ${nameOf(employee)}`} title={collapsed.has(employee.id) ? 'Expand branch' : 'Collapse branch'} onClick={() => setCollapsed(current => { const next = new Set(current); next.has(employee.id) ? next.delete(employee.id) : next.add(employee.id); return next; })}>{collapsed.has(employee.id) ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}</button>
                  {canManage && <button type="button" className="grid h-11 w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onEdit(employee)} aria-label={`Edit ${nameOf(employee)}`}><PencilSquareIcon className="h-4 w-4" /></button>}
                </div>
                {savingId === employee.id && <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl bg-muted"><div className="h-full w-1/2 animate-pulse bg-amber-500" /></div>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ToolButton({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: React.ReactElement; disabled?: boolean }) {
  return <Button type="button" variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground sm:h-9 sm:w-9" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{React.cloneElement(children, { className: 'h-4 w-4' } as React.HTMLAttributes<SVGElement>)}</Button>;
}
