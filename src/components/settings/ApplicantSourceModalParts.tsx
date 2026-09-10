import type { ChangeEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import type { ApplicantSourceFormValues } from './ApplicantSourceModalTypes';

interface ApplicantSourceFormFieldsProps {
  form: UseFormReturn<ApplicantSourceFormValues>;
  logoPreview: string | null;
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

export function ApplicantSourceFormFields({
  form,
  logoPreview,
  onLogoChange,
  onRemoveLogo,
}: ApplicantSourceFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...form.register('name')}
          placeholder="e.g., JobDB, JobThai, Referral"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Optional description of this source"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email List</Label>
        <Input
          id="email"
          {...form.register('email')}
          placeholder="e.g., source@company.com, contact@source.com"
        />
        <p className="text-sm text-muted-foreground">
          Comma-separated list of email addresses for this source
        </p>
      </div>

      <ApplicantSourceLogoField
        logoPreview={logoPreview}
        onLogoChange={onLogoChange}
        onRemoveLogo={onRemoveLogo}
      />

      <ApplicantSourceSwitchField
        id="allowSubSource"
        label="Allow Sub Source"
        description="Enable free text input for additional source details"
        checked={form.watch('allowSubSource')}
        onCheckedChange={(checked) => form.setValue('allowSubSource', checked)}
      />

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          type="number"
          {...form.register('sortOrder')}
          placeholder="0"
        />
      </div>

      <ApplicantSourceSwitchField
        id="isActive"
        label="Active"
        description="Enable or disable this source option"
        checked={form.watch('isActive')}
        onCheckedChange={(checked) => form.setValue('isActive', checked)}
      />
    </>
  );
}

function ApplicantSourceLogoField({
  logoPreview,
  onLogoChange,
  onRemoveLogo,
}: {
  logoPreview: string | null;
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}) {
  return (
    <div className="space-y-4">
      <Label>Logo</Label>
      <div className="flex items-center gap-4">
        {logoPreview && (
          <div className="relative">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="h-16 w-16 object-contain rounded-full border"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveLogo}
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex-1">
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={onLogoChange}
            className="hidden"
          />
          <Label
            htmlFor="logo"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {logoPreview ? 'Change Logo' : 'Upload Logo'}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Recommended: 64x64px or larger, PNG/JPG format
          </p>
        </div>
      </div>
    </div>
  );
}

function ApplicantSourceSwitchField({
  checked,
  description,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description: string;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

interface ApplicantSourceModalFooterProps {
  disabled: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: () => void;
}

export function ApplicantSourceModalFooter({
  disabled,
  isSubmitting,
  submitLabel,
  onSubmit,
}: ApplicantSourceModalFooterProps) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </DialogClose>
      <Button type="submit" disabled={disabled} onClick={onSubmit}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </DialogFooter>
  );
}
