import { useEffect } from 'react';

/**
 * Hook to automatically scroll focused input fields into view on mobile
 * Prevents keyboard from covering input fields
 */
export function useAutoScrollToInput() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;

            // Only handle input elements
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            ) {
                // Wait for keyboard to appear
                setTimeout(() => {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            }
        };

        // Listen for focus events
        document.addEventListener('focusin', handleFocus, true);

        return () => {
            document.removeEventListener('focusin', handleFocus, true);
        };
    }, []);
}
