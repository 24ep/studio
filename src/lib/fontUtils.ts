/**
 * Font utility functions for handling Thai and English text
 */

/**
 * Check if text contains Thai characters
 * @param text - The text to check
 * @returns boolean indicating if text contains Thai characters
 */
export function containsThaiText(text: string): boolean {
  if (!text) return false;
  // Thai Unicode range: \u0E00-\u0E7F
  const thaiRegex = /[\u0E00-\u0E7F]/;
  return thaiRegex.test(text);
}

/**
 * Get the appropriate font class based on text content
 * @param text - The text to analyze
 * @returns CSS class name for the appropriate font
 */
export function getFontClass(text: string): string {
  if (!text) return 'font-english';
  return containsThaiText(text) ? 'font-thai' : 'font-english';
}

/**
 * Get the appropriate font family string based on text content
 * @param text - The text to analyze
 * @returns Font family CSS value
 */
export function getFontFamily(text: string): string {
  if (!text) return "var(--font-dm-sans), 'DM Sans', sans-serif";
  return containsThaiText(text) 
    ? "var(--font-ibm-plex-sans-thai), var(--font-dm-sans), sans-serif"
    : "var(--font-dm-sans), 'DM Sans', sans-serif";
}

/**
 * Apply appropriate font to an element based on its text content
 * @param element - The DOM element to style
 */
export function applyAutoFont(element: HTMLElement): void {
  const text = element.textContent || '';
  const fontClass = getFontClass(text);
  
  // Remove existing font classes
  element.classList.remove('font-thai', 'font-english', 'font-auto');
  
  // Add appropriate font class
  element.classList.add(fontClass);
}

/**
 * Create a CSS class for mixed language content
 * @param className - Base class name
 * @returns CSS class that handles both Thai and English text
 */
export function createMixedFontClass(className: string): string {
  return `
    .${className} {
      font-family: var(--font-dm-sans), "DM Sans", sans-serif;
    }
    .${className} [lang="th"],
    .${className} [lang="th-TH"] {
      font-family: var(--font-ibm-plex-sans-thai), var(--font-dm-sans), sans-serif;
    }
  `;
}

/**
 * Detect the primary language of text
 * @param text - The text to analyze
 * @returns 'thai', 'english', 'mixed', or 'other'
 */
export function detectLanguage(text: string): 'thai' | 'english' | 'mixed' | 'other' {
  if (!text) return 'other';
  
  const hasThai = containsThaiText(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  
  if (hasThai && hasEnglish) return 'mixed';
  if (hasThai) return 'thai';
  if (hasEnglish) return 'english';
  return 'other';
}

/**
 * Get font weight recommendations for Thai text
 * @param weight - The desired weight
 * @returns Recommended font weight for Thai text
 */
export function getThaiFontWeight(weight: string): string {
  // IBM Plex Sans Thai supports: 400, 500, 600, 700
  const supportedWeights = ['400', '500', '600', '700'];
  return supportedWeights.includes(weight) ? weight : '400';
} 
