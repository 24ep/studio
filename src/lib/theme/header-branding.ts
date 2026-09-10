/**
 * Header Branding
 * Functions for managing header branding settings and styles
 */

import { addCacheBuster } from '../imageUtils';
import { updateThemeSystemSettingsCache } from './system-settings-cache';

/**
 * Apply header branding settings
 */
export function applyHeaderBrandingSettings(settings: {
  headerBackgroundType?: string;
  headerBackgroundColor?: string;
  headerBackgroundGradient?: string;
  headerBackgroundImageUrl?: string;
  headerTextColor?: string;
}) {
  if (typeof window === 'undefined') return;
  
  // Store settings in localStorage for persistence
  if (settings.headerBackgroundType) localStorage.setItem('headerBackgroundType', settings.headerBackgroundType);
  if (settings.headerBackgroundColor) localStorage.setItem('headerBackgroundColor', settings.headerBackgroundColor);
  if (settings.headerBackgroundGradient) localStorage.setItem('headerBackgroundGradient', settings.headerBackgroundGradient);
  if (settings.headerBackgroundImageUrl !== undefined) localStorage.setItem('headerBackgroundImageUrl', settings.headerBackgroundImageUrl || '');
  if (settings.headerTextColor) localStorage.setItem('headerTextColor', settings.headerTextColor);
  
  // Update system settings if they exist
  updateThemeSystemSettingsCache(settings);

  // Apply to CSS
  applyHeaderBrandingToCSS();
}

/**
 * Apply header branding settings to CSS variables
 */
export function applyHeaderBrandingToCSS() {
  if (typeof window === 'undefined') return;
  
  try {
    const root = document.documentElement;
    
    const type = localStorage.getItem('headerBackgroundType') || 'solid';
    const color = localStorage.getItem('headerBackgroundColor') || '0 0% 100%';
    const gradient = localStorage.getItem('headerBackgroundGradient') || '';
    const imageUrl = localStorage.getItem('headerBackgroundImageUrl') || '';
    const textColor = localStorage.getItem('headerTextColor') || '240 10% 3.9%';

    // Set text color variable
    root.style.setProperty('--header-foreground', `hsl(${textColor})`);

    root.style.removeProperty('--header-background-image');

    // Set background variables
    let background = 'white';
    let surface = 'hsl(0 0% 100% / 0.78)';
    let backgroundImage = 'none';
    
    switch (type) {
      case 'solid':
        background = `hsl(${color})`;
        surface = `hsl(${color} / 0.78)`;
        break;
      case 'gradient':
        if (gradient) {
          background = gradient;
          backgroundImage = gradient;
        } else {
          background = 'linear-gradient(135deg, hsl(179 67% 66%) 0%, hsl(238 74% 61%) 100%)';
          backgroundImage = background;
        }
        surface = 'hsl(0 0% 100% / 0.70)';
        break;
      case 'image':
        if (imageUrl) {
          const cacheBustedUrl = addCacheBuster(imageUrl, true);
          background = `url(${cacheBustedUrl})`;
          backgroundImage = background;
        } else {
          background = `hsl(${color})`;
          surface = `hsl(${color} / 0.78)`;
        }
        break;
    }

    root.style.setProperty('--header-background', background);
    root.style.setProperty('--header-surface', surface);
    root.style.setProperty('--header-background-image', backgroundImage);
    
    // Notify components that branding has changed
    window.dispatchEvent(new CustomEvent('headerBrandingChanged'));
  } catch (error) {
    console.error('Error applying header branding to CSS:', error);
  }
}

/**
 * Initialize header branding on page load
 */
export function initializeHeaderBranding() {
  if (typeof window === 'undefined') return;
  
  // Small delay to ensure root styles are loaded
  setTimeout(applyHeaderBrandingToCSS, 100);
}
