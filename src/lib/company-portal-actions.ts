import type {
  CompanyPortalBlock,
  CompanyPortalButtonAction,
  CompanyPortalCmsRecord,
  CompanyPortalItemClickAction,
} from './company-portal-builder';
import { resolveCompanyPortalLinkAnchor } from './company-portal-links';

export const COMPANY_PORTAL_BUTTON_ACTIONS: Array<{
  value: CompanyPortalButtonAction;
  label: string;
}> = [
  { value: 'document', label: 'Document' },
  { value: 'internal', label: 'Internal link' },
  { value: 'external', label: 'External website' },
  { value: 'section', label: 'Section on this page' },
  { value: 'email', label: 'Send an email' },
  { value: 'phone', label: 'Call a phone number' },
];

export const COMPANY_PORTAL_ITEM_CLICK_ACTIONS: Array<{
  value: CompanyPortalItemClickAction;
  label: string;
}> = [
  { value: 'none', label: 'No action' },
  { value: 'link', label: 'Open link from field' },
  ...COMPANY_PORTAL_BUTTON_ACTIONS,
];

export function getCompanyPortalActionField(action: CompanyPortalButtonAction) {
  switch (action) {
    case 'document':
      return { label: 'Document link', placeholder: '/policy-documents/employee-handbook' };
    case 'external':
      return { label: 'Website URL', placeholder: 'https://example.com' };
    case 'section':
      return { label: 'Section ID', placeholder: 'resources' };
    case 'email':
      return { label: 'Email address', placeholder: 'people@example.com' };
    case 'phone':
      return { label: 'Phone number', placeholder: '+66 2 123 4567' };
    default:
      return { label: 'Internal path', placeholder: '/policies' };
  }
}

export function resolveCompanyPortalButtonAction(
  block: Pick<CompanyPortalBlock, 'buttonAction' | 'buttonUrl'>,
) {
  const value = block.buttonUrl.trim();

  switch (block.buttonAction) {
    case 'external':
      return {
        href: /^https?:\/\//i.test(value) ? value : '#',
        opensNewTab: /^https?:\/\//i.test(value),
      };
    case 'section': {
      const section = value.replace(/^#/, '').trim();
      return { href: section ? `#${section}` : '#', opensNewTab: false };
    }
    case 'email': {
      const email = value.replace(/^mailto:/i, '').trim();
      return {
        href: email && !/\s/.test(email) ? `mailto:${email}` : '#',
        opensNewTab: false,
      };
    }
    case 'phone': {
      const phone = value.replace(/^tel:/i, '').replace(/[^\d+*#,;]/g, '');
      return { href: phone ? `tel:${phone}` : '#', opensNewTab: false };
    }
    default:
      if (value.startsWith('#')) {
        return { href: value, opensNewTab: false };
      }
      return {
        href: value.startsWith('/') && !value.startsWith('//')
          ? value
          : value
            ? `/${value.replace(/^\/+/, '')}`
            : '#',
        opensNewTab: false,
      };
  }
}

export function resolveCompanyPortalItemClickAction(
  block: Pick<CompanyPortalBlock, 'itemClickAction' | 'itemClickFieldKey'>,
  record: Pick<CompanyPortalCmsRecord, 'values'>,
) {
  const action = block.itemClickAction || 'none';
  const fieldKey = block.itemClickFieldKey || '';
  const value = String(record.values[fieldKey] || '').trim();
  if (action === 'none' || !fieldKey || !value) return null;

  if (action === 'link') {
    const resolved = resolveCompanyPortalLinkAnchor(value);
    return resolved.href === '#' && value !== '#' ? null : resolved;
  }

  const resolved = resolveCompanyPortalButtonAction({
    buttonAction: action,
    buttonUrl: value,
  });
  return resolved.href === '#' && value !== '#' ? null : resolved;
}
