export interface PwaTabProps {
  pwaEnabled: boolean;
  setPwaEnabled: (val: boolean) => void;
  pwaName: string;
  setPwaName: (val: string) => void;
  pwaShortName: string;
  setPwaShortName: (val: string) => void;
  pwaDescription: string;
  setPwaDescription: (val: string) => void;
  pwaThemeColor: string;
  setPwaThemeColor: (val: string) => void;
  pwaBackgroundColor: string;
  setPwaBackgroundColor: (val: string) => void;
  pwaAppleMobileWebAppTitle: string;
  setPwaAppleMobileWebAppTitle: (val: string) => void;
  pwaAppleMobileWebAppStatusBarStyle: string;
  setPwaAppleMobileWebAppStatusBarStyle: (val: string) => void;
  isSaving: boolean;
}
