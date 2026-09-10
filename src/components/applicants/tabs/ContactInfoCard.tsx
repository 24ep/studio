import type { ApplicantContactInfo } from './ContactTabTypes';

interface ContactInfoCardProps {
  contactInfo?: ApplicantContactInfo;
}

export function ContactInfoCard({ contactInfo }: ContactInfoCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="grid lg:grid-cols-[minmax(150px,190px)_minmax(0,1fr)]">
        <div className="bg-muted/25 px-4 py-5 lg:border-r lg:border-border lg:px-5">
          <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Ways to reach the applicant during the recruitment process.
          </p>
        </div>
        <div className="grid gap-x-8 px-4 py-1 sm:grid-cols-2 lg:px-6">
          <ContactInfoValue label="Email" value={contactInfo?.email} />
          <ContactInfoValue label="Phone" value={contactInfo?.phone} />
        </div>
      </div>
    </div>
  );
}

function ContactInfoValue({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b border-border/70 py-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-foreground">
        {value || 'Not provided'}
      </p>
    </div>
  );
}
