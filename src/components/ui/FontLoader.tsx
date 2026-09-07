'use client';

import { useEffect, useState } from 'react';

interface FontLoaderProps {
  children: React.ReactNode;
  fonts?: string[];
  timeout?: number;
}

export function FontLoader({ 
  children, 
  fonts = ['IBM Plex Sans', 'IBM Plex Sans Thai'],
  timeout = 3000 
}: FontLoaderProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);

  useEffect(() => {
    // Apply system fonts immediately on mount
    document.documentElement.classList.add('fonts-loading');
    
    // Check if fonts are available
    const checkFonts = async () => {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Font loading timeout')), timeout);
        });

        // Race between font loading and timeout
        await Promise.race([
          document.fonts.ready,
          timeoutPromise
        ]);
        
        // Verify that our specific fonts are loaded
        const fontChecks = fonts.map(async (fontFamily) => {
          try {
            const fontFace = Array.from(document.fonts).find(
              (font: FontFace) => font.family === fontFamily
            );
            return fontFace ? fontFace.loaded : Promise.resolve();
          } catch {
            return Promise.resolve();
          }
        });

        await Promise.all(fontChecks);
        
        setFontsLoaded(true);
        document.documentElement.classList.add('fonts-loaded');
        document.documentElement.classList.remove('fonts-loading');
        
        console.log('Fonts loaded successfully:', fonts.join(', '));
      } catch (error) {
        console.warn('Font loading timeout or error - proceeding with system fonts:', error);
        setFontError(true);
        setFontsLoaded(true);
        
        // Still mark as loaded to not block the UI
        document.documentElement.classList.add('fonts-loaded');
        document.documentElement.classList.remove('fonts-loading');
      }
    };

    checkFonts();

    return () => {
      document.documentElement.classList.remove('fonts-loading');
    };
  }, [fonts, timeout]);

  return <>{children}</>;
}
