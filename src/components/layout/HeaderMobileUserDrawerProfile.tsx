import {
  KeyIcon as KeyRound,
  PencilSquareIcon as Edit3,
} from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { UserAvatarCompact } from "@/components/ui/user-avatar";
import type { HeaderMobileUserDrawerProps } from "./HeaderMobileUserDrawerTypes";

type HeaderMobileUserDrawerProfileProps = Pick<
  HeaderMobileUserDrawerProps,
  | "onOpenProfile"
  | "onOpenSecurity"
  | "refreshAvatar"
  | "user"
  | "labels"
>;

export function HeaderMobileUserDrawerProfile({
  onOpenProfile,
  onOpenSecurity,
  refreshAvatar,
  user,
  labels,
}: HeaderMobileUserDrawerProfileProps) {
  return (
    <>
      <DrawerHeader className="px-1 text-left">
        <div className="flex items-center gap-4 mb-2">
          <UserAvatarCompact
            user={user}
            size="md"
            className="rounded-2xl"
            forceRefresh={refreshAvatar}
          />
          <div className="flex flex-col">
            <DrawerTitle className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {user.name}
            </DrawerTitle>
            <DrawerDescription className="text-sm font-medium text-zinc-500 truncate max-w-[200px]">
              {user.email}
            </DrawerDescription>
            <Badge
              variant="secondary"
              className="mt-1 w-fit bg-primary/5 text-primary border-primary/10 text-[10px] uppercase font-bold tracking-wider"
            >
              {user.role || labels.userFallback}
            </Badge>
          </div>
        </div>
      </DrawerHeader>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 transition-colors gap-2"
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
            <Edit3 className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold">{labels.profile}</span>
        </button>
        <button
          type="button"
          onClick={onOpenSecurity}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 transition-colors gap-2"
        >
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold">{labels.security}</span>
        </button>
      </div>
    </>
  );
}
