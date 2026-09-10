import {
  ArrowPathIcon as RefreshCw,
  CubeIcon as Package2,
  EyeIcon as Eye,
  MagnifyingGlassIcon as Search,
} from "@heroicons/react/24/outline";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { HeaderMobileUserDrawerProps } from "./HeaderMobileUserDrawerTypes";

type HeaderMobileUserDrawerAdminPreviewProps = Pick<
  HeaderMobileUserDrawerProps,
  "isSearchingUsers" | "onStartImpersonation" | "onUserSearch" | "previewUsers" | "labels"
>;

export function HeaderMobileUserDrawerAdminPreview({
  isSearchingUsers,
  onStartImpersonation,
  onUserSearch,
  previewUsers,
  labels,
}: HeaderMobileUserDrawerAdminPreviewProps) {
  return (
    <div className="space-y-3 p-1">
      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 px-4">
        {labels.adminPreviewTools}
      </h4>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 px-1">
          <button
            type="button"
            onClick={() => onStartImpersonation(null, "Recruiter")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 text-amber-700 dark:text-amber-400 gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">
              {labels.recruiterView}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStartImpersonation(null, "Hiring Manager")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 text-amber-700 dark:text-amber-400 gap-1.5"
          >
            <Package2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">
              {labels.managerView}
            </span>
          </button>
        </div>

        <div className="px-1 mt-1">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={labels.searchUsersToPreview}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                  onChange={(event) => onUserSearch(event.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="max-h-[200px]">
              <div className="p-1">
                <AdminPreviewUserList
                  isSearchingUsers={isSearchingUsers}
                  onStartImpersonation={onStartImpersonation}
                  previewUsers={previewUsers}
                  labels={labels}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

type AdminPreviewUserListProps = Omit<
  HeaderMobileUserDrawerAdminPreviewProps,
  "onUserSearch"
>;

function AdminPreviewUserList({
  isSearchingUsers,
  onStartImpersonation,
  previewUsers,
  labels,
}: AdminPreviewUserListProps) {
  if (isSearchingUsers) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-500/50" />
      </div>
    );
  }

  if (previewUsers.length === 0) {
    return (
      <div className="py-8 text-center px-4">
        <p className="text-[11px] text-zinc-400 font-medium">
          {labels.enterSearchHint}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {previewUsers.map((previewUser) => (
        <button
          type="button"
          key={previewUser.id}
          onClick={() => onStartImpersonation(previewUser.id, null)}
          className="flex items-center w-full px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors gap-3 group text-left"
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 text-xs font-bold">
            {previewUser.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              {previewUser.name}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {previewUser.role}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
