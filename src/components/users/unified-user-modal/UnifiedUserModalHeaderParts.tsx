"use client";

import type { UseFormReturn } from "react-hook-form";
import { Briefcase, Loader2, Mail, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserAvatarUpload } from "@/components/ui/user-avatar-upload";
import type { UserProfile } from "@/lib/types";
import type { ModalMode, UnifiedUserFormValues } from "./types";

export function UnifiedUserModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Close user modal"
    >
      <X className="h-5 w-5" />
    </button>
  );
}

export function UnifiedUserAvatarField({
  form,
  user,
}: {
  form: UseFormReturn<UnifiedUserFormValues>;
  user?: UserProfile | null;
}) {
  return (
    <div className="flex-shrink-0 relative">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative">
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <UserAvatarUpload
                    user={user || { id: "", name: "", email: "", avatarUrl: field.value }}
                    onImageUpload={async (imageUrl) => field.onChange(imageUrl)}
                    onImageRemove={async () => field.onChange("")}
                    size="xl"
                    className="w-24 h-24"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function UnifiedUserIdentityFields({
  form,
  mode,
  user,
}: {
  form: UseFormReturn<UnifiedUserFormValues>;
  mode: ModalMode;
  user?: UserProfile | null;
}) {
  return (
    <div className="flex-1 min-w-0 space-y-2 text-center md:text-left">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <FormControl>
              <Input
                {...field}
                className="text-3xl font-bold tracking-tight bg-transparent border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40 md:text-left text-center"
                placeholder="User Name"
              />
            </FormControl>
            <FormMessage className="text-center md:text-left" />
          </FormItem>
        )}
      />

      {(mode === "edit" || mode === "profile") && user?.email && (
        <div className="flex items-center gap-2 justify-center md:justify-start text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="text-sm font-medium">{user.email}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-2 text-muted-foreground">
        <FormField
          control={form.control}
          name="positionTitle"
          render={({ field }) => (
            <FormItem className="space-y-0 min-w-[200px]">
              <FormControl>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Briefcase className="h-4 w-4" />
                  <Input
                    {...field}
                    value={field.value || ""}
                    className="h-8 border-transparent hover:border-border bg-transparent px-2 font-medium w-full text-center md:text-left focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Add job title"
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function UnifiedUserHeaderActions({
  isSaving,
}: {
  isSaving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mt-4 md:mt-0">
      <Button type="submit" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
}
