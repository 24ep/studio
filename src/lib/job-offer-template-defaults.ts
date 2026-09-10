export const DEFAULT_OFFER_LETTER_SUBJECT = 'Offer Letter: {{jobTitle}}';

export const DEFAULT_OFFER_LETTER_TEMPLATE = `
  <p>Dear {{candidateName}},</p>
  <p>We are pleased to offer you the position of <strong>{{jobTitle}}</strong>.</p>
  <p>Compensation: <strong>{{salary}}</strong><br />Start date: <strong>{{startDate}}</strong></p>
  <p>Please review this offer and accept electronically using the secure link below.</p>
  <p><a href="{{acceptUrl}}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">Review and accept offer</a></p>
  <p>Sincerely,<br />{{companyName}}</p>
`.trim();
