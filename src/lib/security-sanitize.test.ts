import { describe, expect, it } from 'vitest';

import { sanitizeRichHtml } from './security-sanitize';

describe('sanitizeRichHtml', () => {
  it('removes executable URL schemes and inline event handlers', () => {
    const output = sanitizeRichHtml(
      '<a href="javascript:alert(1)" onclick="alert(2)">open</a><img src="javascript:alert(3)" onerror="alert(4)">',
    );

    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('onerror');
  });

  it('rejects protocol-relative links and data HTML while keeping safe links and data images', () => {
    const output = sanitizeRichHtml([
      '<a href="//evil.example/path">unsafe</a>',
      '<a href="https://example.com/path">safe</a>',
      '<a href="mailto:hr@example.com">mail</a>',
      '<a href="data:text/html;base64,PHNjcmlwdD4=">data</a>',
      '<img src="data:image/png;base64,AAAA" alt="preview">',
    ].join(''));

    expect(output).not.toContain('//evil.example/path');
    expect(output).not.toContain('data:text/html');
    expect(output).toContain('https://example.com/path');
    expect(output).toContain('mailto:hr@example.com');
    expect(output).toContain('data:image/png;base64,AAAA');
  });

  it('adds noopener protection to links that open a new tab', () => {
    const output = sanitizeRichHtml('<a href="https://example.com" target="_blank">safe</a>');

    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('keeps safe formatting while dropping URL-bearing CSS properties', () => {
    const output = sanitizeRichHtml(
      '<p style="color:#123456;background-image:url(https://evil.example/a.png);text-align:center">Hello</p>',
    );

    expect(output).toContain('color:#123456');
    expect(output).toContain('text-align:center');
    expect(output).not.toContain('background-image');
    expect(output).not.toContain('evil.example');
  });
});
