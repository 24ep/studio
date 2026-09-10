import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getEvaluateHeaderBackgroundStyle,
  normalizeEvaluatePageSystemPreferences,
} from './utils';

export function useEvaluationThemeSettings() {
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [sidebarBgColor, setSidebarBgColor] = useState('');
  const [evaluateHeaderBackgroundType, setEvaluateHeaderBackgroundType] = useState<'image' | 'gradient' | 'solid'>('gradient');
  const [evaluateHeaderBackgroundImage, setEvaluateHeaderBackgroundImage] = useState<string | null>(null);
  const [evaluateHeaderBackgroundGradient, setEvaluateHeaderBackgroundGradient] = useState<string | null>(null);
  const [evaluateHeaderBackgroundColor, setEvaluateHeaderBackgroundColor] = useState('220 25% 97%');
  const [evaluateHeaderTextColor, setEvaluateHeaderTextColor] = useState('0 0% 0%');
  const [interviewerSelectedBgColor, setInterviewerSelectedBgColor] = useState('220 25% 97%');
  const [interviewerSelectedTextColor, setInterviewerSelectedTextColor] = useState('0 0% 0%');
  const [interviewerSelectedBorderColor, setInterviewerSelectedBorderColor] = useState('220 15% 50%');
  const [interviewerSelectedBorderWidth, setInterviewerSelectedBorderWidth] = useState('2px');
  const [interviewerNonSelectedBgColor, setInterviewerNonSelectedBgColor] = useState('220 25% 97%');
  const [interviewerNonSelectedTextColor, setInterviewerNonSelectedTextColor] = useState('220 25% 50%');
  const [interviewerNonSelectedBorderColor, setInterviewerNonSelectedBorderColor] = useState('220 15% 85%');
  const [interviewerNonSelectedBorderWidth, setInterviewerNonSelectedBorderWidth] = useState('1px');
  const [interviewerNameColor, setInterviewerNameColor] = useState('220 25% 30%');

  useEffect(() => {
    const updateBackground = () => {
      if (typeof window === 'undefined') return;

      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      const bgVar = isDark ? '--sidebar-background-start-d' : '--sidebar-background-start-l';
      const bgValue = getComputedStyle(root).getPropertyValue(bgVar)?.trim();
      setSidebarBgColor(bgValue ? `hsl(${bgValue})` : 'hsl(var(--background))');
    };

    updateBackground();
    const observer = new MutationObserver(updateBackground);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const loadEvaluateThemeSettings = useCallback(async () => {
    try {
      const settingsResponse = await fetch('/api/settings/system-settings?keys=evaluateReportLogoDataUrl,evaluatePlatformLogoDataUrl,appLogoDataUrl,evaluateHeaderBackgroundType,evaluateHeaderBackgroundImageUrl,evaluateHeaderBackgroundGradient,evaluateHeaderBackgroundGradientStart,evaluateHeaderBackgroundGradientEnd,evaluateHeaderBackgroundColor,evaluateHeaderTextColor,interviewerSelectedBackgroundColor,interviewerSelectedTextColor,interviewerSelectedBorderColor,interviewerSelectedBorderWidth,interviewerNonSelectedBackgroundColor,interviewerNonSelectedTextColor,interviewerNonSelectedBorderColor,interviewerNonSelectedBorderWidth,interviewerNameColor');
      if (!settingsResponse.ok) {
        return;
      }

      const prefs = normalizeEvaluatePageSystemPreferences(await settingsResponse.json());
      setAppLogoUrl(prefs.appLogoUrl);
      setEvaluateHeaderBackgroundType(prefs.evaluateHeaderBackgroundType);
      setEvaluateHeaderBackgroundImage(prefs.evaluateHeaderBackgroundImage);
      setEvaluateHeaderBackgroundGradient(prefs.evaluateHeaderBackgroundGradient);
      setEvaluateHeaderBackgroundColor(prefs.evaluateHeaderBackgroundColor);
      setEvaluateHeaderTextColor(prefs.evaluateHeaderTextColor);
      setInterviewerSelectedBgColor(prefs.interviewerSelectedBgColor);
      setInterviewerSelectedTextColor(prefs.interviewerSelectedTextColor);
      setInterviewerSelectedBorderColor(prefs.interviewerSelectedBorderColor);
      setInterviewerSelectedBorderWidth(prefs.interviewerSelectedBorderWidth);
      setInterviewerNonSelectedBgColor(prefs.interviewerNonSelectedBgColor);
      setInterviewerNonSelectedTextColor(prefs.interviewerNonSelectedTextColor);
      setInterviewerNonSelectedBorderColor(prefs.interviewerNonSelectedBorderColor);
      setInterviewerNonSelectedBorderWidth(prefs.interviewerNonSelectedBorderWidth);
      setInterviewerNameColor(prefs.interviewerNameColor);
    } catch {
      // Settings are optional; defaults keep the evaluation page usable.
    }
  }, []);

  const evaluateHeaderStyle = useMemo(() => getEvaluateHeaderBackgroundStyle({
    type: evaluateHeaderBackgroundType,
    image: evaluateHeaderBackgroundImage,
    gradient: evaluateHeaderBackgroundGradient,
    color: evaluateHeaderBackgroundColor,
    fallbackColor: sidebarBgColor,
  }), [
    evaluateHeaderBackgroundType,
    evaluateHeaderBackgroundImage,
    evaluateHeaderBackgroundGradient,
    evaluateHeaderBackgroundColor,
    sidebarBgColor,
  ]);

  return {
    appLogoUrl,
    sidebarBgColor,
    evaluateHeaderBackgroundType,
    evaluateHeaderBackgroundImage,
    evaluateHeaderBackgroundGradient,
    evaluateHeaderBackgroundColor,
    evaluateHeaderTextColor,
    interviewerSelectedBgColor,
    interviewerSelectedTextColor,
    interviewerSelectedBorderColor,
    interviewerSelectedBorderWidth,
    interviewerNonSelectedBgColor,
    interviewerNonSelectedTextColor,
    interviewerNonSelectedBorderColor,
    interviewerNonSelectedBorderWidth,
    interviewerNameColor,
    evaluateHeaderStyle,
    loadEvaluateThemeSettings,
  };
}
