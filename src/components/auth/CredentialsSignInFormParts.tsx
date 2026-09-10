"use client";

import type { UseFormReturn } from 'react-hook-form';
import { AlertTriangle, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CredentialsFormValues } from './use-credentials-signin-form';

interface CredentialsPasswordFormProps {
  activeBgEnd?: string;
  activeBgStart?: string;
  activeFontColor?: string;
  clearError: () => void;
  error: string | null;
  form: UseFormReturn<CredentialsFormValues>;
  isActioning: boolean;
  isLoading: boolean;
  showPassword: boolean;
  shouldShowInlineError: boolean;
  submitButtonClassName?: string;
  submitCredentials: (data: CredentialsFormValues) => Promise<void>;
  togglePasswordVisibility: () => void;
}

export function CredentialsPasswordForm({
  clearError,
  error,
  form,
  isActioning,
  isLoading,
  showPassword,
  shouldShowInlineError,
  submitButtonClassName,
  submitCredentials,
  togglePasswordVisibility,
}: CredentialsPasswordFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => submitCredentials(data))} className="space-y-5">
        {error && shouldShowInlineError && (
          <Alert variant="destructive" className="mt-0 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    className="h-12 rounded-2xl border-border/60 bg-zinc-100/80 pl-11 shadow-sm transition-all hover:bg-zinc-100 focus:border-primary/40 focus:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
                    type="email"
                    placeholder="name@example.com"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      clearError();
                    }}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground/80">Password</FormLabel>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    className="h-12 rounded-2xl border-border/60 bg-zinc-100/80 pl-11 pr-12 shadow-sm transition-all hover:bg-zinc-100 focus:border-primary/40 focus:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      clearError();
                    }}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          aria-busy={isLoading || isActioning}
          className={`h-12 w-full rounded-2xl shadow-lg transition-[transform,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] disabled:translate-y-0 disabled:shadow-md ${submitButtonClassName || ''}`}
          disabled={isLoading || isActioning}
        >
          {(isLoading || isActioning) ? (
            <span className="inline-flex min-w-32 items-center justify-center gap-2.5" role="status">
              <LoaderCircle className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" strokeWidth={2.25} aria-hidden="true" />
              <span className="font-semibold">Signing in…</span>
            </span>
          ) : (
            <span className="inline-flex min-w-32 items-center justify-center gap-2">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <span className="font-semibold">Sign in</span>
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
