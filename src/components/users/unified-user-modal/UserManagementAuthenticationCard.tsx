import React from 'react';
import { Loader2, RefreshCw, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import type { UserManagementFormProps } from './user-management-form-types';
import { AUTHENTICATION_METHOD_OPTIONS, updateAuthenticationMethods } from './user-management-form-utils';

type AuthenticationCardProps = Pick<
  UserManagementFormProps,
  'form' | 'canManageAuthentication' | 'isLookingUpAD' | 'handleLookupAzureAD'
>;

export function AuthenticationCard({
  form,
  canManageAuthentication,
  isLookingUpAD,
  handleLookupAzureAD,
}: AuthenticationCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-primary" />
          Authentication
        </CardTitle>
        <CardDescription>Configure how this user logs in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AuthenticationMethodsField form={form} canManageAuthentication={canManageAuthentication} />
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleLookupAzureAD}
            disabled={isLookingUpAD}
          >
            {isLookingUpAD ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync with Azure AD
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuthenticationMethodsField({
  form,
  canManageAuthentication,
}: Pick<UserManagementFormProps, 'form' | 'canManageAuthentication'>): React.ReactElement {
  return (
    <FormField
      control={form.control}
      name="authenticationMethods"
      render={({ field }) => (
        <FormItem>
          <div className="mb-4">
            <FormLabel className="text-base">Allowed Methods</FormLabel>
            <FormDescription>Select the methods this user can use to sign in.</FormDescription>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {AUTHENTICATION_METHOD_OPTIONS.map((method) => (
              <FormItem
                key={method.value}
                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors"
              >
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(method.value)}
                    disabled={!canManageAuthentication}
                    onCheckedChange={(checked) => {
                      field.onChange(updateAuthenticationMethods(field.value, method.value, Boolean(checked)));
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{method.label}</FormLabel>
                  <FormDescription>{method.description}</FormDescription>
                </div>
              </FormItem>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
