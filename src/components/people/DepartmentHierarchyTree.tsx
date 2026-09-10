"use client";

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Archive,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CornerDownRight,
  FolderTree,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { OrganizationUnitType } from '@/lib/hr/organization-hierarchy';
import type { DepartmentHierarchyNode, DepartmentUnit } from './department-hierarchy-utils';

export function DepartmentHierarchyTree({
  canManage,
  hierarchy,
  onArchive,
  onCreate,
  onEdit,
  onMove,
  onSelect,
}: {
  canManage: boolean;
  hierarchy: DepartmentHierarchyNode[];
  onArchive: (unit: DepartmentUnit) => void;
  onCreate: (seed?: Partial<DepartmentUnit>) => void;
  onEdit: (unit: DepartmentUnit) => void;
  onMove: (id: string, parentId: string | null, index: number) => Promise<void>;
  onSelect: (unit: DepartmentUnit) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [activeNode, setActiveNode] = React.useState<DepartmentHierarchyNode | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }));
  const { setNodeRef: setRootDropRef, isOver: rootIsOver } = useDroppable({ id: 'organization-root' });

  React.useEffect(() => {
    const ids = new Set<string>();
    const visit = (node: DepartmentHierarchyNode) => {
      if (node.children.length) ids.add(node.unit.id);
      node.children.forEach(visit);
    };
    hierarchy.forEach(visit);
    setExpanded(ids);
  }, [hierarchy]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveNode(event.active.data.current?.node as DepartmentHierarchyNode || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveNode(null);
    if (!event.over) return;
    const moving = event.active.data.current?.node as DepartmentHierarchyNode | undefined;
    if (!moving) return;

    if (event.over.id === 'organization-root') {
      const rootIndex = hierarchy.findIndex(node => node.unit.id === moving.unit.id);
      await onMove(moving.unit.id, null, rootIndex < 0 ? hierarchy.length : rootIndex);
      return;
    }

    const target = event.over.data.current?.node as DepartmentHierarchyNode | undefined;
    if (!target || target.unit.id === moving.unit.id) return;
    if (event.over.data.current?.mode === 'nest') {
      await onMove(moving.unit.id, target.unit.id, target.children.length);
      return;
    }
    {
      const siblings = findChildren(hierarchy, target.unit.parentId);
      await onMove(moving.unit.id, target.unit.parentId, siblings.findIndex(node => node.unit.id === target.unit.id));
    }
  };

  if (!hierarchy.length) {
    return (
      <div
        ref={setRootDropRef}
        className="grid min-h-64 place-items-center border-t text-center"
      >
        <div>
          <FolderTree className="mx-auto h-9 w-9 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold">No organization units found</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a division to start the organization tree.</p>
          {canManage && (
            <Button type="button" className="mt-4" onClick={() => onCreate({ unitType: 'division', parentId: null })}>
              <Plus className="mr-2 h-4 w-4" />
              Add division
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveNode(null)}
    >
      <div className="overflow-x-auto border-t">
        <div className="min-w-[760px]">
          <div className="grid h-9 grid-cols-[minmax(360px,1fr)_110px_100px_100px_40px] items-center border-b bg-muted/40 px-3 text-[11px] font-semibold uppercase text-muted-foreground">
            <span>Organization unit</span>
            <span>Employees</span>
            <span>Code</span>
            <span>Status</span>
            <span />
          </div>
          <div
            ref={setRootDropRef}
            className={rootIsOver ? 'bg-blue-50/70 ring-1 ring-inset ring-blue-300' : undefined}
          >
            {hierarchy.map(node => (
              <OrganizationNodeRow
                key={node.unit.id}
                node={node}
                depth={0}
                canManage={canManage}
                expanded={expanded}
                onArchive={onArchive}
                onCreate={onCreate}
                onEdit={onEdit}
                onSelect={onSelect}
                onToggle={(id) => setExpanded(current => {
                  const next = new Set(current);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })}
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeNode ? (
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-lg">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <UnitIcon type={activeNode.unit.unitType} />
            <span className="font-medium">{activeNode.unit.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function OrganizationNodeRow({
  node,
  depth,
  canManage,
  expanded,
  onArchive,
  onCreate,
  onEdit,
  onSelect,
  onToggle,
}: {
  node: DepartmentHierarchyNode;
  depth: number;
  canManage: boolean;
  expanded: Set<string>;
  onArchive: (unit: DepartmentUnit) => void;
  onCreate: (seed?: Partial<DepartmentUnit>) => void;
  onEdit: (unit: DepartmentUnit) => void;
  onSelect: (unit: DepartmentUnit) => void;
  onToggle: (id: string) => void;
}) {
  const isOpen = expanded.has(node.unit.id);
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag:${node.unit.id}`,
    data: { node },
    disabled: !canManage,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${node.unit.id}`,
    data: { node, mode: 'reorder' },
    disabled: !canManage,
  });
  const { setNodeRef: setNestDropRef, isOver: isNestOver } = useDroppable({
    id: `nest:${node.unit.id}`,
    data: { node, mode: 'nest' },
    disabled: !canManage || node.unit.unitType === 'unit',
  });
  const setRowRef = React.useCallback((element: HTMLDivElement | null) => {
    setDragRef(element);
    setDropRef(element);
  }, [setDragRef, setDropRef]);
  const nextType = getNextType(node.unit.unitType);

  return (
    <div>
      <div
        ref={setRowRef}
        role="button"
        tabIndex={0}
        aria-label={`View ${node.unit.name} details`}
        onClick={event => {
          if ((event.target as HTMLElement).closest('button, a, [role="menuitem"]')) return;
          onSelect(node.unit);
        }}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
            event.preventDefault();
            onSelect(node.unit);
          }
        }}
        className={[
          'grid min-h-11 cursor-pointer grid-cols-[minmax(360px,1fr)_110px_100px_100px_40px] items-center border-b px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          depth === 0 ? 'bg-muted/20' : 'bg-background',
          isOver ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' : 'hover:bg-muted/20',
          isDragging ? 'opacity-30' : '',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: `${depth * 28}px` }}>
          {canManage && (
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={`Drag ${node.unit.name}`}
              {...listeners}
              {...attributes}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          {node.children.length ? (
            <button type="button" onClick={() => onToggle(node.unit.id)} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${node.unit.name}`}>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <span className="w-4" />}
          <UnitIcon type={node.unit.unitType} />
          <span className={depth === 0 ? 'truncate text-sm font-semibold' : 'truncate text-sm font-medium'}>
            {node.unit.name}
          </span>
          <Badge variant="outline" className="ml-1 capitalize">{node.unit.unitType}</Badge>
          {canManage && nextType && (
            <span
              ref={setNestDropRef}
              title={`Drop here to move inside ${node.unit.name}`}
              className={[
                'ml-1 grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-dashed text-muted-foreground',
                isNestOver ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-transparent',
              ].join(' ')}
            >
              <CornerDownRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <EmployeeCount value={node.employeeCount} />
        <span className="truncate text-xs text-muted-foreground">{node.unit.code || '-'}</span>
        <Badge variant={node.unit.isActive ? 'default' : 'secondary'} className="w-fit">
          {node.unit.isActive ? 'Active' : 'Inactive'}
        </Badge>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="icon" variant="ghost" aria-label={`Actions for ${node.unit.name}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {nextType && (
                <DropdownMenuItem onClick={() => onCreate({ unitType: nextType, parentId: node.unit.id })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {nextType}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(node.unit)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {node.unit.isActive && (
                <DropdownMenuItem onClick={() => onArchive(node.unit)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {isOpen && node.children.map(child => (
        <OrganizationNodeRow
          key={child.unit.id}
          node={child}
          depth={depth + 1}
          canManage={canManage}
          expanded={expanded}
          onArchive={onArchive}
          onCreate={onCreate}
          onEdit={onEdit}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function UnitIcon({ type }: { type: OrganizationUnitType }) {
  if (type === 'division') return <Building2 className="h-4 w-4 shrink-0 text-primary" />;
  if (type === 'department') return <FolderTree className="h-4 w-4 shrink-0 text-sky-600" />;
  if (type === 'section') return <CircleDot className="h-4 w-4 shrink-0 text-emerald-600" />;
  return <CircleDot className="h-3.5 w-3.5 shrink-0 text-slate-400" />;
}

function EmployeeCount({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Users className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}

function getNextType(type: OrganizationUnitType): OrganizationUnitType | null {
  const types: OrganizationUnitType[] = ['division', 'department', 'section', 'unit'];
  return types[types.indexOf(type) + 1] || null;
}

function findChildren(nodes: DepartmentHierarchyNode[], parentId: string | null): DepartmentHierarchyNode[] {
  if (!parentId) return nodes;
  const pending = [...nodes];
  while (pending.length) {
    const node = pending.shift()!;
    if (node.unit.id === parentId) return node.children;
    pending.push(...node.children);
  }
  return [];
}
