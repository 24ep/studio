"use client";
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { CheckCircle, AlertTriangle, Info, Loader2, XCircle, X, Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';

// Utility to detect dark mode
function isDarkMode() {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}

export default function ToastClient() {
  const [isClient, setIsClient] = useState(false);
  const { contentZIndex } = useDynamicZIndex('toast-client', 'overlay');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server side to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <Toaster
      position="top-right"
      gutter={16}
      containerStyle={{
        zIndex: Math.max(contentZIndex, 99999), // Ensure toasts are always on top
      }}
      toastOptions={{
        duration: 4000,
        style: {
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          padding: '12px 16px',
          minWidth: '300px',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        },
      }}
    >
      {(t) => {
        const ackgroup = t.type;
        const groupMap = {
          success: {
            color: 'hsl(142 76% 36%)',
            bg: 'hsl(142 76% 90%)',
            icon: <CheckCircle className="h-5 w-5 text-green-600" />,
            colored: true,
          },
          error: {
            color: 'hsl(var(--destructive))',
            bg: 'hsl(0 84% 95%)',
            icon: <XCircle className="h-5 w-5 text-red-600" />,
            colored: true,
          },
          warning: {
            color: 'hsl(45 100% 51%)',
            bg: 'hsl(45 100% 92%)',
            icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
            colored: true,
          },
          info: {
            color: 'hsl(210 100% 56%)',
            bg: 'hsl(210 100% 96%)',
            icon: <Info className="h-5 w-5 text-blue-600" />,
            colored: true,
          },
          loading: {
            color: 'hsl(var(--primary))',
            bg: 'hsl(222 89% 96%)',
            icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
            colored: true,
          },
          notification: {
            color: 'hsl(262 83% 58%)',
            bg: 'hsl(262 83% 95%)',
            icon: <Bell className="h-5 w-5 text-purple-600" />,
            colored: true,
          },
          custom: {
            color: 'hsl(var(--border))',
            bg: 'hsl(var(--background))',
            icon: <Info className="h-5 w-5 text-muted-foreground" />,
            colored: false,
          },
          blank: {
            color: 'hsl(var(--border))',
            bg: 'hsl(var(--background))',
            icon: <Info className="h-5 w-5 text-muted-foreground" />,
            colored: false,
          },
          default: {
            color: 'hsl(var(--border))',
            bg: 'hsl(var(--background))',
            icon: <Info className="h-5 w-5 text-muted-foreground" />,
            colored: false,
          },
        };
        const group = groupMap[ackgroup] || groupMap[t.type] || groupMap.default;
        // Determine font color - always use dark text for better readability
        let fontColor = '#222'; // Dark text for both light and dark themes
        return (
          <ToastBar
            toast={t}
            style={{
              ...t.style,
              background: group.bg,
              color: fontColor,
              border: `2px solid ${group.color}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderLeft: `8px solid ${group.color}`,
              alignItems: 'center',
              display: 'flex',
              gap: '12px',
            }}
          >
            {({ message }) => (
              <>
                {group.icon}
                <div className="flex-1 whitespace-pre-line">{message}</div>
                {t.type !== 'loading' && (
                  <button type="button"
                    className="ml-2 p-1 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={() => toast.dismiss(t.id)}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
} 