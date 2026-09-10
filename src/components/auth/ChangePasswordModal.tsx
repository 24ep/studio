"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { KeyRound, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  CHANGE_PASSWORD_DEFAULT_VALUES,
  CHANGE_PASSWORD_FIELDS,
  CHANGE_PASSWORD_SUCCESS_MESSAGE,
  buildChangePasswordRequestBody,
  changePasswordFormSchema,
  getChangePasswordErrorMessage,
  getChangePasswordFormClassName,
  getChangePasswordSubmitButtonClassName,
  getChangePasswordSubmitLabel,
  shouldResetChangePasswordForm,
  type ChangePasswordFormValues,
} from './change-password-modal-utils';
import { postAuthJson } from './auth-client-api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export function ChangePasswordModal({ isOpen, onOpenChange }: ChangePasswordModalProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: CHANGE_PASSWORD_DEFAULT_VALUES,
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await postAuthJson(
        '/api/auth/change-password',
        buildChangePasswordRequestBody(data),
        'Failed to change password'
      );
      toast.success(CHANGE_PASSWORD_SUCCESS_MESSAGE);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      setApiError(getChangePasswordErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (shouldResetChangePasswordForm(open)) {
      form.reset();
      setApiError(null);
    }
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={getChangePasswordFormClassName(isMobile)}>
        {apiError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}
        {CHANGE_PASSWORD_FIELDS.map(({ name, label }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor={name}>{label}</FormLabel>
                <FormControl>
                  <Input id={name} type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        {isMobile ? (
          <DrawerFooter className="pt-4 px-0">
            <Button type="submit" disabled={isSubmitting} className={getChangePasswordSubmitButtonClassName(true)}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {getChangePasswordSubmitLabel(isSubmitting)}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        ) : (
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className={getChangePasswordSubmitButtonClassName(false)}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {getChangePasswordSubmitLabel(isSubmitting)}
            </Button>
          </DialogFooter>
        )}
      </form>
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-primary" /> Change Password
            </DrawerTitle>
            <DrawerDescription>
              Update your account password. Make sure it&apos;s strong and memorable.
            </DrawerDescription>
          </DrawerHeader>
          <div className="pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" /> Change Password
          </DialogTitle>
          <DialogDescription>
            Update your account password. Make sure it&apos;s strong and memorable.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
