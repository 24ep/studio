import type { SidebarStyleConfig } from '@/hooks/use-sidebar-preferences';

export function updateSidebarCSSVariables(config: SidebarStyleConfig) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Update custom CSS variables based on user preferences
  if (config.primaryColor) {
    root.style.setProperty('--sidebar-custom-primary', config.primaryColor);
  }
  
  if (config.secondaryColor) {
    root.style.setProperty('--sidebar-custom-secondary', config.secondaryColor);
  }
  
  if (config.textColor) {
    root.style.setProperty('--sidebar-custom-text', config.textColor);
  }

  // Update shadow based on intensity
  if (config.shadowIntensity) {
    const shadowMap = {
      none: 'none',
      subtle: '0 1px 3px rgba(0, 0, 0, 0.1)',
      medium: '0 4px 6px rgba(0, 0, 0, 0.15)',
      strong: '0 8px 15px rgba(0, 0, 0, 0.2)'
    };
    root.style.setProperty('--sidebar-custom-shadow', shadowMap[config.shadowIntensity]);
  }
}

export function getSidebarStyleClasses(config: SidebarStyleConfig): string[] {
  const classes: string[] = [];
  
  // Add style class
  if (config.style !== 'default') {
    classes.push(`sidebar-style-${config.style}`);
  }
  
  // Add shadow class
  if (config.shadowIntensity && config.shadowIntensity !== 'none') {
    classes.push(`sidebar-shadow-${config.shadowIntensity}`);
  }
  
  return classes;
}

export function applySidebarStylesToElement(
  element: HTMLElement, 
  config: SidebarStyleConfig, 
  isActive: boolean
) {
  if (!isActive || config.style === 'default') {
    // Remove any custom style classes
    element.classList.remove(
      'sidebar-style-gradient',
      'sidebar-style-solid', 
      'sidebar-style-outline',
      'sidebar-style-minimal',
      'sidebar-shadow-none',
      'sidebar-shadow-subtle',
      'sidebar-shadow-medium',
      'sidebar-shadow-strong'
    );
    return;
  }

  // Apply style classes
  const styleClasses = getSidebarStyleClasses(config);
  element.classList.add(...styleClasses);
} 