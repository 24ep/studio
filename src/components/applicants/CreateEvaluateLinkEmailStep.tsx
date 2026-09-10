import { ArrowPathIcon as Loader2, CodeBracketIcon as Code } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';
import { sanitizeRichHtml } from '@/lib/security';

interface CreateEvaluateLinkEmailStepProps {
  loadingTemplate: boolean;
  emailSubject: string;
  emailBody: string;
  systemEditorMode: 'wysiwyg' | 'html';
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
}

export function CreateEvaluateLinkEmailStep({
  loadingTemplate,
  emailSubject,
  emailBody,
  systemEditorMode,
  onEmailSubjectChange,
  onEmailBodyChange,
}: CreateEvaluateLinkEmailStepProps) {
  const isHtmlMode = systemEditorMode === 'html';

  return (
    <div className="space-y-4 py-4">
      {loadingTemplate ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Email Subject</Label>
            <Input
              value={emailSubject}
              onChange={(event) => onEmailSubjectChange(event.target.value)}
              placeholder="Interview Invitation: {{ApplicantName}}"
              disabled={isHtmlMode}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Email Body {isHtmlMode ? '(Preview)' : ''}</Label>
            </div>
            <div className="border rounded-lg">
              {isHtmlMode ? (
                <div className="relative">
                  <div
                    className="w-full min-h-[300px] max-h-[500px] overflow-auto p-4 bg-white rounded-lg prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(emailBody) }}
                  />
                  <div className="absolute top-2 right-2 bg-muted/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-muted-foreground flex items-center">
                    <Code className="h-3 w-3 mr-1" />
                    Read Only HTML View
                  </div>
                </div>
              ) : (
                <TiptapEditor
                  value={emailBody}
                  onChange={onEmailBodyChange}
                  placeholder="Enter email content..."
                  className="min-h-[300px]"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isHtmlMode
                ? 'System is configured to use a fixed HTML template. Content cannot be edited.'
                : 'WYSIWYG mode - format visually using the editor toolbar.'
              } Variables: {`{{ApplicantName}}, {{positionTitle}}, {{interviewDate}}, {{interviewTime}}, {{interviewLocation}}, {{evaluationLink}}, {{qrCodeBase64}}, {{interviewerName}}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
