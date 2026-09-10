import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Hrive desktop shell visual contract', () => {
  it('renders primary navigation and header chrome with semantic theme tokens', () => {
    const header = source('src/components/layout/Header.tsx');
    const primaryItem = source('src/components/layout/HeaderMegaMenuCategory.tsx');

    expect(header).toContain('bg-transparent');
    expect(header).toContain('border-border/70');
    expect(header).toContain('text-foreground');
    expect(header).not.toContain('border-slate-200/80');
    expect(header).not.toContain('dark:border-zinc-800');
    expect(primaryItem).toContain('text-muted-foreground');
    expect(primaryItem).toContain('after:bg-primary');
    expect(primaryItem).toContain('bg-popover');
    expect(primaryItem).not.toContain('dark:bg-zinc-950');
  });

  it('renders contextual secondary navigation inside the body canvas with semantic colors', () => {
    const header = source('src/components/layout/Header.tsx');
    const secondary = source('src/components/layout/HeaderSecondaryNavigation.tsx');
    const shell = source('src/components/layout/AppLayoutShell.tsx');

    expect(header).not.toContain('<HeaderSecondaryNavigation');
    expect(secondary).toContain('border-b border-border/70');
    expect(secondary).toContain('text-muted-foreground');
    expect(secondary).toContain('after:bg-primary');
    expect(secondary).not.toContain('dark:text-zinc-300');

    const canvasIndex = shell.indexOf('<section className=');
    const secondaryIndex = shell.indexOf('<HeaderSecondaryNavigation');
    const childrenIndex = shell.indexOf('{children}');

    expect(canvasIndex).toBeGreaterThanOrEqual(0);
    expect(secondaryIndex).toBeGreaterThan(canvasIndex);
    expect(secondaryIndex).toBeLessThan(childrenIndex);
  });

  it('fills the available page height with a borderless token-driven body canvas', () => {
    const shell = source('src/components/layout/AppLayoutShell.tsx');

    expect(shell).toContain('hsl(var(--primary) / 0.10)');
    expect(shell).toContain('hsl(var(--app-page-background, var(--background)))');
    expect(shell).toContain('h-full min-h-0 w-full min-w-0');
    expect(shell).toContain('overflow-hidden bg-background');
    expect(shell).toContain('lg:bg-background/95');
    expect(shell).toContain('flex h-full min-h-0 w-full min-w-0 flex-col');
    expect(shell).toContain('min-h-0 flex-1');
    expect(shell).toContain('lg:rounded-[24px]');
    expect(shell).not.toContain('lg:border ');
    expect(shell).not.toContain('lg:bg-white/95');
    expect(shell).not.toContain('dark:lg:bg-zinc-950/95');
  });

  it('uses semantic utility controls with one divider between Talk with HR and Outborn Apps', () => {
    const search = source('src/components/layout/HeaderExpandableSearch.tsx');
    const userMenu = source('src/components/layout/HeaderDesktopUserMenuAccount.tsx');
    const actions = source('src/components/layout/HeaderActionsSection.tsx');
    const launcher = source('src/components/layout/HeaderOutbornApplicationLauncher.tsx');

    expect(search).toContain('text-muted-foreground');
    expect(search).toContain('bg-popover');
    expect(actions).toContain('[&_button]:!h-10');
    expect(actions).toContain('[&_button]:!text-muted-foreground');
    expect(actions).toContain('[&_button]:hover:!bg-accent');
    expect(actions).toContain('mx-1 h-5 w-px shrink-0 bg-border');
    expect(userMenu).toContain('text-foreground');
    expect(launcher).toContain('hover:bg-accent');
    expect(launcher).toContain('border-border');

    const helpIndex = actions.indexOf('<HrHelpWidget');
    const dividerIndex = actions.indexOf('mx-1 h-5 w-px shrink-0 bg-border');
    const appsIndex = actions.indexOf('<HeaderOutbornApplicationLauncher');
    const notificationIndex = actions.indexOf('<NotificationIcon');
    const userIndex = actions.indexOf('<HeaderDesktopUserMenu');

    expect(helpIndex).toBeGreaterThanOrEqual(0);
    expect(dividerIndex).toBeGreaterThan(helpIndex);
    expect(appsIndex).toBeGreaterThan(dividerIndex);
    expect(notificationIndex).toBeGreaterThan(appsIndex);
    expect(userIndex).toBeGreaterThan(notificationIndex);
  });

  it('routes desktop and mobile Light Dark System choices through the persisted user theme hook', () => {
    const header = source('src/components/layout/Header.tsx');
    const desktopAppearance = source('src/components/layout/HeaderDesktopUserMenuAppearance.tsx');
    const mobileAppearance = source('src/components/layout/HeaderMobileUserDrawerActions.tsx');

    expect(header).toContain('currentTheme, themePreference, setTheme');
    expect(header).toContain('onThemeChange: setTheme');
    expect(desktopAppearance).toContain('onThemeChange');
    expect(desktopAppearance).toContain('value={themePreference}');
    expect(desktopAppearance).not.toContain('setThemeAndColors');
    expect(mobileAppearance).toContain('themePreference={themePreference}');
    expect(mobileAppearance).toContain('onThemeChange(themeOption.id)');
    expect(mobileAppearance).not.toContain('setThemeAndColors');
  });
});