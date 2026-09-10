"use client";

import type { UseFormReturn } from 'react-hook-form';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserProfile } from '@/lib/types';
import type { ModalMode, UnifiedUserFormValues } from './types';
import {
  UnifiedUserAvatarField,
  UnifiedUserHeaderActions,
  UnifiedUserIdentityFields,
  UnifiedUserModalCloseButton,
} from './UnifiedUserModalHeaderParts';

type UnifiedUserModalHeaderProps = {
  form: UseFormReturn<UnifiedUserFormValues>;
  user?: UserProfile | null;
  mode: ModalMode;
  isSaving: boolean;
  onClose: () => void;
};

export function UnifiedUserModalHeader({
  form,
  user,
  mode,
  isSaving,
  onClose,
}: UnifiedUserModalHeaderProps) {
  return (
    <div className="relative flex-shrink-0 border-b border-border/70 bg-background px-5 py-5 sm:px-6">
      <UnifiedUserModalCloseButton onClose={onClose} />

      <div className="flex flex-col items-start gap-4 pr-10 md:flex-row md:items-center">
        <UnifiedUserAvatarField form={form} user={user} />
        <UnifiedUserIdentityFields form={form} mode={mode} user={user} />
        <UnifiedUserHeaderActions isSaving={isSaving} onClose={onClose} />
      </div>
    </div>
  );
}

const TAB_TRIGGER_CLASS =
  "relative bottom-[-1px] z-10 h-11 !rounded-none border-b-2 border-transparent px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

type UnifiedUserModalTabsListProps = {
  mode: ModalMode;
  user?: UserProfile | null;
};

export function UnifiedUserModalTabsList({ mode, user }: UnifiedUserModalTabsListProps) {
  return (
    <div className="sticky top-0 z-10 w-full border-b border-border/70 bg-background/95 px-5 backdrop-blur-sm sm:px-6">
      <TabsList className="h-11 w-full justify-start gap-5 overflow-x-auto bg-transparent p-0 no-scrollbar">
        <TabsTrigger value="personal" className={TAB_TRIGGER_CLASS}>
          Personal Info
        </TabsTrigger>
        <TabsTrigger value="account" className={TAB_TRIGGER_CLASS}>
          Account
        </TabsTrigger>
        <TabsTrigger value="security" className={TAB_TRIGGER_CLASS}>
          Security
        </TabsTrigger>
        {mode !== 'create' && user?.id && (
          <TabsTrigger value="hiring" className={TAB_TRIGGER_CLASS}>
            Hiring
          </TabsTrigger>
        )}
      </TabsList>
    </div>
  );
}
