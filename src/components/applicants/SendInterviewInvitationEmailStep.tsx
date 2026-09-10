import { CodeBracketIcon as Code, LanguageIcon as Type, ArrowPathIcon as Loader2 } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';

interface SendInterviewInvitationEmailStepProps {
  loadingTemplate: boolean;
  emailSubject: string;
  emailBody: string;
  emailEditorMode: 'wysiwyg' | 'html';
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
  onEmailEditorModeChange: (mode: 'wysiwyg' | 'html') => void;
}

export function SendInterviewInvitationEmailStep({
  loadingTemplate,
  emailSubject,
  emailBody,
  emailEditorMode,
  onEmailSubjectChange,
  onEmailBodyChange,
  onEmailEditorModeChange,
}: SendInterviewInvitationEmailStepProps) {
  if (loadingTemplate) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading email template...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="email-subject">Email Subject *</Label>
        <Input
          id="email-subject"
          value={emailSubject}
          onChange={(event) => onEmailSubjectChange(event.target.value)}
          placeholder="Interview Invitation: {{ApplicantName}} - {{positionTitle}}"
        />
        <p className="text-xs text-muted-foreground">
          Available variables: {'{'}ApplicantName{'}'}, {'{'}positionTitle{'}'}, {'{'}interviewDate{'}'}, {'{'}interviewTime{'}'}, {'{'}interviewLocation{'}'}, {'{'}evaluationLink{'}'}, {'{'}interviewerName{'}'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-body">Email Body (HTML) *</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={emailEditorMode === 'wysiwyg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onEmailEditorModeChange('wysiwyg')}
            >
              <Type className="h-3 w-3 mr-1" />
              WYSIWYG
            </Button>
            <Button
              type="button"
              variant={emailEditorMode === 'html' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onEmailEditorModeChange('html')}
            >
              <Code className="h-3 w-3 mr-1" />
              HTML
            </Button>
          </div>
        </div>
        <div className="border rounded-lg">
          {emailEditorMode === 'wysiwyg' ? (
            <TiptapEditor
              value={emailBody}
              onChange={onEmailBodyChange}
              placeholder="Enter email content..."
              className="min-h-[400px]"
            />
          ) : (
            <textarea
              className="w-full min-h-[400px] p-3 font-mono text-sm bg-background rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary"
              value={emailBody}
              onChange={(event) => onEmailBodyChange(event.target.value)}
              placeholder="Enter full HTML email template here with inline styles..."
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {emailEditorMode === 'html'
            ? 'Raw HTML mode - your HTML code with inline styles will be sent as-is.'
            : 'WYSIWYG mode - format visually. Switch to HTML mode for full control over styles.'
          } Variables: {'{'}ApplicantName{'}'}, {'{'}positionTitle{'}'}, {'{'}interviewDate{'}'}, {'{'}interviewTime{'}'}, {'{'}interviewLocation{'}'}, {'{'}evaluationLink{'}'}, {'{'}evaluationQrcodeImage{'}'}, {'{'}interviewerName{'}'}
        </p>
      </div>
    </div>
  );
}
