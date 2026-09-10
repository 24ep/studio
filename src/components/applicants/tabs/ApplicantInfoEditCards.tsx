import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type {
  Control,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import { composeApplicantInfoFullName } from './applicant-info-tab-utils';
import { ApplicantInfoFormField } from './ApplicantInfoFormField';

interface ApplicantInfoEditCardsProps {
  register?: UseFormRegister<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
  control?: Control<EditApplicantFormValues>;
  emailError: string | null;
  phoneError: string | null;
  firstNameError: string | null;
  lastNameError: string | null;
}

export function ApplicantInfoEditCards({
  register,
  watch,
  control,
  emailError,
  phoneError,
  firstNameError,
  lastNameError,
}: ApplicantInfoEditCardsProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ApplicantInfoFormField
              name="email"
              label="Email *"
              type="email"
              placeholder="Enter email address"
              register={register}
              control={control}
              error={emailError}
            />
            <ApplicantInfoFormField
              name="phone"
              label="Phone"
              type="tel"
              placeholder="Enter phone number"
              register={register}
              control={control}
              error={phoneError}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name (Auto-generated)</Label>
            <div className="mt-1 p-3 bg-muted rounded-md border">
              <span className="text-sm font-medium">
                {composeApplicantInfoFullName(
                  watch?.('parsedData.personal_info.title_honorific') || '',
                  watch?.('parsedData.personal_info.firstname') || '',
                  watch?.('parsedData.personal_info.lastname') || '',
                ) || 'Enter title, first name, and last name to see full name'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ApplicantInfoFormField
              name="parsedData.personal_info.title_honorific"
              label="Title"
              placeholder="e.g., Mr., Ms., Dr."
              register={register}
              control={control}
            />
            <ApplicantInfoFormField
              name="parsedData.personal_info.firstname"
              label="First Name *"
              placeholder="Enter first name"
              register={register}
              control={control}
              error={firstNameError}
            />
            <ApplicantInfoFormField
              name="parsedData.personal_info.lastname"
              label="Last Name *"
              placeholder="Enter last name"
              register={register}
              control={control}
              error={lastNameError}
            />
            <ApplicantInfoFormField
              name="parsedData.personal_info.nickname"
              label="Nickname"
              placeholder="Enter nickname"
              register={register}
              control={control}
            />
          </div>
          <ApplicantInfoFormField
            name="parsedData.personal_info.location"
            label="Location"
            placeholder="e.g., Bangkok, Thailand"
            register={register}
            control={control}
          />
          <ApplicantInfoFormField
            name="parsedData.personal_info.introduction_aboutme"
            label="About Me"
            placeholder="Tell us about yourself..."
            register={register}
            control={control}
            multiline
          />
        </CardContent>
      </Card>
    </div>
  );
}
