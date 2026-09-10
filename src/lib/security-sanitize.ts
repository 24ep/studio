import sanitizeHtmlLib from 'sanitize-html';

import type { SanitizedApiInput } from './security-types';

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  return sanitizeHtmlLib(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
  });
}

export function sanitizeRichHtml(input: string): string {
  if (typeof input !== 'string') return '';

  return sanitizeHtmlLib(input, {
    allowedTags: [
      'div', 'span', 'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li',
      'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'pre', 'code',
    ],
    allowedAttributes: {
      '*': [
        'style', 'class', 'id', 'href', 'target', 'src', 'alt', 'title',
        'width', 'height', 'align', 'valign', 'colspan', 'rowspan',
        'border', 'cellpadding', 'cellspacing',
      ],
      a: ['href', 'name', 'target'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'tel', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: true,
  });
}

export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizePath(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/[<>:"|?*]/g, '')
    .trim();
}

export function sanitizeApiInput(input: unknown): SanitizedApiInput {
  if (typeof input === 'string') {
    return sanitizeText(input);
  }

  if (input === null || input === undefined || typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeApiInput(item));
  }

  if (typeof input === 'object') {
    const sanitized: { [key: string]: SanitizedApiInput } = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeText(key)] = sanitizeApiInput(value);
    }
    return sanitized;
  }

  return undefined;
}
