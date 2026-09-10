export type DocumentTemplateStatus = 'active' | 'draft';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  status: DocumentTemplateStatus;
  isConfidential: boolean;
  employeeCanDownload: boolean;
  updatedAt: string;
}

export interface DocumentAttribute {
  key: string;
  label: string;
  example: string;
  group: 'Employee' | 'Employment' | 'Company' | 'Document';
}

const SEEDED_DOCUMENT_TEMPLATE_AT = '2026-08-01T00:00:00.000Z';

export const DOCUMENT_ATTRIBUTES: DocumentAttribute[] = [
  { key: 'employee.full_name', label: 'Employee full name', example: 'Maya Chen', group: 'Employee' },
  { key: 'employee.first_name', label: 'First name', example: 'Maya', group: 'Employee' },
  { key: 'employee.employee_id', label: 'Employee ID', example: 'EMP-1042', group: 'Employee' },
  { key: 'employee.email', label: 'Work email', example: 'maya@company.com', group: 'Employee' },
  { key: 'employee.phone', label: 'Phone number', example: '+66 81 234 5678', group: 'Employee' },
  { key: 'employee.address', label: 'Home address', example: 'Bangkok, Thailand', group: 'Employee' },
  { key: 'employment.job_title', label: 'Job title', example: 'Product Designer', group: 'Employment' },
  { key: 'employment.department', label: 'Department', example: 'Product', group: 'Employment' },
  { key: 'employment.manager_name', label: 'Manager name', example: 'Narin W.', group: 'Employment' },
  { key: 'employment.start_date', label: 'Start date', example: '1 August 2026', group: 'Employment' },
  { key: 'employment.salary', label: 'Salary', example: 'THB 75,000', group: 'Employment' },
  { key: 'employment.employment_type', label: 'Employment type', example: 'Full-time', group: 'Employment' },
  { key: 'company.name', label: 'Company name', example: 'Alpha Yard Co., Ltd.', group: 'Company' },
  { key: 'company.legal_name', label: 'Legal company name', example: 'Alpha Yard (Thailand) Co., Ltd.', group: 'Company' },
  { key: 'company.address', label: 'Company address', example: 'Bangkok, Thailand', group: 'Company' },
  { key: 'company.logo', label: 'Company logo', example: 'Company logo image', group: 'Company' },
  { key: 'company.tax_id', label: 'Tax ID', example: '0105567890123', group: 'Company' },
  { key: 'company.hr_contact', label: 'HR contact', example: 'People Operations', group: 'Company' },
  { key: 'document.generated_date', label: 'Generated date', example: '31 July 2026', group: 'Document' },
  { key: 'document.reference_number', label: 'Reference number', example: 'DOC-2026-0042', group: 'Document' },
];

export function createSeededDocumentTemplates(): DocumentTemplate[] {
  return [
    {
      id: 'seed-corporate-document-template',
      name: 'Corporate Employment Letter',
      description: 'Common corporate document format used for employment communication.',
      category: 'Employment',
      content: buildCorporateDocumentTemplate(),
      status: 'active',
      isConfidential: false,
      employeeCanDownload: true,
      updatedAt: SEEDED_DOCUMENT_TEMPLATE_AT,
    },
  ];
}

export function parseDocumentTemplates(value: unknown): DocumentTemplate[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(template => ({
      ...template,
      // Preserve compatibility with templates saved before this setting existed.
      isConfidential: template?.isConfidential === true,
      employeeCanDownload: template?.employeeCanDownload !== false,
    })) as DocumentTemplate[];
  } catch {
    return [];
  }
}

function buildCorporateDocumentTemplate() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:'DM Sans',sans-serif;color:#111827;">
  <div style="padding:20px 12px;">
    <table role="presentation" width="700" cellspacing="0" cellpadding="0" style="max-width:700px;width:100%;margin:0 auto;background:#ffffff;border:1px solid #d1d5db;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="background:#0f172a;color:#ffffff;padding:16px 20px;">
          <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:50%;font-size:16px;font-weight:700;">{{company.name}}</td>
              <td style="width:50%;text-align:right;font-size:12px;">Ref: {{document.reference_number}} &nbsp;&nbsp;|&nbsp;&nbsp; {{document.generated_date}}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <h2 style="margin:0 0 10px 0;font-size:24px;color:#0f172a;">{{company.name}}</h2>
          <p style="margin:0 0 12px 0;">Dear {{employee.full_name}},</p>
          <p style="margin:0 0 10px 0;">We are pleased to share this document for {{employment.job_title}} in {{employment.department}}.</p>
          <p style="margin:0 0 10px 0;">Employee: {{employee.full_name}} ({{employee.employee_id}})</p>
          <p style="margin:0 0 10px 0;">Manager: {{employment.manager_name}}</p>
          <p style="margin:0 0 10px 0;">Issued by: {{company.legal_name}}</p>
          <p style="margin:0 0 10px 0;">Start date: {{employment.start_date}}</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:12px 20px;">
          <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:50%;font-size:11px;color:#4b5563;">{{company.legal_name}} | Tax ID: {{company.tax_id}}</td>
              <td style="width:50%;font-size:11px;color:#4b5563;text-align:right;">For internal use only | {{company.address}}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
