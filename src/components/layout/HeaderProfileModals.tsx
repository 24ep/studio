"use client";

import dynamic from "next/dynamic";
import type { UnifiedUserFormValues } from "@/components/users/UnifiedUserModal";
import type { UserProfile } from "@/lib/types";

import type { HeaderUserSummary } from "./HeaderUserMenu.types";

const ChangePasswordModal = dynamic(
  () => import("@/components/auth/ChangePasswordModal").then((module) => module.ChangePasswordModal),
  { ssr: false },
);

const UnifiedUserModal = dynamic(
  () => import("@/components/users/UnifiedUserModal").then((module) => module.UnifiedUserModal),
  { ssr: false },
);

interface HeaderProfileModalsProps {
  user: HeaderUserSummary | null;
  isChangePasswordModalOpen: boolean;
  setIsChangePasswordModalOpen: (open: boolean) => void;
  isUserModalOpen: boolean;
  setIsUserModalOpen: (open: boolean) => void;
  fullUserData: UserProfile | null;
  sessionUser: UserProfile | null;
  onSaveProfile: (data: UnifiedUserFormValues) => Promise<void>;
}

export function HeaderProfileModals({
  user,
  isChangePasswordModalOpen,
  setIsChangePasswordModalOpen,
  isUserModalOpen,
  setIsUserModalOpen,
  fullUserData,
  sessionUser,
  onSaveProfile,
}: HeaderProfileModalsProps) {
  if (!user) {
    return null;
  }

  return (
    <>
      {isChangePasswordModalOpen ? (
        <ChangePasswordModal
          isOpen
          onOpenChange={setIsChangePasswordModalOpen}
        />
      ) : null}
      {isUserModalOpen ? (
        <UnifiedUserModal
          isOpen
          onOpenChange={setIsUserModalOpen}
          mode="profile"
          user={fullUserData || sessionUser}
          onSave={onSaveProfile}
        />
      ) : null}
    </>
  );
}
