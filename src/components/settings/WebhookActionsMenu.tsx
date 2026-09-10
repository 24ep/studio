"use client";

import { Code, Copy, Edit, History, MoreHorizontal, TestTube, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Webhook } from "./webhook-management-data";

interface WebhookActionsMenuProps {
  webhook: Webhook;
  onCopyId: (webhookId: string) => void;
  onViewLogs: (webhook: Webhook) => void;
  onTest: (webhook: Webhook) => void;
  onCustomizeBody: (webhook: Webhook) => void;
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhookId: string) => void;
}

export function WebhookActionsMenu({
  webhook,
  onCopyId,
  onViewLogs,
  onTest,
  onCustomizeBody,
  onEdit,
  onDelete,
}: WebhookActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onCopyId(webhook.id)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewLogs(webhook)}>
          <History className="mr-2 h-4 w-4" />
          View Logs
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTest(webhook)}>
          <TestTube className="mr-2 h-4 w-4" />
          Test Webhook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCustomizeBody(webhook)}>
          <Code className="mr-2 h-4 w-4" />
          Customize Body
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(webhook)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{webhook.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(webhook.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
