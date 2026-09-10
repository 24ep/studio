import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ThreeStateCheckbox } from './checkbox';

describe('ThreeStateCheckbox', () => {
  it('exposes the indeterminate state to Radix and assistive technology', () => {
    const markup = renderToStaticMarkup(<ThreeStateCheckbox value="indeterminate" />);

    expect(markup).toContain('data-state="indeterminate"');
    expect(markup).toContain('aria-checked="mixed"');
  });

  it('keeps checked and unchecked states distinct', () => {
    const checkedMarkup = renderToStaticMarkup(<ThreeStateCheckbox value="checked" />);
    const uncheckedMarkup = renderToStaticMarkup(<ThreeStateCheckbox value="unchecked" />);

    expect(checkedMarkup).toContain('data-state="checked"');
    expect(uncheckedMarkup).toContain('data-state="unchecked"');
  });
});
