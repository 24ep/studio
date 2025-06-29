export function setThemeAndColors({
  themePreference,
  primaryGradientStart,
  primaryGradientEnd,
  sidebarColors = {},
}: {
  themePreference: 'light' | 'dark' | 'system',
  primaryGradientStart?: string,
  primaryGradientEnd?: string,
  sidebarColors?: Record<string, string>,
}) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  // Set theme class
  if (themePreference === 'dark') {
    root.classList.add('dark');
  } else if (themePreference === 'light') {
    root.classList.remove('dark');
  } else if (themePreference === 'system') {
    // Follow OS
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }

  // Set primary color CSS variables
  if (primaryGradientStart) {
    root.style.setProperty('--primary-gradient-start-l', primaryGradientStart);
    root.style.setProperty('--primary-gradient-start-d', primaryGradientStart);
    root.style.setProperty('--primary', `hsl(${primaryGradientStart})`);
  }
  if (primaryGradientEnd) {
    root.style.setProperty('--primary-gradient-end-l', primaryGradientEnd);
    root.style.setProperty('--primary-gradient-end-d', primaryGradientEnd);
  }

  // Set sidebar color variables
  Object.entries(sidebarColors).forEach(([key, value]) => {
    // Map settings keys to Tailwind CSS variable names
    const cssVarMapping: Record<string, string> = {
      // Light theme
      'sidebarBgStartL': '--sidebar-background',
      'sidebarTextL': '--sidebar-foreground',
      'sidebarBorderL': '--sidebar-border',
      'sidebarActiveBgStartL': '--sidebar-primary',
      'sidebarActiveTextL': '--sidebar-primary-foreground',
      'sidebarHoverBgL': '--sidebar-accent',
      'sidebarHoverTextL': '--sidebar-accent-foreground',
      
      // Dark theme
      'sidebarBgStartD': '--sidebar-background',
      'sidebarTextD': '--sidebar-foreground',
      'sidebarBorderD': '--sidebar-border',
      'sidebarActiveBgStartD': '--sidebar-primary',
      'sidebarActiveTextD': '--sidebar-primary-foreground',
      'sidebarHoverBgD': '--sidebar-accent',
      'sidebarHoverTextD': '--sidebar-accent-foreground',
    };

    const cssVarName = cssVarMapping[key];
    if (cssVarName) {
      root.style.setProperty(cssVarName, value);
    }
  });
} 