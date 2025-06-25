export function setThemeAndColors({ themePreference, primaryGradientStart, primaryGradientEnd, sidebarColors = {}, }) {
    if (typeof window === 'undefined')
        return;
    const root = document.documentElement;
    // Set theme class
    if (themePreference === 'dark') {
        root.classList.add('dark');
    }
    else if (themePreference === 'light') {
        root.classList.remove('dark');
    }
    else if (themePreference === 'system') {
        // Follow OS
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark)
            root.classList.add('dark');
        else
            root.classList.remove('dark');
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
        const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        root.style.setProperty(`--${cssVar}`, value);
    });
}
