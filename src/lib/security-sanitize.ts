import sanitizeHtmlLib from 'sanitize-html';

import type { SanitizedApiInput } from './security-types';

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  return sanitizeHtmlLib(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
  });
}

const SAFE_RICH_TEXT_STYLES: Record<string, Record<string, RegExp[]>> = {
  '*': {
    color: [/^(?:#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i],
    'background-color': [/^(?:#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+)$/i],
    'font-size': [/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/i],
    'font-weight': [/^(?:normal|bold|bolder|lighter|[1-9]00)$/i],
    'font-style': [/^(?:normal|italic|oblique)$/i],
    'font-family': [/^[\w\s'",.-]+$/],
    'text-align': [/^(?:left|right|center|justify|start|end)$/i],
    'text-decoration': [/^(?:none|underline|line-through|overline)(?:\s+(?:underline|line-through|overline))*$/i],
    'white-space': [/^(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)$/i],
  },
};

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
        'style', 'class', 'id', 'title', 'width', 'height', 'align', 'valign',
        'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing',
      ],
      a: ['href', 'name', 'target', 'rel', 'title', 'class', 'id', 'style'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class', 'id', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto', 'tel'],
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: false,
    allowedStyles: SAFE_RICH_TEXT_STYLES,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank'
          ? { ...attribs, rel: 'noopener noreferrer' }
          : attribs,
      }),
    },
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
