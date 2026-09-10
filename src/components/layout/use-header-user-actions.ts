"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocalization } from "@/contexts/LocalizationContext";

import type { UnifiedUserFormValues } from "@/components/users/UnifiedUserModal";
import {
  clearHeaderUserCache,
  fetchHeaderUserProfile,
  searchHeaderPreviewUsers,
  updateHeaderUserProfile,
} from "./header-user-actions-api";
import {
  clearCacheStorage,
  clearIndexedDatabases,
  clearWebStorage,
  unregisterServiceWorkers,
} from "../../lib/browser-storage-cleanup";
import type { UserProfile } from "@/lib/types";
import type { HeaderPreviewUserSummary } from "./HeaderUserMenu.types";
import {
  HEADER_SIGNOUT_URL,
  buildHeaderUserSummary,
  getHeaderCaughtErrorMessage,
  getHeaderImpersonationLoadingMessage,
  shouldForceHeaderAvatarRefresh,
  shouldSearchHeaderUsers,
  shouldUpdateHeaderSessionUser,
} from "./use-header-user-actions-utils";

interface HeaderUserActionsOptions {
  session: Session | null;
  updateSession: (data?: unknown) => Promise<Session | null>;
  forceRefresh: () => void;
}

async function clearBrowserSessionCaches() {
  if (typeof window === "undefined") {
    return;
  }

  await clearCacheStorage("caches" in window ? caches : null);
  await unregisterServiceWorkers(typeof navigator !== "undefined" && "serviceWorker" in navigator
    ? navigator.serviceWorker
    : null);
  await clearWebStorage(window.localStorage);
  await clearWebStorage(window.sessionStorage);
}

export function useHeaderUserActions({
  session,
  updateSession,
  forceRefresh,
}: HeaderUserActionsOptions) {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [fullUserData, setFullUserData] = useState<UserProfile | null>(null);
  const [previewUsers, setPreviewUsers] = useState<HeaderPreviewUserSummary[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const { t } = useLocalization();

  const user = useMemo(() => {
    return buildHeaderUserSummary(session?.user, t);
  }, [
    session?.user?.id,
    session?.user?.name,
    session?.user?.email,
    session?.user?.role,
    session?.user?.avatarUrl,
    session?.user?.image,
    session?.user?.personalColor,
    t,
  ]);

  const handleSignOut = useCallback(async () => {
    try {
      if (session?.user?.id) {
        clearHeaderUserCache(session.user.id).catch((error) => {
          console.warn("[HEADER] Cache clearing failed:", error);
        });
      }

      try {
        await clearBrowserSessionCaches();
      } catch (error) {
        console.warn("[HEADER] Failed to clear browser session caches:", error);
      }

      await signOut({
        callbackUrl: HEADER_SIGNOUT_URL,
        redirect: false,
      });

      window.location.href = HEADER_SIGNOUT_URL;
    } catch (error) {
      console.error("[HEADER] Signout error:", error);
      window.location.href = HEADER_SIGNOUT_URL;
    }
  }, [session?.user?.id]);

  const handleEditProfile = useCallback(async (data: UnifiedUserFormValues) => {
    if (!session?.user) return;

    try {
      const result = await updateHeaderUserProfile(session.user.id, data);
      toast.success(t("header.profileUpdated", "Profile Updated"));

      if (shouldUpdateHeaderSessionUser(session.user, result)) {
        await updateSession();

        if (shouldForceHeaderAvatarRefresh(session.user, result)) {
          forceRefresh();
        }
      }

      setIsUserModalOpen(false);
    } catch (error) {
      console.error("[HEADER] Profile update error:", error);
      toast.error(getHeaderCaughtErrorMessage(error, t));
    }
  }, [session?.user, updateSession, forceRefresh, t]);

  const handleClearCache = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      await clearWebStorage(window.localStorage);
      await clearWebStorage(window.sessionStorage);
      await clearIndexedDatabases("indexedDB" in window ? indexedDB : null);
      await clearCacheStorage("caches" in window ? caches : null);
    } catch (error) {
      console.warn("[HEADER] Failed to clear some browser caches:", error);
    }

    forceRefresh();
    toast.success(t("header.cacheCleared", "Cache cleared successfully"));
  }, [forceRefresh, t]);

  const handleUserSearch = useCallback(async (query: string) => {
    if (!shouldSearchHeaderUsers(query)) {
      setPreviewUsers([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      setPreviewUsers(await searchHeaderPreviewUsers(query));
    } catch (error) {
      console.error("[HEADER] User search error:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  }, []);

  const handleStartImpersonation = useCallback(async (userId: string | null, role: string | null) => {
    try {
      toast.loading(getHeaderImpersonationLoadingMessage(userId, role, t), { id: "impersonate-toast" });
      await updateSession({
        impersonatedUserId: userId,
        impersonatedRole: role,
      });
      toast.success(t("header.previewModeActive", "Preview mode active"), { id: "impersonate-toast" });

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      toast.error(t("header.failedStartPreviewMode", "Failed to start preview mode"), { id: "impersonate-toast" });
    }
  }, [updateSession, t]);

  const handleOpenProfileModal = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const userData = await fetchHeaderUserProfile(session.user.id);
      if (userData) {
        setFullUserData(userData);
        setIsUserModalOpen(true);
        return;
      }

      console.error("Failed to fetch user data for profile modal");
      setIsUserModalOpen(true);
    } catch (error) {
      console.error("Error fetching user data for profile modal:", error);
      setIsUserModalOpen(true);
    }
  }, [session?.user?.id]);

  return {
    user,
    isUserModalOpen,
    setIsUserModalOpen,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen,
    fullUserData,
    previewUsers,
    isSearchingUsers,
    handleSignOut,
    handleEditProfile,
    handleClearCache,
    handleUserSearch,
    handleStartImpersonation,
    handleOpenProfileModal,
  };
}
