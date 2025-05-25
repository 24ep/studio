
"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit3 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

const userRoleOptions: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];

// Schema for editing user. Password is not included here as password changes
// typically involve a separate, more secure flow (e.g. current password + new password).
const editUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"), 
  role: z.enum(userRoleOptions, { required_error: "Role is required" }),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditUser: (userId: string, data: EditUserFormValues) => Promise<void>;
  user: UserProfile | null;
}

export function EditUserModal({ isOpen, onOpenChange, onEditUser, user }: EditUserModalProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Recruiter',
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else if (!isOpen) {
        form.reset({ name: '', email: '', role: 'Recruiter' }); // Reset form when modal is closed
    }
  }, [user, isOpen, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;
    await onEditUser(user.id, data);
  };

  if (!user && isOpen) return null; // Don't render if no user and modal is supposed to be open

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        form.reset({ name: '', email: '', role: 'Recruiter' });
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" /> Edit User: {user?.name || 'N/A'}
          </DialogTitle>
          <DialogDescription>
            Update the user's details. Password changes are handled separately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="name-edit">Full Name *</Label>
            <Input id="name-edit" {...form.register('name')} className="mt-1" />
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email-edit">Email Address *</Label>
            <Input id="email-edit" type="email" {...form.register('email')} className="mt-1" />
            {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
             <p className="text-xs text-muted-foreground mt-1">Ensure email is unique. Changing email might require re-verification in a production system.</p>
          </div>
          <div>
            <Label htmlFor="role-edit">Role *</Label>
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger id="role-edit" className="mt-1">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoleOptions.map(roleValue => (
                      <SelectItem key={roleValue} value={roleValue}>{roleValue}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.role && <p className="text-sm text-destructive mt-1">{form.formState.errors.role.message}</p>}
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
    