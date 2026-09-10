export const DEFAULT_INTERVIEW_INVITATION_SUBJECT = 'Interview Invitation: {{ApplicantName}} - {{positionTitle}}';

export const DEFAULT_INTERVIEW_INVITATION_TEMPLATE = `<div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Interview Invitation</h1>
  </div>

  <div style="padding: 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none;">
    <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear {{interviewerName}},</p>

    <p style="color: #334155; font-size: 16px; line-height: 1.6;">
      You have been invited to evaluate <strong>{{ApplicantName}}</strong> for the position of <strong>{{positionTitle}}</strong>.
    </p>

    <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
      <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 16px;">Interview Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 120px;">Date:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">{{interviewDate}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Time:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">{{interviewTime}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Location:</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">{{interviewLocation}}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{{evaluationLink}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);">
        Evaluate Applicant
      </a>
    </div>

    <div style="text-align: center; margin: 24px 0; padding: 20px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">Or scan this QR code:</p>
      <img src="{{qrCodeBase64}}" alt="QR Code" style="width: 150px; height: 150px; border-radius: 8px;" />
    </div>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">If the button doesn't work, copy this link:</p>
      <p style="color: #3B82F6; font-size: 12px; margin: 0; word-break: break-all;">{{evaluationLink}}</p>
    </div>
  </div>

  <div style="padding: 24px; text-align: center; background: #1e293b; border-radius: 0 0 8px 8px;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">Sent via Recruitment System</p>
  </div>
</div>`;
