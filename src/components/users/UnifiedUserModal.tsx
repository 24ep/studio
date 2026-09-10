"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { UnifiedUserModalContent } from './unified-user-modal/UnifiedUserModalContent';
import { UserProfile } from '@/lib/types';
import {
  UnifiedUserFormValues,
  ModalMode
} from './unified-user-modal/types';

interface UnifiedUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: ModalMode;
  user?: UserProfile | null;
  onSave: (data: UnifiedUserFormValues) => Promise<void>;
  onEditUser?: (userId: string, data: UnifiedUserFormValues) => Promise<void>;
  onAddUser?: (data: UnifiedUserFormValues) => Promise<void>;
}

export function UnifiedUserModal(props: UnifiedUserModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={props.isOpen} onOpenChange={props.onOpenChange}>
        <DrawerContent className="h-[95dvh] p-0" drawerId="unified-user-drawer" hideCloseButton>
          <UnifiedUserModalContent {...props} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent
        placement="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        dialogId="unified-user-profile-drawer"
        hideCloseButton
      >
        <UnifiedUserModalContent {...props} />
      </DialogContent>
    </Dialog>
  );
}

export type { UnifiedUserFormValues, ModalMode } from './unified-user-modal/types';
