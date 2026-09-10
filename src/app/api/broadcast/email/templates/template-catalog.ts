export type BroadcastEmailTemplate = {
  name: string;
  code: string;
  subject: string;
  html: string;
  description: string;
  category: string;
  variables: string[];
  sortOrder: number;
};

export function parseTemplateCatalog(value: string | null): BroadcastEmailTemplate[] {
  return getActiveEmailTemplateVersions(value)
    .map((item, index) => ({
      name: item.name,
      code: item.code,
      subject: item.subject,
      html: item.html,
      description: item.description,
      category: item.category,
      variables: item.variables,
      sortOrder: index,
    }));
}
import { getActiveEmailTemplateVersions } from '@/lib/email-template-catalog';
