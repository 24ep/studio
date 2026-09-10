"use client";

import {
  ArrowPathIcon as RefreshCw,
  CubeIcon as Package2,
  EyeIcon as Eye,
} from "@heroicons/react/24/outline";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HeaderUserMenuSharedProps } from "./HeaderTypes";

type HeaderDesktopMenuProps = HeaderUserMenuSharedProps;

export function HeaderDesktopPreviewTools({
  isAdminPreviewEnabled,
  previewUsers,
  isSearchingUsers,
  onUserSearch,
  onStartImpersonation,
  labels,
}: Pick<
  HeaderDesktopMenuProps,
  "isAdminPreviewEnabled" | "previewUsers" | "isSearchingUsers" | "onUserSearch" | "onStartImpersonation" | "labels"
>) {
  if (!isAdminPreviewEnabled) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator className="bg-gray-100 dark:bg-zinc-800/60" />
      <div className="space-y-0.5 p-2">
        <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{labels.previewTools}</p>
        <PreviewRoleSubmenu onStartImpersonation={onStartImpersonation} labels={labels} />
        <PreviewUserSubmenu
          previewUsers={previewUsers}
          isSearchingUsers={isSearchingUsers}
          onUserSearch={onUserSearch}
          onStartImpersonation={onStartImpersonation}
          labels={labels}
        />
      </div>
    </>
  );
}

function PreviewRoleSubmenu({
  onStartImpersonation,
  labels,
}: Pick<HeaderDesktopMenuProps, "onStartImpersonation" | "labels">) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-amber-50/50 dark:text-zinc-300 dark:hover:bg-amber-500/5">
        <Eye className="mr-2 h-4 w-4 text-amber-500" />
        <span>{labels.previewAsRole}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-1 min-w-[180px] rounded-xl border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl">
        <DropdownMenuItem onClick={() => onStartImpersonation(null, "Recruiter")} className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
          {labels.recruiterView}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStartImpersonation(null, "Hiring Manager")} className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium">
          {labels.hiringManagerView}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function PreviewUserSubmenu({
  previewUsers,
  isSearchingUsers,
  onUserSearch,
  onStartImpersonation,
  labels,
}: Pick<HeaderDesktopMenuProps, "previewUsers" | "isSearchingUsers" | "onUserSearch" | "onStartImpersonation" | "labels">) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-amber-50/50 dark:text-zinc-300 dark:hover:bg-amber-500/5">
        <Package2 className="mr-2 h-4 w-4 text-amber-500" />
        <span>{labels.previewAsUser}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-0 min-w-[240px] max-h-[300px] overflow-hidden rounded-xl border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl flex flex-col">
        <div className="p-2 border-b border-border/50">
          <input
            type="text"
            placeholder={labels.searchUsers}
            className="w-full px-3 py-1.5 text-xs rounded-md bg-muted/50 border-none focus:ring-1 focus:ring-amber-500 outline-none"
            autoFocus
            onChange={(event) => onUserSearch(event.target.value)}
          />
        </div>
        <ScrollArea className="flex-1 max-h-[220px]">
          <div className="p-1">
            {isSearchingUsers ? (
              <div className="py-8 text-center">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : previewUsers.length > 0 ? (
              previewUsers.map((previewUser) => (
                <DropdownMenuItem
                  key={previewUser.id}
                  onClick={() => onStartImpersonation(previewUser.id, null)}
                  className="flex flex-col items-start px-3 py-2 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                >
                  <span className="text-xs font-semibold">{previewUser.name}</span>
                  <span className="text-[10px] text-muted-foreground">{previewUser.email} - {previewUser.role}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <p className="p-4 text-[10px] text-muted-foreground italic text-center">
                {labels.searchUsersHint}
              </p>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
