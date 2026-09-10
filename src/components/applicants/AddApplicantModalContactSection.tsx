import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddApplicantSectionProps } from "./AddApplicantModalSectionTypes";

export function AddApplicantContactSection({ controller }: AddApplicantSectionProps) {
  const { form } = controller;

  return (
    <fieldset className="space-y-3 border p-4 rounded-md">
      <legend className="text-lg font-semibold">Contact Information</legend>
      <div>
        <Label htmlFor="contact_info.email">Email *</Label>
        <Input id="contact_info.email" type="email" {...form.register("contact_info.email")} className="mt-1" />
        {form.formState.errors.contact_info?.email && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.contact_info.email.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="contact_info.phone">Phone</Label>
        <Input id="contact_info.phone" type="tel" {...form.register("contact_info.phone")} className="mt-1" />
      </div>
    </fieldset>
  );
}
