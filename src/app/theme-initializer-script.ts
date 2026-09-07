export const themeInitializerScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('theme');
      const preference = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
        ? savedTheme
        : 'system';
      
      let shouldBeDark = false;
      if (preference === 'dark') {
        shouldBeDark = true;
      } else if (preference === 'light') {
        shouldBeDark = false;
      } else if (preference === 'system') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      const root = document.documentElement;
      const applyResolvedTheme = (isDark) => {
        root.classList.toggle('dark', isDark);
        root.style.colorScheme = isDark ? 'dark' : 'light';
        root.dataset.resolvedTheme = isDark ? 'dark' : 'light';
        window.__THEME_IS_DARK__ = isDark;
      };

      applyResolvedTheme(shouldBeDark);
      
      window.__THEME_INITIALIZED__ = true;
      window.__THEME_PREFERENCE__ = preference;
      
      if (preference === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
          applyResolvedTheme(mediaQuery.matches);
        };
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      }
    } catch (error) {
      console.warn('Failed to initialize theme:', error);
    }
  })();
`;
