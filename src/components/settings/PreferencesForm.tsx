import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X, Palette, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: string;
  modelType?: 'Candidate' | 'Position';
  attributeKey?: string;
  uiPreference?: 'Standard' | 'Emphasized' | 'Hidden';
  customNote?: string;
}

interface PreferencesFormProps {
  open: boolean;
  preference: UserPreference | null;
  onClose: () => void;
  onSubmit: (data: UserPreference) => void;
  isSaving?: boolean;
}

const preferenceFormSchema = z.object({
  key: z.string().min(1, 'Preference key is required'),
  value: z.string().min(1, 'Value is required'),
  modelType: z.enum(['Candidate', 'Position']).optional(),
  attributeKey: z.string().optional(),
  uiPreference: z.enum(['Standard', 'Emphasized', 'Hidden']).optional(),
  customNote: z.string().optional(),
});

type PreferenceFormValues = z.infer<typeof preferenceFormSchema>;

const PreferencesForm: React.FC<PreferencesFormProps> = ({ 
  open, 
  preference, 
  onClose, 
  onSubmit, 
  isSaving = false 
}) => {
  const form = useForm<PreferenceFormValues>({
    resolver: zodResolver(preferenceFormSchema),
    defaultValues: {
      key: '',
      value: '',
      modelType: 'Candidate',
      attributeKey: '',
      uiPreference: 'Standard',
      customNote: '',
    },
  });

  useEffect(() => {
    if (preference) {
      form.reset({
        key: preference.key,
        value: preference.value,
        modelType: preference.modelType || 'Candidate',
        attributeKey: preference.attributeKey || '',
        uiPreference: preference.uiPreference || 'Standard',
        customNote: preference.customNote || '',
      });
    } else {
      form.reset({
        key: '',
        value: '',
        modelType: 'Candidate',
        attributeKey: '',
        uiPreference: 'Standard',
        customNote: '',
      });
    }
  }, [preference, form]);

  const handleSubmit = (data: PreferenceFormValues) => {
    const preferenceData: UserPreference = {
      id: preference?.id || '',
      userId: preference?.userId || '',
      key: data.key,
      value: data.value,
      modelType: data.modelType,
      attributeKey: data.attributeKey,
      uiPreference: data.uiPreference,
      customNote: data.customNote,
    };
    onSubmit(preferenceData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {preference ? <Settings className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
            {preference ? 'Edit Preference' : 'Add New Preference'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preference Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., ui.theme, data.displayMode"
                      disabled={!!preference} // Can't edit key for existing preferences
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this preference. Use dot notation for organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter preference value"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    The value for this preference. Can be JSON for complex data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Candidate">Candidate</SelectItem>
                        <SelectItem value="Position">Position</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uiPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UI Preference</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UI preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Emphasized">Emphasized</SelectItem>
                        <SelectItem value="Hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="attributeKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribute Key (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., name, email, parsedData.personal_info.location"
                    />
                  </FormControl>
                  <FormDescription>
                    Specific attribute this preference applies to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about this preference"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isValid}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PreferencesForm; 