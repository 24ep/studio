import { ExclamationCircleIcon as AlertCircle } from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { sanitizeRichHtml } from '@/lib/security';

interface SendInterviewInvitationPreviewStepProps {
  emailSubject: string;
  emailBody: string;
  selectedInterviewerCount: number;
}

export function SendInterviewInvitationPreviewStep({
  emailSubject,
  emailBody,
  selectedInterviewerCount,
}: SendInterviewInvitationPreviewStepProps) {
  return (
    <div className="space-y-6 py-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please review the email content below. Use the Back button to make changes.
        </AlertDescription>
      </Alert>

      <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Subject</Label>
          <div className="font-medium border-b pb-2">{emailSubject}</div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Message Body</Label>
          <div className="bg-background border rounded-lg p-4 overflow-auto max-h-[400px]">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(emailBody) }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        This email will be sent to {selectedInterviewerCount} selected interviewer(s).
      </p>
    </div>
  );
}
