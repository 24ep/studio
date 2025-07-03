# Sidebar Styling Preferences

This document explains how the sidebar selected menu styling preferences work in the application.

## Overview

The application now supports customizable styling for selected menu items in the sidebar. Users can choose from four different styles through the preferences page.

## Available Styles

### 1. Gradient Background (Default)
- Uses a gradient background with the primary color
- White text for contrast
- Subtle shadow effect
- Modern and visually appealing

### 2. Solid Background
- Uses a solid primary color background
- White text for contrast
- Clean and simple appearance

### 3. Outline Border
- Transparent background with colored border
- Colored text matching the border
- Minimal and subtle appearance

### 4. Subtle Highlight
- Light background tint with primary color
- Colored text matching the primary color
- Very subtle and understated

## Implementation Details

### Storage
- Preferences are stored in `localStorage` with the key `sidebarActiveStylePreference`
- Default value is `'gradient'`

### CSS Classes
The styling is applied using CSS classes on the `document.documentElement`:
- `sidebar-active-gradient`
- `sidebar-active-solid`
- `sidebar-active-outline`
- `sidebar-active-subtle`

### Theme Support
Each style has both light and dark theme variants defined in `globals.css`.

### Files Modified
1. `src/app/settings/preferences/page.tsx` - Added sidebar style selector
2. `src/lib/themeUtils.ts` - Added utility functions for managing sidebar styles
3. `src/app/globals.css` - Added CSS classes for different styles
4. `src/components/layout/SidebarStyleInitializer.tsx` - New component to initialize styles
5. `src/components/layout/AppLayout.tsx` - Added the initializer component

## Usage

1. Navigate to Settings > Preferences
2. Find the "Sidebar Active Menu Style" section
3. Select your preferred style from the dropdown
4. Changes apply immediately for preview
5. Click "Save Preferences" to persist the setting

## Technical Notes

- The `data-active="true"` attribute on sidebar menu buttons triggers the styling
- Styles are applied using CSS custom properties and Tailwind classes
- The system supports both light and dark themes automatically
- Changes are applied immediately without requiring a page refresh 