"use client";

import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  FileText,
  Folder,
  FolderOpen,
  MoreVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TreeNodeData } from "./tree-view-utils";

interface TreeNodeRowProps {
  node: TreeNodeData;
  level: number;
  isFolder: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  itemTitle: string;
  modalZIndex: number;
  dragHandleProps?: DraggableSyntheticListeners;
  onToggle: (nodeId: string) => void;
  onEdit: () => void;
  onCreateChild: () => void;
  onOpenRemoveFromGroup: () => void;
  onOpenDelete: () => void;
}

export function TreeNodeRow({
  node,
  level,
  isFolder,
  hasChildren,
  isExpanded,
  modalZIndex,
  dragHandleProps,
  onToggle,
  onEdit,
  onCreateChild,
  onOpenRemoveFromGroup,
  onOpenDelete,
}: TreeNodeRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-muted/20 cursor-pointer group border border-transparent hover:border-muted/30 transition-all duration-200",
        isFolder ? "bg-card/50" : "bg-muted"
      )}
      style={{ marginLeft: `${level * 20}px` }}
      onClick={() => {
        if (!isFolder) {
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      {isFolder && hasChildren && (
        <div className="w-4 h-4 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-muted/50"
            onClick={() => onToggle(node.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      )}

      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/30 rounded"
        >
          <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <TreeNodeIcon isFolder={isFolder} isExpanded={isExpanded} />
        <div className="flex flex-col">
          <span className={cn("text-sm", isFolder ? "font-medium" : "text-muted-foreground")}>
            {node.name}
          </span>
          {!isFolder && node.description && (
            <span className="text-xs text-muted-foreground/70 truncate max-w-[200px]">
              {node.description}
            </span>
          )}
        </div>
        {isFolder && hasChildren && (
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {node.children?.length || 0}
          </span>
        )}
      </div>

      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ zIndex: modalZIndex + 10 }}>
            {isFolder && (
              <DropdownMenuItem onClick={onCreateChild}>
                <Plus className="h-3 w-3 mr-2" />
                Add Item
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isFolder && (
              <DropdownMenuItem onClick={onOpenRemoveFromGroup}>
                <X className="h-3 w-3 mr-2" />
                Remove from Group
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onOpenDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete Permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TreeNodeIcon({
  isFolder,
  isExpanded,
}: {
  isFolder: boolean;
  isExpanded: boolean;
}) {
  if (!isFolder) {
    return <FileText className="h-3 w-3 text-muted-foreground" />;
  }

  return isExpanded
    ? <FolderOpen className="h-4 w-4 text-primary" />
    : <Folder className="h-4 w-4 text-primary" />;
}
