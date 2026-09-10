import { describe, expect, it } from 'vitest';

import { syncPopoverWrapperZIndex } from './popover-z-index-utils';

describe('syncPopoverWrapperZIndex', () => {
  it('keeps the Radix positioning wrapper on the same layer as the content', () => {
    const wrapper = { style: { zIndex: '1000' } } as HTMLElement;
    const content = {
      parentElement: {
        closest: () => wrapper,
      },
    } as unknown as HTMLElement;

    const cleanup = syncPopoverWrapperZIndex(content, 1800);

    expect(wrapper.style.zIndex).toBe('1800');

    cleanup();
    expect(wrapper.style.zIndex).toBe('1000');
  });

  it('does nothing when content is not inside a Radix positioning wrapper', () => {
    const content = { parentElement: null } as HTMLElement;

    expect(() => syncPopoverWrapperZIndex(content, 1800)()).not.toThrow();
  });
});
