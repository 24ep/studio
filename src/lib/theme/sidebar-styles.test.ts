import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applySidebarStyles,
  applySidebarStylesWithTheme,
  getCurrentSidebarColors,
} from './sidebar-styles';

function installSidebarDom(isDark = false) {
  const rootStyle = {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
  };
  const root = {
    style: rootStyle,
    classList: {
      contains: vi.fn((className: string) => className === 'dark' && isDark),
    },
  };
  const sidebarElement = { dataset: {}, style: {}, classList: {} };

  vi.stubGlobal('window', {});
  vi.stubGlobal('document', {
    documentElement: root,
    querySelector: vi.fn(() => sidebarElement),
  });
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  }));

  return { rootStyle, root, sidebarElement };
}

describe('sidebar styles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applies themed sidebar css variables and stores the latest colors', () => {
    const { rootStyle } = installSidebarDom();

    applySidebarStylesWithTheme({
      sidebarBgStartL: '210 20% 98%',
      sidebarTextL: '220 15% 15%',
      sidebarBgStartD: '220 20% 10%',
      buttonTextColorL: '0 0% 100%',
    }, false);

    expect(rootStyle.setProperty).toHaveBeenCalledWith('--sidebar-background-start-l', '210 20% 98%');
    expect(rootStyle.setProperty).toHaveBeenCalledWith('--sidebar-foreground-l', '220 15% 15%');
    expect(rootStyle.setProperty).toHaveBeenCalledWith('--button-text-color-l', 'hsl(0 0% 100%)');
    expect(rootStyle.setProperty).not.toHaveBeenCalledWith('--sidebar-background-start-d', '220 20% 10%');
    expect(getCurrentSidebarColors()).toMatchObject({ sidebarTextL: '220 15% 15%' });
  });

  it('applies full-gradient variables for sidebar and active items', () => {
    const { rootStyle } = installSidebarDom();
    const gradient = 'linear-gradient(90deg, #111111 0%, #ffffff 100%)';

    applySidebarStylesWithTheme({
      sidebarBgStartL: gradient,
      sidebarActiveBgStartL: gradient,
      sidebarTextL: '220 15% 15%',
    }, false);

    expect(rootStyle.setProperty).toHaveBeenCalledWith('--sidebar-background-full-gradient', gradient);
    expect(rootStyle.setProperty).toHaveBeenCalledWith('--sidebar-active-bg-full-gradient', gradient);
    expect(rootStyle.setProperty).toHaveBeenCalledWith('--sidebar-active-background-l', gradient);
    expect(rootStyle.setProperty).not.toHaveBeenCalledWith('--sidebar-background-start-l', gradient);
  });

  it('clears stale full-gradient overrides when switching to HSL colors', () => {
    const { rootStyle } = installSidebarDom();

    applySidebarStylesWithTheme({
      sidebarBgStartD: '220 20% 10%',
      sidebarActiveBgStartD: '220 70% 30%',
    }, true);

    expect(rootStyle.removeProperty).toHaveBeenCalledWith('--sidebar-background-full-gradient');
    expect(rootStyle.removeProperty).toHaveBeenCalledWith('--sidebar-active-bg-full-gradient');
    expect(rootStyle.removeProperty).toHaveBeenCalledWith('--sidebar-active-background-d');
  });

  it('detects the current theme when applying sidebar styles', () => {
    const { rootStyle } = installSidebarDom(true);

    applySidebarStyles({
      sidebarTextL: '220 15% 15%',
      sidebarTextD: '0 0% 90%',
    });

    expect(rootStyle.setProperty).toHaveBeenCalledWith('--sidebar-foreground-d', '0 0% 90%');
    expect(rootStyle.setProperty).not.toHaveBeenCalledWith('--sidebar-foreground-l', '220 15% 15%');
  });
});
