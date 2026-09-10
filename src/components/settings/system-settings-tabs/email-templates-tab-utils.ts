export const DEFAULT_INTERVIEW_INVITATION_SUBJECT = 'Interview Invitation: {{ApplicantName}} - {{positionTitle}}';

export const DEFAULT_INTERVIEW_INVITATION_TEMPLATE = `<div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333; margin-bottom: 20px;">Interview Invitation</h2>
  
  <p>Dear {{interviewerName}},</p>
  
  <p>You have been assigned to conduct an interview with <strong>{{ApplicantName}}</strong> for the <strong>{{positionTitle}}</strong> position.</p>
  
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Date:</strong> {{interviewDate}}</p>
    <p style="margin: 5px 0;"><strong>Time:</strong> {{interviewTime}}</p>
    <p style="margin: 5px 0;"><strong>Location:</strong> {{interviewLocation}}</p>
  </div>
  
  <p>Please review the Applicant's profile and prepare your evaluation questions accordingly.</p>
  
  <!-- Evaluation Access Section -->
  <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Evaluation Access</h3>
    
    <!-- Button -->
    <a href="{{evaluationLink}}" style="display: inline-block; padding: 14px 32px; background: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 20px;">
      Open Evaluation Form
    </a>
    
    <p style="margin: 15px 0 10px 0; color: #666; font-size: 14px;">Or scan this QR code with your mobile device:</p>
    
    <!-- QR Code -->
    {{evaluationQrcodeImage}}
  </div>
  
  <p style="margin-top: 30px;">Best regards,<br/>Recruitment Team</p>
</div>`;

export const ICS_DESCRIPTION_PLACEHOLDER =
  'Interview with {{ApplicantName}} for position {{positionTitle}}.\n\nLocation: {{interviewLocation}}\nInterviewer: {{interviewerName}}';

export const TEMPLATE_VARIABLES = [
  { token: 'ApplicantName', description: "Applicant's full name" },
  { token: 'positionTitle', description: 'Job position title' },
  { token: 'interviewDate', description: 'Formatted interview date' },
  { token: 'interviewTime', description: 'Formatted interview time' },
  { token: 'interviewLocation', description: 'Interview location' },
  { token: 'evaluationLink', description: 'Link to Applicant evaluation' },
  { token: 'interviewerName', description: "Interviewer's name" }
];

export function buildTemplateVariablesSummary(): string {
  return TEMPLATE_VARIABLES.map(({ token }) => `{{${token}}}`).join(', ');
}
