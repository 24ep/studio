import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  path.join(process.cwd(), 'src/app/settings/system-settings/use-system-settings-page.ts'),
  'utf8',
);

describe('system settings runtime refresh contract', () => {
  it('refreshes global runtime settings after every successful save, not only branding saves', () => {
    expect(source).toMatch(
      /if \(appConfigChange\.changed\) \{[\s\S]*?faviconUpdated[\s\S]*?\n  \}[\s\S]*?window\.dispatchEvent\(new CustomEvent\('globalSettingsChanged'\)\)/,
    );
  });
});
