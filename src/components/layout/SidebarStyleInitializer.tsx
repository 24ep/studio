"use client";

import { useEffect } from 'react';
import { initializeSidebarStyle, setupSidebarStyleListener } from '@/lib/themeUtils';

export function SidebarStyleInitializer() {
  useEffect(() => {
    // Initialize sidebar style on component mount
    initializeSidebarStyle();
    
    // Setup listener for preference changes
    setupSidebarStyleListener();
    
    // Debug: Log the current style
    if (typeof window !== 'undefined') {
      const currentStyle = localStorage.getItem('sidebarActiveStylePreference') || 'gradient';
  
    }
  }, []);

  // This component doesn't render anything
  return null;
} 