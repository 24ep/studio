import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemePreference } from './constants';
import {
  GeneralTabAppNameCard,
  GeneralTabGenerativeAiCard,
  GeneralTabDefaultLanguageCard,
  GeneralTabThemeCard,
} from './GeneralTabParts';

interface GeneralTabProps {
  canEdit: boolean;
  appName: string;
  setAppName: (value: string) => void;
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
  defaultLanguage: string;
  setDefaultLanguage: (value: string) => void;
  generativeAICanvasMode: boolean;
  setGenerativeAICanvasMode: (value: boolean) => void;
}

export function GeneralTab({
  canEdit,
  appName,
  setAppName,
  themePreference,
  setThemePreference,
  defaultLanguage,
  setDefaultLanguage,
  generativeAICanvasMode,
  setGenerativeAICanvasMode,
}: GeneralTabProps) {
  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6">
        <GeneralTabAppNameCard
          appName={appName}
          canEdit={canEdit}
          setAppName={setAppName}
        />
        <GeneralTabThemeCard
          canEdit={canEdit}
          setThemePreference={setThemePreference}
          themePreference={themePreference}
        />
        <GeneralTabDefaultLanguageCard
          canEdit={canEdit}
          defaultLanguage={defaultLanguage}
          setDefaultLanguage={setDefaultLanguage}
        />
        <GeneralTabGenerativeAiCard
          canEdit={canEdit}
          generativeAICanvasMode={generativeAICanvasMode}
          setGenerativeAICanvasMode={setGenerativeAICanvasMode}
        />
      </div>
    </ScrollArea>
  );
}
