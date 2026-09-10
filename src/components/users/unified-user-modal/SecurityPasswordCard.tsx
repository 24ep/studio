import type { UseFormReturn } from 'react-hook-form';
import { Lock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { UnifiedUserFormValues } from './types';

interface SecurityPasswordCardProps {
  form: UseFormReturn<UnifiedUserFormValues>;
  canForcePasswordChange: boolean;
}

export function SecurityPasswordCard({
  form,
  canForcePasswordChange,
}: SecurityPasswordCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-primary" />
          Password Management
        </CardTitle>
        <CardDescription>
          Update password or force reset on next login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {canForcePasswordChange && (
          <FormField
            control={form.control}
            name="forcePasswordChange"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/20">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Force Password Change</FormLabel>
                  <FormDescription>
                    Require the user to change their password upon next sign-in.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
