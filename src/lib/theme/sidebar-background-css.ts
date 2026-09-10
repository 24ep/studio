import { addCacheBuster } from '../imageUtils';
import { waitForSidebar } from './sidebar-styles';
import { updateThemeSystemSettingsCache } from './system-settings-cache';

export interface SidebarBackgroundSettings {
  sidebarBackgroundType?: string;
  sidebarBackgroundImageUrl?: string;
  sidebarBackgroundImageFit?: string;
  sidebarBackgroundImagePosition?: string;
  sidebarBackgroundBlurPercent?: string;
  sidebarBackgroundTranslucencyPercent?: string;
}

export function applySidebarBackgroundSettings(settings: SidebarBackgroundSettings) {
  if (typeof window === 'undefined') return;

  persistSidebarBackgroundSettings(settings);
  updateThemeSystemSettingsCache({
    ...(settings.sidebarBackgroundType ? { sidebarBackgroundType: settings.sidebarBackgroundType } : {}),
    ...(settings.sidebarBackgroundImageUrl ? { sidebarBackgroundImageUrl: settings.sidebarBackgroundImageUrl } : {}),
    ...(settings.sidebarBackgroundImageFit ? { sidebarBackgroundImageFit: settings.sidebarBackgroundImageFit } : {}),
    ...(settings.sidebarBackgroundImagePosition ? { sidebarBackgroundImagePosition: settings.sidebarBackgroundImagePosition } : {}),
    ...(settings.sidebarBackgroundBlurPercent !== undefined ? { sidebarBackgroundBlurPercent: settings.sidebarBackgroundBlurPercent } : {}),
    ...(settings.sidebarBackgroundTranslucencyPercent !== undefined ? { sidebarBackgroundTranslucencyPercent: settings.sidebarBackgroundTranslucencyPercent } : {}),
  });

  applySidebarBackgroundToCSS();
}

export function applySidebarBackgroundToCSS() {
  if (typeof window === 'undefined') return;

  waitForSidebar().then((sidebarElement) => {
    if (!sidebarElement) {
      setTimeout(() => {
        const retrySidebars = getSidebarElements();
        retrySidebars.forEach(applySidebarBackgroundToCSSInternal);
      }, 500);
      return;
    }

    getSidebarElements().forEach(applySidebarBackgroundToCSSInternal);
  });
}

function persistSidebarBackgroundSettings(settings: SidebarBackgroundSettings) {
  if (settings.sidebarBackgroundType) {
    localStorage.setItem('sidebarBackgroundType', settings.sidebarBackgroundType);
  }
  if (settings.sidebarBackgroundImageUrl) {
    localStorage.setItem('sidebarBackgroundImageUrl', settings.sidebarBackgroundImageUrl);
  }
  if (settings.sidebarBackgroundImageFit) {
    localStorage.setItem('sidebarBackgroundImageFit', settings.sidebarBackgroundImageFit);
  }
  if (settings.sidebarBackgroundImagePosition) {
    localStorage.setItem('sidebarBackgroundImagePosition', settings.sidebarBackgroundImagePosition);
  }
  if (settings.sidebarBackgroundBlurPercent !== undefined) {
    localStorage.setItem('sidebarBackgroundBlurPercent', settings.sidebarBackgroundBlurPercent);
  }
  if (settings.sidebarBackgroundTranslucencyPercent !== undefined) {
    localStorage.setItem('sidebarBackgroundTranslucencyPercent', settings.sidebarBackgroundTranslucencyPercent);
  }
}

function applySidebarBackgroundToCSSInternal(sidebarElement: HTMLElement) {
  if (typeof window === 'undefined') return;

  try {
    const root = document.documentElement;
    const backgroundType = localStorage.getItem('sidebarBackgroundType') || 'gradient';
    const backgroundImageUrl = localStorage.getItem('sidebarBackgroundImageUrl') || '';
    const backgroundImageFit = localStorage.getItem('sidebarBackgroundImageFit') || 'cover';
    const backgroundImagePosition = localStorage.getItem('sidebarBackgroundImagePosition') || 'center';
    const blurPercent = parsePercent(localStorage.getItem('sidebarBackgroundBlurPercent'));
    const translucencyPercent = parsePercent(localStorage.getItem('sidebarBackgroundTranslucencyPercent'));

    resetSidebarBackgroundStyle(sidebarElement);
    applySidebarBackgroundEffects(sidebarElement, blurPercent, translucencyPercent);

    switch (backgroundType) {
      case 'gradient':
        applyGradientSidebarBackground(root, sidebarElement);
        break;
      case 'solid':
        applySolidSidebarBackground(root, sidebarElement);
        break;
      case 'image':
        applyImageSidebarBackground({
          backgroundImageFit,
          backgroundImagePosition,
          backgroundImageUrl,
          sidebarElement,
        });
        break;
    }
  } catch (error) {
    console.error('Error applying sidebar background to CSS:', error);
  }
}

function getSidebarElements() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-sidebar="sidebar"]'))
    .filter((sidebarElement) => sidebarElement.dataset?.sidebarSurface !== 'rail');
}

function resetSidebarBackgroundStyle(sidebarElement: HTMLElement) {
  sidebarElement.style.background = '';
  sidebarElement.style.backgroundImage = '';
  sidebarElement.style.backgroundColor = '';
  sidebarElement.style.backgroundSize = '';
  sidebarElement.style.backgroundPosition = '';
  sidebarElement.style.backgroundRepeat = '';
  sidebarElement.style.removeProperty('--sidebar-custom-background');
  sidebarElement.style.removeProperty('--sidebar-custom-background-size');
  sidebarElement.style.removeProperty('--sidebar-custom-background-position');
  sidebarElement.style.removeProperty('--sidebar-custom-background-repeat');
  sidebarElement.classList.remove('custom-background');
}

function applyGradientSidebarBackground(root: HTMLElement, sidebarElement: HTMLElement) {
  const fullGradient = getComputedStyle(root).getPropertyValue('--sidebar-background-full-gradient').trim();
  if (fullGradient) {
    sidebarElement.style.setProperty('--sidebar-custom-background', fullGradient);
    sidebarElement.classList.add('custom-background');
  } else {
    sidebarElement.style.removeProperty('--sidebar-custom-background');
  }
}

function applySolidSidebarBackground(root: HTMLElement, sidebarElement: HTMLElement) {
  const isDark = root.classList.contains('dark');
  const bgStartVar = isDark ? '--sidebar-background-start-d' : '--sidebar-background-start-l';
  const bgStartValue = getComputedStyle(root).getPropertyValue(bgStartVar);
  sidebarElement.style.setProperty('--sidebar-custom-background', `hsl(${bgStartValue})`);
  sidebarElement.classList.add('custom-background');
}

function applyImageSidebarBackground({
  backgroundImageFit,
  backgroundImagePosition,
  backgroundImageUrl,
  sidebarElement,
}: {
  backgroundImageFit: string;
  backgroundImagePosition: string;
  backgroundImageUrl: string;
  sidebarElement: HTMLElement;
}) {
  if (!backgroundImageUrl) return;

  try {
    const cacheBustedUrl = addCacheBuster(backgroundImageUrl, true);
    setSidebarImageBackground(sidebarElement, cacheBustedUrl, backgroundImageFit, backgroundImagePosition);
  } catch (cacheError) {
    console.error('Error applying cache busting to sidebar background image:', cacheError);
    setSidebarImageBackground(sidebarElement, backgroundImageUrl, backgroundImageFit, backgroundImagePosition);
  }
}

function setSidebarImageBackground(
  sidebarElement: HTMLElement,
  imageUrl: string,
  backgroundImageFit: string,
  backgroundImagePosition: string,
) {
  sidebarElement.style.setProperty('--sidebar-custom-background', `url(${imageUrl})`);
  sidebarElement.style.setProperty('--sidebar-custom-background-size', backgroundImageFit);
  sidebarElement.style.setProperty('--sidebar-custom-background-position', backgroundImagePosition);
  sidebarElement.style.setProperty('--sidebar-custom-background-repeat', 'no-repeat');
  sidebarElement.classList.add('custom-background');
}

function applySidebarBackgroundEffects(
  sidebarElement: HTMLElement,
  blurPercent: number,
  translucencyPercent: number,
) {
  const blurPx = Math.round((blurPercent / 100) * 24);
  const opacity = Math.max(0, Math.min(1, 1 - translucencyPercent / 100));

  sidebarElement.style.setProperty('--sidebar-background-blur', `${blurPx}px`);
  sidebarElement.style.setProperty('--sidebar-background-opacity', String(opacity));
}

function parsePercent(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}
