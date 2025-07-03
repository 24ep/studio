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

// Theme utility functions for managing sidebar styling preferences

export type SidebarActiveStyle = "gradient" | "solid" | "outline" | "subtle";

const SIDEBAR_ACTIVE_STYLE_KEY = 'sidebarActiveStylePreference';

export function getSidebarActiveStyle(): SidebarActiveStyle {
  if (typeof window === 'undefined') return 'gradient';
  return (localStorage.getItem(SIDEBAR_ACTIVE_STYLE_KEY) as SidebarActiveStyle) || 'gradient';
}

export function setSidebarActiveStyle(style: SidebarActiveStyle) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SIDEBAR_ACTIVE_STYLE_KEY, style);
  applySidebarActiveStyle(style);
}

export function applySidebarActiveStyle(style: SidebarActiveStyle) {
  if (typeof window === 'undefined') return;
  
  console.log('applySidebarActiveStyle: Applying style', style);
  
  // Remove existing style classes
  document.documentElement.classList.remove(
    'sidebar-active-gradient',
    'sidebar-active-solid', 
    'sidebar-active-outline',
    'sidebar-active-subtle'
  );
  
  // Add new style class
  document.documentElement.classList.add(`sidebar-active-${style}`);
  
  console.log('applySidebarActiveStyle: Applied class', `sidebar-active-${style}`);
  console.log('applySidebarActiveStyle: Current classes', document.documentElement.classList.toString());
}

// Initialize sidebar style on load
export function initializeSidebarStyle() {
  if (typeof window === 'undefined') return;
  const style = getSidebarActiveStyle();
  console.log('initializeSidebarStyle: Initializing with style', style);
  applySidebarActiveStyle(style);
}

// Listen for preference changes
export function setupSidebarStyleListener() {
  if (typeof window === 'undefined') return;
  
  console.log('setupSidebarStyleListener: Setting up listener');
  
  window.addEventListener('appConfigChanged', (event: any) => {
    console.log('setupSidebarStyleListener: Received appConfigChanged event', event.detail);
    if (event.detail?.sidebarActiveStyle) {
      applySidebarActiveStyle(event.detail.sidebarActiveStyle);
    }
  });
} 