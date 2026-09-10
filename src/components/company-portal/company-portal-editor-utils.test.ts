import { describe, expect, it } from 'vitest';

import { insertItemAt, moveItemToInsertionIndex } from './company-portal-editor-utils';

describe('company portal editor ordering', () => {
  it('inserts a library component at the requested canvas boundary', () => {
    expect(insertItemAt(['hero', 'text'], 'image', 1)).toEqual([
      'hero',
      'image',
      'text',
    ]);
  });

  it('moves an existing component down without an off-by-one shift', () => {
    expect(moveItemToInsertionIndex(['a', 'b', 'c'], 0, 3)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('moves an existing component up to the first boundary', () => {
    expect(moveItemToInsertionIndex(['a', 'b', 'c'], 2, 0)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});
