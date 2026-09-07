import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('shared desktop interaction density', () => {
  it('uses the production 36px / 13px control rhythm', () => {
    expect(read('src/components/ui/button.tsx')).toContain('text-[13px]');
    expect(read('src/components/ui/button.tsx')).toContain('default: "h-9');
    expect(read('src/components/ui/input.tsx')).toContain('h-9');
    expect(read('src/components/ui/input.tsx')).toContain('text-[13px]');
    expect(read('src/components/ui/select.tsx')).toContain('h-9');
    expect(read('src/components/ui/table.tsx')).toContain('caption-bottom text-[13px]');
  });
});
