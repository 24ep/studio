"use client";

import { useState, useEffect } from 'react';
import { getSystemSettingEnum } from '@/lib/system-settings-response';

export type DrawerStyle = 'classic' | 'modern';

const DEFAULT_DRAWER_STYLE: DrawerStyle = 'classic';
const DRAWER_STYLE_KEY = 'drawerStyle';
const DRAWER_STYLE_OPTIONS: readonly DrawerStyle[] = ['classic', 'modern'];

export function useDrawerStyle(): DrawerStyle {
  const [drawerStyle, setDrawerStyle] = useState<DrawerStyle>(DEFAULT_DRAWER_STYLE);

  useEffect(() => {
    const fetchDrawerStyle = async () => {
      try {
        const response = await fetch('/api/settings/system-settings?keys=drawerStyle');
        if (!response.ok) return;
        
        const data: unknown = await response.json();
        const style = getSystemSettingEnum(data, DRAWER_STYLE_KEY, DRAWER_STYLE_OPTIONS, DEFAULT_DRAWER_STYLE);
        setDrawerStyle(style);
      } catch (error) {
        console.error('Error fetching drawer style:', error);
      }
    };

    fetchDrawerStyle();
  }, []);

  return drawerStyle;
}

