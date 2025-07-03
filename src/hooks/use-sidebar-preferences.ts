import { useState, useEffect, type CSSProperties } from 'react';

export type SidebarStylePreference = "default" | "gradient" | "solid" | "outline" | "minimal";

export interface SidebarStyleConfig {
  style: SidebarStylePreference;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  shadowIntensity?: "none" | "subtle" | "medium" | "strong";
}

const SIDEBAR_STYLE_KEY = 'sidebarStylePreference';

const defaultSidebarStyle: SidebarStyleConfig = {
  style: 'default',
  shadowIntensity: 'subtle'
};

export function useSidebarPreferences() {
  const [sidebarStyle, setSidebarStyle] = useState<SidebarStyleConfig>(defaultSidebarStyle);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    if (typeof window !== 'undefined') {
      const storedSidebarStyle = localStorage.getItem(SIDEBAR_STYLE_KEY);
      if (storedSidebarStyle) {
        try {
          const parsed = JSON.parse(storedSidebarStyle);
          setSidebarStyle({ ...defaultSidebarStyle, ...parsed });
        } catch (error) {
          console.error('Error parsing sidebar style preferences:', error);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const updateSidebarStyle = (newStyle: Partial<SidebarStyleConfig>) => {
    const updatedStyle = { ...sidebarStyle, ...newStyle };
    setSidebarStyle(updatedStyle);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_STYLE_KEY, JSON.stringify(updatedStyle));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('sidebarStyleChanged', { 
        detail: { sidebarStyle: updatedStyle } 
      }));
    }
  };

  const getActiveMenuStyles = () => {
    const styles: CSSProperties = {};
    
    switch (sidebarStyle.style) {
      case 'default':
        // Use default CSS variables - no inline styles needed
        break;
        
      case 'gradient':
        if (sidebarStyle.primaryColor && sidebarStyle.secondaryColor) {
          styles.backgroundImage = `linear-gradient(to right, ${sidebarStyle.primaryColor}, ${sidebarStyle.secondaryColor})`;
        }
        break;
        
      case 'solid':
        if (sidebarStyle.primaryColor) {
          styles.backgroundColor = sidebarStyle.primaryColor;
        }
        break;
        
      case 'outline':
        if (sidebarStyle.primaryColor) {
          styles.border = `2px solid ${sidebarStyle.primaryColor}`;
          styles.backgroundColor = 'transparent';
        }
        break;
        
      case 'minimal':
        styles.backgroundColor = 'transparent';
        styles.border = 'none';
        break;
    }

    // Apply text color
    if (sidebarStyle.textColor) {
      styles.color = sidebarStyle.textColor;
    }

    // Apply shadow based on intensity
    if (sidebarStyle.shadowIntensity && sidebarStyle.shadowIntensity !== 'none') {
      const shadowMap: Record<string, string> = {
        subtle: '0 1px 3px rgba(0, 0, 0, 0.1)',
        medium: '0 4px 6px rgba(0, 0, 0, 0.15)',
        strong: '0 8px 15px rgba(0, 0, 0, 0.2)'
      };
      styles.boxShadow = shadowMap[sidebarStyle.shadowIntensity];
    }

    return styles;
  };

  return {
    sidebarStyle,
    updateSidebarStyle,
    getActiveMenuStyles,
    isLoaded
  };
} 