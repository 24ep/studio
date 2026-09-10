import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { sidebarConfigData } from './SidebarNavConfig';

function hrefToAppPagePath(href: string) {
  const pathname = href.split(/[?#]/, 1)[0] || '/';
  const segments = pathname.split('/').filter(Boolean);
  return resolve(process.cwd(), 'src', 'app', ...segments, 'page.tsx');
}

describe('sidebar route coverage', () => {
  it('points every local navigation item at an implemented Next.js page', () => {
    const missingRoutes = sidebarConfigData.flatMap(group =>
      group.items
        .map(item => item.href)
        .filter(href => href.startsWith('/'))
        .filter(href => !existsSync(hrefToAppPagePath(href))),
    );

    expect(missingRoutes, `Missing sidebar pages: ${missingRoutes.join(', ')}`).toEqual([]);
  });
});
