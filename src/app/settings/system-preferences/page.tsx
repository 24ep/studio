"use client";

import React, { useEffect, useState, type ChangeEvent } from "react";
import { Loader2, Save, X, Palette, ImageUp, Trash2, XCircle, PenSquare, Sun, Moon, RotateCcw, Sidebar as SidebarIcon, LogIn } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { setThemeAndColors } from "@/lib/themeUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_THEME: ThemePreference = "system";

// Backend keys
const APP_THEME_KEY = 'themePreference';
const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_NAME_KEY = 'appName';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';

// Login page design keys/types/utilities
const LOGIN_BACKGROUND_TYPE_KEY = 'loginBackgroundType';
const LOGIN_BACKGROUND_IMAGE_KEY = 'loginBackgroundImage';
const LOGIN_BACKGROUND_GRADIENT_START_KEY = 'loginBackgroundGradientStart';
const LOGIN_BACKGROUND_GRADIENT_END_KEY = 'loginBackgroundGradientEnd';
const LOGIN_BACKGROUND_COLOR_KEY = 'loginBackgroundColor';

type ThemePreference = "light" | "dark" | "system";
type LoginBackgroundType = 'image' | 'gradient' | 'solid';

// --- Sidebar color keys/types/utilities ---
const DEFAULT_PRIMARY_GRADIENT_START = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END = "238 74% 61%";
const DEFAULT_SIDEBAR_COLORS_BASE = {
  // Background colors
  sidebarBgStartL: "220 25% 97%", sidebarBgEndL: "220 20% 94%", sidebarTextL: "220 25% 30%",
  sidebarActiveBgStartL: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndL: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextL: "0 0% 100%",      
  sidebarHoverBgL: "220 10% 92%", sidebarHoverTextL: "220 25% 25%", sidebarBorderL: "220 15% 85%",
  sidebarBgStartD: "220 15% 12%", sidebarBgEndD: "220 15% 9%", sidebarTextD: "210 30% 85%",
  sidebarActiveBgStartD: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndD: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextD: "0 0% 100%",      
  sidebarHoverBgD: "220 15% 20%", sidebarHoverTextD: "210 30% 90%", sidebarBorderD: "220 15% 18%",
  
  // Font settings
  sidebarFontFamilyL: "inherit", sidebarFontSizeL: "0.875rem", sidebarFontWeightL: "400",
  sidebarLineHeightL: "1.25rem", sidebarLetterSpacingL: "0", sidebarTextTransformL: "none",
  sidebarFontFamilyD: "inherit", sidebarFontSizeD: "0.875rem", sidebarFontWeightD: "400",
  sidebarLineHeightD: "1.25rem", sidebarLetterSpacingD: "0", sidebarTextTransformD: "none",
  
  // Border and shadow settings
  sidebarBorderWidthL: "1px", sidebarBorderStyleL: "solid", sidebarBorderRadiusL: "0.5rem",
  sidebarShadowL: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  sidebarShadowHoverL: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  sidebarShadowActiveL: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  sidebarBorderWidthD: "1px", sidebarBorderStyleD: "solid", sidebarBorderRadiusD: "0.5rem",
  sidebarShadowD: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
  sidebarShadowHoverD: "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
  sidebarShadowActiveD: "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
  
  // Spacing and layout
  sidebarPaddingXL: "0.75rem", sidebarPaddingYL: "0.5rem", sidebarMarginL: "0.25rem", sidebarGapL: "0.5rem",
  sidebarWidthL: "16rem", sidebarWidthCollapsedL: "3rem", sidebarTransitionDurationL: "0.2s", sidebarTransitionTimingL: "ease-in-out",
  sidebarPaddingXD: "0.75rem", sidebarPaddingYD: "0.5rem", sidebarMarginD: "0.25rem", sidebarGapD: "0.5rem",
  sidebarWidthD: "16rem", sidebarWidthCollapsedD: "3rem", sidebarTransitionDurationD: "0.2s", sidebarTransitionTimingD: "ease-in-out",
  
  // Menu item specific settings
  sidebarMenuItemBgL: "transparent", sidebarMenuItemBgHoverL: "220 10% 92%", sidebarMenuItemBgActiveL: "179 67% 66%",
  sidebarMenuItemColorL: "220 25% 30%", sidebarMenuItemColorHoverL: "220 25% 25%", sidebarMenuItemColorActiveL: "0 0% 100%",
  sidebarMenuItemBorderL: "transparent", sidebarMenuItemBorderHoverL: "transparent", sidebarMenuItemBorderActiveL: "transparent",
  sidebarMenuItemBorderRadiusL: "0.375rem", sidebarMenuItemPaddingXL: "0.75rem", sidebarMenuItemPaddingYL: "0.5rem",
  sidebarMenuItemMarginL: "0.125rem", sidebarMenuItemFontWeightL: "400", sidebarMenuItemFontWeightActiveL: "600",
  sidebarMenuItemFontSizeL: "0.875rem", sidebarMenuItemLineHeightL: "1.25rem", sidebarMenuItemTransitionL: "all 0.2s ease-in-out",
  sidebarMenuItemBgD: "transparent", sidebarMenuItemBgHoverD: "220 15% 20%", sidebarMenuItemBgActiveD: "179 67% 66%",
  sidebarMenuItemColorD: "210 30% 85%", sidebarMenuItemColorHoverD: "210 30% 90%", sidebarMenuItemColorActiveD: "0 0% 100%",
  sidebarMenuItemBorderD: "transparent", sidebarMenuItemBorderHoverD: "transparent", sidebarMenuItemBorderActiveD: "transparent",
  sidebarMenuItemBorderRadiusD: "0.375rem", sidebarMenuItemPaddingXD: "0.75rem", sidebarMenuItemPaddingYD: "0.5rem",
  sidebarMenuItemMarginD: "0.125rem", sidebarMenuItemFontWeightD: "400", sidebarMenuItemFontWeightActiveD: "600",
  sidebarMenuItemFontSizeD: "0.875rem", sidebarMenuItemLineHeightD: "1.25rem", sidebarMenuItemTransitionD: "all 0.2s ease-in-out",
  
  // Icon settings
  sidebarIconSizeL: "1.25rem", sidebarIconColorL: "220 25% 30%", sidebarIconColorHoverL: "220 25% 25%", sidebarIconColorActiveL: "0 0% 100%",
  sidebarIconMarginRightL: "0.75rem", sidebarIconTransitionL: "color 0.2s ease-in-out",
  sidebarIconSizeD: "1.25rem", sidebarIconColorD: "210 30% 85%", sidebarIconColorHoverD: "210 30% 90%", sidebarIconColorActiveD: "0 0% 100%",
  sidebarIconMarginRightD: "0.75rem", sidebarIconTransitionD: "color 0.2s ease-in-out",
  
  // Group label settings
  sidebarGroupLabelColorL: "220 15% 50%", sidebarGroupLabelFontSizeL: "0.75rem", sidebarGroupLabelFontWeightL: "500",
  sidebarGroupLabelTextTransformL: "uppercase", sidebarGroupLabelLetterSpacingL: "0.05em", sidebarGroupLabelPaddingL: "0.5rem 0.75rem", sidebarGroupLabelMarginL: "0.5rem 0",
  sidebarGroupLabelColorD: "210 25% 70%", sidebarGroupLabelFontSizeD: "0.75rem", sidebarGroupLabelFontWeightD: "500",
  sidebarGroupLabelTextTransformD: "uppercase", sidebarGroupLabelLetterSpacingD: "0.05em", sidebarGroupLabelPaddingD: "0.5rem 0.75rem", sidebarGroupLabelMarginD: "0.5rem 0",
};

const SIDEBAR_COLOR_KEYS = [
  // Background colors
  'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL',
  'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL',
  'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
  'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD',
  'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD',
  'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD',
  
  // Font settings
  'sidebarFontFamilyL', 'sidebarFontSizeL', 'sidebarFontWeightL', 'sidebarLineHeightL', 'sidebarLetterSpacingL', 'sidebarTextTransformL',
  'sidebarFontFamilyD', 'sidebarFontSizeD', 'sidebarFontWeightD', 'sidebarLineHeightD', 'sidebarLetterSpacingD', 'sidebarTextTransformD',
  
  // Border and shadow settings
  'sidebarBorderWidthL', 'sidebarBorderStyleL', 'sidebarBorderRadiusL', 'sidebarShadowL', 'sidebarShadowHoverL', 'sidebarShadowActiveL',
  'sidebarBorderWidthD', 'sidebarBorderStyleD', 'sidebarBorderRadiusD', 'sidebarShadowD', 'sidebarShadowHoverD', 'sidebarShadowActiveD',
  
  // Spacing and layout
  'sidebarPaddingXL', 'sidebarPaddingYL', 'sidebarMarginL', 'sidebarGapL', 'sidebarWidthL', 'sidebarWidthCollapsedL', 'sidebarTransitionDurationL', 'sidebarTransitionTimingL',
  'sidebarPaddingXD', 'sidebarPaddingYD', 'sidebarMarginD', 'sidebarGapD', 'sidebarWidthD', 'sidebarWidthCollapsedD', 'sidebarTransitionDurationD', 'sidebarTransitionTimingD',
  
  // Menu item specific settings
  'sidebarMenuItemBgL', 'sidebarMenuItemBgHoverL', 'sidebarMenuItemBgActiveL', 'sidebarMenuItemColorL', 'sidebarMenuItemColorHoverL', 'sidebarMenuItemColorActiveL',
  'sidebarMenuItemBorderL', 'sidebarMenuItemBorderHoverL', 'sidebarMenuItemBorderActiveL', 'sidebarMenuItemBorderRadiusL', 'sidebarMenuItemPaddingXL', 'sidebarMenuItemPaddingYL',
  'sidebarMenuItemMarginL', 'sidebarMenuItemFontWeightL', 'sidebarMenuItemFontWeightActiveL', 'sidebarMenuItemFontSizeL', 'sidebarMenuItemLineHeightL', 'sidebarMenuItemTransitionL',
  'sidebarMenuItemBgD', 'sidebarMenuItemBgHoverD', 'sidebarMenuItemBgActiveD', 'sidebarMenuItemColorD', 'sidebarMenuItemColorHoverD', 'sidebarMenuItemColorActiveD',
  'sidebarMenuItemBorderD', 'sidebarMenuItemBorderHoverD', 'sidebarMenuItemBorderActiveD', 'sidebarMenuItemBorderRadiusD', 'sidebarMenuItemPaddingXD', 'sidebarMenuItemPaddingYD',
  'sidebarMenuItemMarginD', 'sidebarMenuItemFontWeightD', 'sidebarMenuItemFontWeightActiveD', 'sidebarMenuItemFontSizeD', 'sidebarMenuItemLineHeightD', 'sidebarMenuItemTransitionD',
  
  // Icon settings
  'sidebarIconSizeL', 'sidebarIconColorL', 'sidebarIconColorHoverL', 'sidebarIconColorActiveL', 'sidebarIconMarginRightL', 'sidebarIconTransitionL',
  'sidebarIconSizeD', 'sidebarIconColorD', 'sidebarIconColorHoverD', 'sidebarIconColorActiveD', 'sidebarIconMarginRightD', 'sidebarIconTransitionD',
  
  // Group label settings
  'sidebarGroupLabelColorL', 'sidebarGroupLabelFontSizeL', 'sidebarGroupLabelFontWeightL', 'sidebarGroupLabelTextTransformL', 'sidebarGroupLabelLetterSpacingL', 'sidebarGroupLabelPaddingL', 'sidebarGroupLabelMarginL',
  'sidebarGroupLabelColorD', 'sidebarGroupLabelFontSizeD', 'sidebarGroupLabelFontWeightD', 'sidebarGroupLabelTextTransformD', 'sidebarGroupLabelLetterSpacingD', 'sidebarGroupLabelPaddingD', 'sidebarGroupLabelMarginD',
];

function parseHslString(hslString: string): { h: number; s: number; l: number } | null {
  const match = hslString?.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]) / 100,
    l: parseFloat(match[3]) / 100,
  };
}
function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
function hexToHslString(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.startsWith('#')) hex = hex.substring(1);
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else { return "0 0% 0%"; } 
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  return `${h} ${s}% ${lPercent}%`;
}
function convertHslStringToHex(hslString: string | null | undefined): string {
  if (!hslString) return '#000000';
  const hslObj = parseHslString(hslString);
  if (!hslObj) return '#000000';
  return hslToHex(hslObj.h, hslObj.s, hslObj.l);
}

interface SidebarColors {
  // Background colors
  sidebarBgStartL: string; sidebarBgEndL: string; sidebarTextL: string;
  sidebarActiveBgStartL: string; sidebarActiveBgEndL: string; sidebarActiveTextL: string;
  sidebarHoverBgL: string; sidebarHoverTextL: string; sidebarBorderL: string;
  sidebarBgStartD: string; sidebarBgEndD: string; sidebarTextD: string;
  sidebarActiveBgStartD: string; sidebarActiveBgEndD: string; 
  sidebarActiveTextD: string;
  sidebarHoverBgD: string; sidebarHoverTextD: string; sidebarBorderD: string;
  
  // Font settings
  sidebarFontFamilyL: string; sidebarFontSizeL: string; sidebarFontWeightL: string;
  sidebarLineHeightL: string; sidebarLetterSpacingL: string; sidebarTextTransformL: string;
  sidebarFontFamilyD: string; sidebarFontSizeD: string; sidebarFontWeightD: string;
  sidebarLineHeightD: string; sidebarLetterSpacingD: string; sidebarTextTransformD: string;
  
  // Border and shadow settings
  sidebarBorderWidthL: string; sidebarBorderStyleL: string; sidebarBorderRadiusL: string;
  sidebarShadowL: string; sidebarShadowHoverL: string; sidebarShadowActiveL: string;
  sidebarBorderWidthD: string; sidebarBorderStyleD: string; sidebarBorderRadiusD: string;
  sidebarShadowD: string; sidebarShadowHoverD: string; sidebarShadowActiveD: string;
  
  // Spacing and layout
  sidebarPaddingXL: string; sidebarPaddingYL: string; sidebarMarginL: string; sidebarGapL: string;
  sidebarWidthL: string; sidebarWidthCollapsedL: string; sidebarTransitionDurationL: string; sidebarTransitionTimingL: string;
  sidebarPaddingXD: string; sidebarPaddingYD: string; sidebarMarginD: string; sidebarGapD: string;
  sidebarWidthD: string; sidebarWidthCollapsedD: string; sidebarTransitionDurationD: string; sidebarTransitionTimingD: string;
  
  // Menu item specific settings
  sidebarMenuItemBgL: string; sidebarMenuItemBgHoverL: string; sidebarMenuItemBgActiveL: string;
  sidebarMenuItemColorL: string; sidebarMenuItemColorHoverL: string; sidebarMenuItemColorActiveL: string;
  sidebarMenuItemBorderL: string; sidebarMenuItemBorderHoverL: string; sidebarMenuItemBorderActiveL: string;
  sidebarMenuItemBorderRadiusL: string; sidebarMenuItemPaddingXL: string; sidebarMenuItemPaddingYL: string;
  sidebarMenuItemMarginL: string; sidebarMenuItemFontWeightL: string; sidebarMenuItemFontWeightActiveL: string;
  sidebarMenuItemFontSizeL: string; sidebarMenuItemLineHeightL: string; sidebarMenuItemTransitionL: string;
  sidebarMenuItemBgD: string; sidebarMenuItemBgHoverD: string; sidebarMenuItemBgActiveD: string;
  sidebarMenuItemColorD: string; sidebarMenuItemColorHoverD: string; sidebarMenuItemColorActiveD: string;
  sidebarMenuItemBorderD: string; sidebarMenuItemBorderHoverD: string; sidebarMenuItemBorderActiveD: string;
  sidebarMenuItemBorderRadiusD: string; sidebarMenuItemPaddingXD: string; sidebarMenuItemPaddingYD: string;
  sidebarMenuItemMarginD: string; sidebarMenuItemFontWeightD: string; sidebarMenuItemFontWeightActiveD: string;
  sidebarMenuItemFontSizeD: string; sidebarMenuItemLineHeightD: string; sidebarMenuItemTransitionD: string;
  
  // Icon settings
  sidebarIconSizeL: string; sidebarIconColorL: string; sidebarIconColorHoverL: string; sidebarIconColorActiveL: string;
  sidebarIconMarginRightL: string; sidebarIconTransitionL: string;
  sidebarIconSizeD: string; sidebarIconColorD: string; sidebarIconColorHoverD: string; sidebarIconColorActiveD: string;
  sidebarIconMarginRightD: string; sidebarIconTransitionD: string;
  
  // Group label settings
  sidebarGroupLabelColorL: string; sidebarGroupLabelFontSizeL: string; sidebarGroupLabelFontWeightL: string;
  sidebarGroupLabelTextTransformL: string; sidebarGroupLabelLetterSpacingL: string; sidebarGroupLabelPaddingL: string; sidebarGroupLabelMarginL: string;
  sidebarGroupLabelColorD: string; sidebarGroupLabelFontSizeD: string; sidebarGroupLabelFontWeightD: string;
  sidebarGroupLabelTextTransformD: string; sidebarGroupLabelLetterSpacingD: string; sidebarGroupLabelPaddingD: string; sidebarGroupLabelMarginD: string;
  
  [key: string]: string;
}

function setSidebarCSSVars(settings: SidebarColors) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  // Map settings keys to Tailwind CSS variable names
  const cssVarMapping: Record<string, string> = {
    // Light theme - Background colors
    'sidebarBgStartL': '--sidebar-background-start',
    'sidebarBgEndL': '--sidebar-background-end',
    'sidebarTextL': '--sidebar-foreground',
    'sidebarBorderL': '--sidebar-border',
    'sidebarActiveBgStartL': '--sidebar-primary',
    'sidebarActiveTextL': '--sidebar-primary-foreground',
    'sidebarHoverBgL': '--sidebar-accent',
    'sidebarHoverTextL': '--sidebar-accent-foreground',
    
    // Light theme - Font settings
    'sidebarFontFamilyL': '--sidebar-font-family',
    'sidebarFontSizeL': '--sidebar-font-size',
    'sidebarFontWeightL': '--sidebar-font-weight',
    'sidebarLineHeightL': '--sidebar-line-height',
    'sidebarLetterSpacingL': '--sidebar-letter-spacing',
    'sidebarTextTransformL': '--sidebar-text-transform',
    
    // Light theme - Border and shadow settings
    'sidebarBorderWidthL': '--sidebar-border-width',
    'sidebarBorderStyleL': '--sidebar-border-style',
    'sidebarBorderRadiusL': '--sidebar-border-radius',
    'sidebarShadowL': '--sidebar-shadow',
    'sidebarShadowHoverL': '--sidebar-shadow-hover',
    'sidebarShadowActiveL': '--sidebar-shadow-active',
    
    // Light theme - Spacing and layout
    'sidebarPaddingXL': '--sidebar-padding-x',
    'sidebarPaddingYL': '--sidebar-padding-y',
    'sidebarMarginL': '--sidebar-margin',
    'sidebarGapL': '--sidebar-gap',
    'sidebarWidthL': '--sidebar-width',
    'sidebarWidthCollapsedL': '--sidebar-width-collapsed',
    'sidebarTransitionDurationL': '--sidebar-transition-duration',
    'sidebarTransitionTimingL': '--sidebar-transition-timing',
    
    // Light theme - Menu item specific settings
    'sidebarMenuItemBgL': '--sidebar-menu-item-background',
    'sidebarMenuItemBgHoverL': '--sidebar-menu-item-background-hover',
    'sidebarMenuItemBgActiveL': '--sidebar-menu-item-background-active',
    'sidebarMenuItemColorL': '--sidebar-menu-item-color',
    'sidebarMenuItemColorHoverL': '--sidebar-menu-item-color-hover',
    'sidebarMenuItemColorActiveL': '--sidebar-menu-item-color-active',
    'sidebarMenuItemBorderL': '--sidebar-menu-item-border',
    'sidebarMenuItemBorderHoverL': '--sidebar-menu-item-border-hover',
    'sidebarMenuItemBorderActiveL': '--sidebar-menu-item-border-active',
    'sidebarMenuItemBorderRadiusL': '--sidebar-menu-item-border-radius',
    'sidebarMenuItemPaddingXL': '--sidebar-menu-item-padding-x',
    'sidebarMenuItemPaddingYL': '--sidebar-menu-item-padding-y',
    'sidebarMenuItemMarginL': '--sidebar-menu-item-margin',
    'sidebarMenuItemFontWeightL': '--sidebar-menu-item-font-weight',
    'sidebarMenuItemFontWeightActiveL': '--sidebar-menu-item-font-weight-active',
    'sidebarMenuItemFontSizeL': '--sidebar-menu-item-font-size',
    'sidebarMenuItemLineHeightL': '--sidebar-menu-item-line-height',
    'sidebarMenuItemTransitionL': '--sidebar-menu-item-transition',
    
    // Light theme - Icon settings
    'sidebarIconSizeL': '--sidebar-icon-size',
    'sidebarIconColorL': '--sidebar-icon-color',
    'sidebarIconColorHoverL': '--sidebar-icon-color-hover',
    'sidebarIconColorActiveL': '--sidebar-icon-color-active',
    'sidebarIconMarginRightL': '--sidebar-icon-margin-right',
    'sidebarIconTransitionL': '--sidebar-icon-transition',
    
    // Light theme - Group label settings
    'sidebarGroupLabelColorL': '--sidebar-group-label-color',
    'sidebarGroupLabelFontSizeL': '--sidebar-group-label-font-size',
    'sidebarGroupLabelFontWeightL': '--sidebar-group-label-font-weight',
    'sidebarGroupLabelTextTransformL': '--sidebar-group-label-text-transform',
    'sidebarGroupLabelLetterSpacingL': '--sidebar-group-label-letter-spacing',
    'sidebarGroupLabelPaddingL': '--sidebar-group-label-padding',
    'sidebarGroupLabelMarginL': '--sidebar-group-label-margin',
    
    // Dark theme - Background colors
    'sidebarBgStartD': '--sidebar-background-start',
    'sidebarBgEndD': '--sidebar-background-end',
    'sidebarTextD': '--sidebar-foreground',
    'sidebarBorderD': '--sidebar-border',
    'sidebarActiveBgStartD': '--sidebar-primary',
    'sidebarActiveTextD': '--sidebar-primary-foreground',
    'sidebarHoverBgD': '--sidebar-accent',
    'sidebarHoverTextD': '--sidebar-accent-foreground',
    
    // Dark theme - Font settings
    'sidebarFontFamilyD': '--sidebar-font-family',
    'sidebarFontSizeD': '--sidebar-font-size',
    'sidebarFontWeightD': '--sidebar-font-weight',
    'sidebarLineHeightD': '--sidebar-line-height',
    'sidebarLetterSpacingD': '--sidebar-letter-spacing',
    'sidebarTextTransformD': '--sidebar-text-transform',
    
    // Dark theme - Border and shadow settings
    'sidebarBorderWidthD': '--sidebar-border-width',
    'sidebarBorderStyleD': '--sidebar-border-style',
    'sidebarBorderRadiusD': '--sidebar-border-radius',
    'sidebarShadowD': '--sidebar-shadow',
    'sidebarShadowHoverD': '--sidebar-shadow-hover',
    'sidebarShadowActiveD': '--sidebar-shadow-active',
    
    // Dark theme - Spacing and layout
    'sidebarPaddingXD': '--sidebar-padding-x',
    'sidebarPaddingYD': '--sidebar-padding-y',
    'sidebarMarginD': '--sidebar-margin',
    'sidebarGapD': '--sidebar-gap',
    'sidebarWidthD': '--sidebar-width',
    'sidebarWidthCollapsedD': '--sidebar-width-collapsed',
    'sidebarTransitionDurationD': '--sidebar-transition-duration',
    'sidebarTransitionTimingD': '--sidebar-transition-timing',
    
    // Dark theme - Menu item specific settings
    'sidebarMenuItemBgD': '--sidebar-menu-item-background',
    'sidebarMenuItemBgHoverD': '--sidebar-menu-item-background-hover',
    'sidebarMenuItemBgActiveD': '--sidebar-menu-item-background-active',
    'sidebarMenuItemColorD': '--sidebar-menu-item-color',
    'sidebarMenuItemColorHoverD': '--sidebar-menu-item-color-hover',
    'sidebarMenuItemColorActiveD': '--sidebar-menu-item-color-active',
    'sidebarMenuItemBorderD': '--sidebar-menu-item-border',
    'sidebarMenuItemBorderHoverD': '--sidebar-menu-item-border-hover',
    'sidebarMenuItemBorderActiveD': '--sidebar-menu-item-border-active',
    'sidebarMenuItemBorderRadiusD': '--sidebar-menu-item-border-radius',
    'sidebarMenuItemPaddingXD': '--sidebar-menu-item-padding-x',
    'sidebarMenuItemPaddingYD': '--sidebar-menu-item-padding-y',
    'sidebarMenuItemMarginD': '--sidebar-menu-item-margin',
    'sidebarMenuItemFontWeightD': '--sidebar-menu-item-font-weight',
    'sidebarMenuItemFontWeightActiveD': '--sidebar-menu-item-font-weight-active',
    'sidebarMenuItemFontSizeD': '--sidebar-menu-item-font-size',
    'sidebarMenuItemLineHeightD': '--sidebar-menu-item-line-height',
    'sidebarMenuItemTransitionD': '--sidebar-menu-item-transition',
    
    // Dark theme - Icon settings
    'sidebarIconSizeD': '--sidebar-icon-size',
    'sidebarIconColorD': '--sidebar-icon-color',
    'sidebarIconColorHoverD': '--sidebar-icon-color-hover',
    'sidebarIconColorActiveD': '--sidebar-icon-color-active',
    'sidebarIconMarginRightD': '--sidebar-icon-margin-right',
    'sidebarIconTransitionD': '--sidebar-icon-transition',
    
    // Dark theme - Group label settings
    'sidebarGroupLabelColorD': '--sidebar-group-label-color',
    'sidebarGroupLabelFontSizeD': '--sidebar-group-label-font-size',
    'sidebarGroupLabelFontWeightD': '--sidebar-group-label-font-weight',
    'sidebarGroupLabelTextTransformD': '--sidebar-group-label-text-transform',
    'sidebarGroupLabelLetterSpacingD': '--sidebar-group-label-letter-spacing',
    'sidebarGroupLabelPaddingD': '--sidebar-group-label-padding',
    'sidebarGroupLabelMarginD': '--sidebar-group-label-margin',
  };

  // Set CSS variables based on current theme
  const isDark = document.documentElement.classList.contains('dark');
  const themeSuffix = isDark ? 'D' : 'L';
  
  SIDEBAR_COLOR_KEYS.forEach(key => {
    if (key.endsWith(themeSuffix) && settings[key as keyof SidebarColors]) {
      const cssVarName = cssVarMapping[key];
      if (cssVarName) {
        root.style.setProperty(cssVarName, settings[key as keyof SidebarColors]);
      }
    }
  });
}
function createInitialSidebarColors() {
  return { ...DEFAULT_SIDEBAR_COLORS_BASE };
}
// --- End sidebar color utilities ---

// Login page design state
const DEFAULT_LOGIN_BACKGROUND_TYPE: LoginBackgroundType = 'gradient';
const DEFAULT_LOGIN_BACKGROUND_GRADIENT_START = '179 67% 66%';
const DEFAULT_LOGIN_BACKGROUND_GRADIENT_END = '238 74% 61%';
const DEFAULT_LOGIN_BACKGROUND_COLOR = '220 25% 97%';

export default function SystemPreferencesPage() {
  const { success, error } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Preferences state
  const [themePreference, setThemePreference] = useState<ThemePreference>(DEFAULT_THEME);
  const [appName, setAppName] = useState<string>(DEFAULT_APP_NAME);
  // App Logo state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoDataUrl, setSavedLogoDataUrl] = useState<string | null>(null);
  
  // Login page design state
  const [loginBackgroundType, setLoginBackgroundType] = useState<LoginBackgroundType>(DEFAULT_LOGIN_BACKGROUND_TYPE);
  const [selectedLoginImageFile, setSelectedLoginImageFile] = useState<File | null>(null);
  const [loginImagePreviewUrl, setLoginImagePreviewUrl] = useState<string | null>(null);
  const [savedLoginImageDataUrl, setSavedLoginImageDataUrl] = useState<string | null>(null);
  const [loginBackgroundGradientStart, setLoginBackgroundGradientStart] = useState<string>(DEFAULT_LOGIN_BACKGROUND_GRADIENT_START);
  const [loginBackgroundGradientEnd, setLoginBackgroundGradientEnd] = useState<string>(DEFAULT_LOGIN_BACKGROUND_GRADIENT_END);
  const [loginBackgroundColor, setLoginBackgroundColor] = useState<string>(DEFAULT_LOGIN_BACKGROUND_COLOR);
  
  // Loading/saving/error
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Sidebar color state
  const [sidebarColors, setSidebarColors] = useState<SidebarColors>(DEFAULT_SIDEBAR_COLORS_BASE);

  const canEdit =
    session?.user?.role === "Admin" ||
    session?.user?.modulePermissions?.includes("SYSTEM_SETTINGS_MANAGE");

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: pathname });
    } else if (sessionStatus === 'authenticated') {
      // Fetch from backend
      async function fetchPrefs() {
        setLoading(true);
        setErrorMsg(null);
        try {
          const res = await fetch('/api/settings/system-settings');
          if (!res.ok) throw new Error('Failed to load system preferences');
          const data = await res.json();
          setThemePreference((data[APP_THEME_KEY] as ThemePreference) || DEFAULT_THEME);
          setAppName(data[APP_NAME_KEY] || DEFAULT_APP_NAME);
          setSavedLogoDataUrl(data[APP_LOGO_DATA_URL_KEY] || null);
          setLogoPreviewUrl(data[APP_LOGO_DATA_URL_KEY] || null);
          
          // Load login page design settings
          setLoginBackgroundType((data[LOGIN_BACKGROUND_TYPE_KEY] as LoginBackgroundType) || DEFAULT_LOGIN_BACKGROUND_TYPE);
          setSavedLoginImageDataUrl(data[LOGIN_BACKGROUND_IMAGE_KEY] || null);
          setLoginImagePreviewUrl(data[LOGIN_BACKGROUND_IMAGE_KEY] || null);
          setLoginBackgroundGradientStart(data[LOGIN_BACKGROUND_GRADIENT_START_KEY] || DEFAULT_LOGIN_BACKGROUND_GRADIENT_START);
          setLoginBackgroundGradientEnd(data[LOGIN_BACKGROUND_GRADIENT_END_KEY] || DEFAULT_LOGIN_BACKGROUND_GRADIENT_END);
          setLoginBackgroundColor(data[LOGIN_BACKGROUND_COLOR_KEY] || DEFAULT_LOGIN_BACKGROUND_COLOR);
          
          // Load sidebar colors
          const newSidebarColors = createInitialSidebarColors();
          SIDEBAR_COLOR_KEYS.forEach(key => {
            if (data[key]) {
              (newSidebarColors as any)[key] = data[key];
            }
          });
          setSidebarColors(newSidebarColors);
          setSidebarCSSVars(newSidebarColors);
        } catch (e: any) {
          setErrorMsg(e.message);
        } finally {
          setLoading(false);
        }
      }
      fetchPrefs();
    }
  }, [sessionStatus, router, pathname, signIn]);

  useEffect(() => {
    setSidebarCSSVars(sidebarColors);
  }, [sidebarColors]);

  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 100 * 1024) { // Max 100KB
            error("Logo Too Large: Please select an image smaller than 100KB.");
            setSelectedLogoFile(null);
            setLogoPreviewUrl(savedLogoDataUrl);
            event.target.value = '';
            return;
        }
        setSelectedLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        error("Invalid File Type: Please select an image file (e.g., PNG, JPG, SVG).");
        setSelectedLogoFile(null);
        setLogoPreviewUrl(savedLogoDataUrl);
        event.target.value = '';
      }
    } else {
      setSelectedLogoFile(null);
      setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const removeSelectedLogo = (clearSaved: boolean = false) => {
    setSelectedLogoFile(null);
    const fileInput = document.getElementById('app-logo-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
    if (clearSaved) {
        setSavedLogoDataUrl(null);
        setLogoPreviewUrl(null);
        success("Logo Cleared: The application logo has been reset to default.");
    } else {
        setLogoPreviewUrl(savedLogoDataUrl);
    }
  };

  const handleLoginImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
        error('Login background image must be less than 500KB');
        return;
      }
      setSelectedLoginImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setLoginImagePreviewUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedLoginImage = (clearSaved: boolean = false) => {
    if (clearSaved) {
      setSavedLoginImageDataUrl(null);
      setLoginImagePreviewUrl(null);
    } else {
      setSelectedLoginImageFile(null);
      setLoginImagePreviewUrl(savedLoginImageDataUrl);
    }
  };

  const handleSavePreferences = async () => {
    if (!canEdit) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(false);
    try {
      const formData = new FormData();
      
      // System preferences
      formData.append('preferences', JSON.stringify([
        { key: APP_THEME_KEY, value: themePreference == null ? null : String(themePreference) },
        { key: APP_NAME_KEY, value: appName == null ? null : String(appName) },
        { key: LOGIN_BACKGROUND_TYPE_KEY, value: loginBackgroundType == null ? null : String(loginBackgroundType) },
        { key: LOGIN_BACKGROUND_GRADIENT_START_KEY, value: loginBackgroundGradientStart == null ? null : String(loginBackgroundGradientStart) },
        { key: LOGIN_BACKGROUND_GRADIENT_END_KEY, value: loginBackgroundGradientEnd == null ? null : String(loginBackgroundGradientEnd) },
        { key: LOGIN_BACKGROUND_COLOR_KEY, value: loginBackgroundColor == null ? null : String(loginBackgroundColor) },
      ]));
      
      // Logo file
      if (selectedLogoFile) {
        formData.append('logo', selectedLogoFile);
      }
      
      // Login background image file
      if (selectedLoginImageFile) {
        formData.append('loginBackgroundImage', selectedLoginImageFile);
      }
      
      // Sidebar colors
      SIDEBAR_COLOR_KEYS.forEach(key => {
        formData.append('preferences', JSON.stringify([{ key, value: sidebarColors[key] == null ? null : String(sidebarColors[key]) }]));
      });
      
      const res = await fetch('/api/settings/system-settings', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save preferences');
      }
      
      // Update saved states
      if (selectedLogoFile) {
        setSavedLogoDataUrl(logoPreviewUrl);
        setSelectedLogoFile(null);
      }
      
      if (selectedLoginImageFile) {
        setSavedLoginImageDataUrl(loginImagePreviewUrl);
        setSelectedLoginImageFile(null);
      }
      
      success('Preferences saved successfully!');
      setSuccessMsg(true);
      
      // Immediately update theme/colors in DOM
      setThemeAndColors({
        themePreference,
        primaryGradientStart: sidebarColors.sidebarActiveBgStartL,
        primaryGradientEnd: sidebarColors.sidebarActiveBgEndL,
        sidebarColors,
      });
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('appConfigChanged'));
      
    } catch (e: any) {
      setErrorMsg(e.message);
      console.error('Failed to save preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  function renderSidebarColorInputs(theme: 'Light' | 'Dark') {
    const suffix = theme === 'Light' ? 'L' : 'D';
    const keys: (keyof SidebarColors)[] = [
      `sidebarBgStart${suffix}` as keyof SidebarColors,
      `sidebarBgEnd${suffix}` as keyof SidebarColors,
      `sidebarText${suffix}` as keyof SidebarColors,
      `sidebarActiveBgStart${suffix}` as keyof SidebarColors,
      `sidebarActiveBgEnd${suffix}` as keyof SidebarColors,
      `sidebarActiveText${suffix}` as keyof SidebarColors,
      `sidebarHoverBg${suffix}` as keyof SidebarColors,
      `sidebarHoverText${suffix}` as keyof SidebarColors,
      `sidebarBorder${suffix}` as keyof SidebarColors,
    ];
    const labels: Record<string, string> = {
      [`sidebarBgStart${suffix}`]: "Background Start",
      [`sidebarBgEnd${suffix}`]: "Background End",
      [`sidebarText${suffix}`]: "Text Color",
      [`sidebarActiveBgStart${suffix}`]: "Active BG Start",
      [`sidebarActiveBgEnd${suffix}`]: "Active BG End",
      [`sidebarActiveText${suffix}`]: "Active Text",
      [`sidebarHoverBg${suffix}`]: "Hover Background",
      [`sidebarHoverText${suffix}`]: "Hover Text",
      [`sidebarBorder${suffix}`]: "Border Color",
    };
    return keys.map((key) => (
      <div key={key} className="space-y-2">
        <Label htmlFor={String(key)} className="text-sm font-medium">
          {labels[String(key)]}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={String(key)}
            type="text"
            value={sidebarColors[key] || ''}
            onChange={e => setSidebarColors((prev: SidebarColors) => ({ ...prev, [key]: e.target.value }))}
            placeholder="220 25% 97%"
            className="text-sm"
          />
          <Input
            type="color"
            value={convertHslStringToHex(sidebarColors[key])}
            onChange={e => setSidebarColors((prev: SidebarColors) => ({ ...prev, [key]: hexToHslString(e.target.value) }))}
            className="w-10 h-9 p-1 rounded-md border"
          />
        </div>
      </div>
    ));
  }

  function resetSidebarColors(theme: 'Light' | 'Dark') {
    const suffix = theme === 'Light' ? 'L' : 'D';
    const newSidebarColors = createInitialSidebarColors();
    setSidebarColors(newSidebarColors);
    setSidebarCSSVars(newSidebarColors);
  }

  if (loading || sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && pathname !== '/auth/signin' && !pathname.startsWith('/_next/')) || !isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">{errorMsg}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-6 w-6 text-primary" /> System Preferences
          </CardTitle>
          <CardDescription>Manage your application name, theme, and logo. Settings are global for all users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <PenSquare className="mr-2 h-5 w-5" /> App Name
            </h3>
            <div>
                <Label htmlFor="app-name-input">Application Name</Label>
                <Input
                id="app-name-input"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-1"
                placeholder="e.g., My ATS"
                disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground mt-1">
                This name will be displayed in the application header and other relevant places.
                </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2">Theme</h3>
            <RadioGroup
              value={themePreference}
              onValueChange={(value) => setThemePreference(value as ThemePreference)}
              className="flex flex-col sm:flex-row sm:space-x-4"
              disabled={!canEdit}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system">System Default</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-1">
              Note: This theme preference is saved locally. Actual theme switching is handled by the header toggle.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <ImageUp className="mr-2 h-5 w-5" /> App Logo
            </h3>
            <div>
              <Label htmlFor="app-logo-upload">Change App Logo (Recommended: square, max 100KB)</Label>
              <Input
                id="app-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="mt-1"
                disabled={!canEdit}
              />
              {logoPreviewUrl && (
                <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                  <Image src={logoPreviewUrl} alt="Logo preview" width={48} height={48} className="h-12 w-12 object-contain rounded" />
                  {selectedLogoFile && <span className="text-sm text-foreground truncate max-w-xs">{selectedLogoFile.name}</span>}
                  <Button variant="ghost" size="icon" onClick={() => removeSelectedLogo(false)} className="h-7 w-7">
                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                    <span className="sr-only">Cancel selection</span>
                  </Button>
                </div>
              )}
              {savedLogoDataUrl && (
                 <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => removeSelectedLogo(true)} disabled={!canEdit}>
                        <Trash2 className="mr-2 h-4 w-4"/> Reset to Default Logo
                    </Button>
                 </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Select an image to replace the application logo. Changes apply after saving preferences.
                Stored in the database as a data URL (max 100KB recommended).
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <LogIn className="mr-2 h-5 w-5" /> Login Page Design
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="login-background-type">Background Type</Label>
                <Select value={loginBackgroundType || ''} onValueChange={(value) => setLoginBackgroundType(value as LoginBackgroundType)} disabled={!canEdit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select background type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Background Image</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="solid">Solid Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loginBackgroundType === 'image' && (
                <div>
                  <Label htmlFor="login-background-image">Background Image (Recommended: landscape, max 500KB)</Label>
                  <Input
                    id="login-background-image"
                    type="file"
                    accept="image/*"
                    onChange={handleLoginImageFileChange}
                    className="mt-1"
                    disabled={!canEdit}
                  />
                  {loginImagePreviewUrl && (
                    <div className="mt-3 p-2 border rounded-md inline-flex items-center gap-3 bg-muted/50">
                      <Image src={loginImagePreviewUrl} alt="Login background preview" width={120} height={80} className="h-20 w-30 object-cover rounded" />
                      {selectedLoginImageFile && <span className="text-sm text-foreground truncate max-w-xs">{selectedLoginImageFile.name}</span>}
                      <Button variant="ghost" size="icon" onClick={() => removeSelectedLoginImage(false)} className="h-7 w-7">
                        <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                        <span className="sr-only">Cancel selection</span>
                      </Button>
                    </div>
                  )}
                  {savedLoginImageDataUrl && (
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => removeSelectedLoginImage(true)} disabled={!canEdit}>
                        <Trash2 className="mr-2 h-4 w-4"/> Remove Background Image
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Select an image for the login page background. Landscape orientation works best.
                  </p>
                </div>
              )}

              {loginBackgroundType === 'gradient' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="login-gradient-start">Gradient Start Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="login-gradient-start"
                        type="text"
                        value={loginBackgroundGradientStart}
                        onChange={(e) => setLoginBackgroundGradientStart(e.target.value)}
                        placeholder="179 67% 66%"
                        className="text-sm"
                        disabled={!canEdit}
                      />
                      <Input
                        type="color"
                        value={convertHslStringToHex(loginBackgroundGradientStart)}
                        onChange={(e) => setLoginBackgroundGradientStart(hexToHslString(e.target.value))}
                        className="w-10 h-9 p-1 rounded-md border"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="login-gradient-end">Gradient End Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="login-gradient-end"
                        type="text"
                        value={loginBackgroundGradientEnd}
                        onChange={(e) => setLoginBackgroundGradientEnd(e.target.value)}
                        placeholder="238 74% 61%"
                        className="text-sm"
                        disabled={!canEdit}
                      />
                      <Input
                        type="color"
                        value={convertHslStringToHex(loginBackgroundGradientEnd)}
                        onChange={(e) => setLoginBackgroundGradientEnd(hexToHslString(e.target.value))}
                        className="w-10 h-9 p-1 rounded-md border"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>
              )}

              {loginBackgroundType === 'solid' && (
                <div>
                  <Label htmlFor="login-solid-color">Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="login-solid-color"
                      type="text"
                      value={loginBackgroundColor}
                      onChange={(e) => setLoginBackgroundColor(e.target.value)}
                      placeholder="220 25% 97%"
                      className="text-sm"
                      disabled={!canEdit}
                    />
                    <Input
                      type="color"
                      value={convertHslStringToHex(loginBackgroundColor)}
                      onChange={(e) => setLoginBackgroundColor(hexToHslString(e.target.value))}
                      className="w-10 h-9 p-1 rounded-md border"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )}

              <div className="p-4 border rounded-lg bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Preview</h4>
                <div 
                  className="h-24 rounded-md relative overflow-hidden"
                  style={{
                    background: loginBackgroundType === 'image' && loginImagePreviewUrl 
                      ? `url(${loginImagePreviewUrl}) center/cover`
                      : loginBackgroundType === 'gradient'
                      ? `linear-gradient(135deg, hsl(${loginBackgroundGradientStart}), hsl(${loginBackgroundGradientEnd}))`
                      : `hsl(${loginBackgroundColor})`
                  }}
                >
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Login Page Background</span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                  <SidebarIcon className="mr-2 h-5 w-5" /> Sidebar Colors
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Customize the sidebar appearance for light and dark themes
                </p>
                <Tabs defaultValue="light-sidebar" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="light-sidebar" className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light Theme
                    </TabsTrigger>
                    <TabsTrigger value="dark-sidebar" className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark Theme
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="light-sidebar" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderSidebarColorInputs('Light')}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Light')}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Light Theme Colors
                    </Button>
                  </TabsContent>
                  <TabsContent value="dark-sidebar" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderSidebarColorInputs('Dark')}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => resetSidebarColors('Dark')}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Dark Theme Colors
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePreferences} className="btn-primary-gradient" disabled={saving || !canEdit}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {successMsg && <span className="ml-4 text-green-600">Preferences saved!</span>}
        </CardFooter>
      </Card>
    </div>
  );
} 