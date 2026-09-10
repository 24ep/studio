import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AddApplicantSectionProps } from "./AddApplicantModalSectionTypes";

export function AddApplicantPersonalSection({ controller }: AddApplicantSectionProps) {
  const { form } = controller;

  return (
    <>
      <div>
        <Label htmlFor="cv_language">Résumé language</Label>
        <Input id="cv_language" {...form.register("cv_language")} className="mt-1" />
      </div>

      <fieldset className="space-y-3 border p-4 rounded-md">
        <legend className="text-lg font-semibold">Personal Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="personal_info.title_honorific">Title</Label>
            <Input id="personal_info.title_honorific" {...form.register("personal_info.title_honorific")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="personal_info.firstname">First Name *</Label>
            <Input id="personal_info.firstname" {...form.register("personal_info.firstname")} className="mt-1" />
            {form.formState.errors.personal_info?.firstname && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.personal_info.firstname.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="personal_info.lastname">Last Name *</Label>
            <Input id="personal_info.lastname" {...form.register("personal_info.lastname")} className="mt-1" />
            {form.formState.errors.personal_info?.lastname && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.personal_info.lastname.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="personal_info.nickname">Nickname</Label>
            <Input id="personal_info.nickname" {...form.register("personal_info.nickname")} className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="personal_info.location">Location</Label>
          <Input id="personal_info.location" {...form.register("personal_info.location")} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="personal_info.avatar_url">Avatar URL</Label>
          <Input id="personal_info.avatar_url" type="url" {...form.register("personal_info.avatar_url")} className="mt-1" placeholder="https://example.com/photo.jpg" />
          {form.formState.errors.personal_info?.avatar_url && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.personal_info.avatar_url.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="personal_info.introduction_aboutme">About Me</Label>
          <Textarea
            id="personal_info.introduction_aboutme"
            {...form.register("personal_info.introduction_aboutme")}
            placeholder="Tell us about yourself..."
            className="mt-1 min-h-[100px]"
          />
        </div>
      </fieldset>
    </>
  );
}
